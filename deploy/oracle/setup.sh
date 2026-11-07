#!/usr/bin/env bash
# One-time setup of the goshala store on an Oracle Cloud Always Free VM (Ubuntu 22.04/24.04, Ampere A1 or AMD).
# Installs Node 22, PostgreSQL, nginx, HTTPS (Let's Encrypt), a systemd service and daily database backups.
#
#   curl -fsSL https://raw.githubusercontent.com/anthropologist-dev/goshala-store/main/deploy/oracle/setup.sh | sudo bash
#
# Safe to re-run: it keeps the existing database, passwords and .env.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/anthropologist-dev/goshala-store.git}"
BRANCH="${BRANCH:-main}"
APP_DIR=/opt/goshala-store
APP_USER=goshala
PORT=3000

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo"; exit 1; }
exec </dev/tty   # allow prompts even when piped from curl

ask() { local v; read -rp "$1" v; echo "$v"; }

echo "== Sri Shivasadguru Goshala store setup =="
if [ ! -f "$APP_DIR/.env" ]; then
  DOMAIN=$(ask "Domain for the store (e.g. www.srishivasadgurugoshala.com, or leave blank to use the IP for now): ")
  ADMIN_EMAIL=$(ask "Admin login email: ")
  while :; do
    read -rsp "Admin password (min 10 chars): " ADMIN_PASSWORD; echo
    [ ${#ADMIN_PASSWORD} -ge 10 ] && break; echo "Too short."
  done
else
  DOMAIN=$(grep -oP '^SITE_DOMAIN="\K[^"]*' "$APP_DIR/.env" || true)
fi

echo "== Installing packages =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx postgresql postgresql-contrib ca-certificates gnupg certbot python3-certbot-nginx iptables-persistent
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Small VMs need swap to build Next.js
if [ ! -f /swapfile ] && [ "$(free -m | awk '/Mem:/{print $2}')" -lt 4000 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== Opening ports 80/443 in the VM firewall =="
# Oracle's Ubuntu images ship iptables rules that reject everything except SSH.
for p in 80 443; do
  if ! iptables -C INPUT -p tcp --dport $p -m state --state NEW -j ACCEPT 2>/dev/null; then
    n=$(iptables -L INPUT --line-numbers -n | awk '$2=="REJECT"{print $1; exit}')
    iptables -I INPUT "${n:-1}" -p tcp --dport $p -m state --state NEW -j ACCEPT
  fi
done
netfilter-persistent save

echo "== App user and code =="
id -u $APP_USER >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin $APP_USER
if [ -d "$APP_DIR/.git" ]; then
  sudo -u $APP_USER git -C "$APP_DIR" pull --ff-only
else
  mkdir -p "$APP_DIR" && chown $APP_USER: "$APP_DIR"
  sudo -u $APP_USER git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

echo "== Database =="
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS=$(openssl rand -hex 24)
  sudo -u postgres psql -tc "select 1 from pg_roles where rolname='goshala'" | grep -q 1 ||
    sudo -u postgres psql -c "create role goshala login password '$DB_PASS'"
  sudo -u postgres psql -c "alter role goshala password '$DB_PASS'"
  sudo -u postgres psql -tc "select 1 from pg_database where datname='goshala'" | grep -q 1 ||
    sudo -u postgres createdb -O goshala goshala
  SITE_URL="http://$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')"
  [ -n "$DOMAIN" ] && SITE_URL="https://$DOMAIN"
  umask 077
  cat > "$APP_DIR/.env" <<ENV
DATABASE_URL="postgresql://goshala:$DB_PASS@127.0.0.1:5432/goshala"
AUTH_SECRET="$(openssl rand -hex 32)"
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
NEXT_PUBLIC_SITE_URL="$SITE_URL"
SITE_DOMAIN="$DOMAIN"
ENV
  chown $APP_USER: "$APP_DIR/.env"; chmod 600 "$APP_DIR/.env"
fi

echo "== Build =="
cd "$APP_DIR"
sudo -u $APP_USER bash -c "set -a; . ./.env; set +a; npm ci --no-audit --no-fund && npm run build && npm run setup"
# The admin password is now stored (hashed) in the database; drop the plain copy.
sed -i 's/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=""/' "$APP_DIR/.env"

echo "== Service =="
cat > /etc/systemd/system/goshala.service <<UNIT
[Unit]
Description=Goshala store
After=network.target postgresql.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
Environment=NODE_ENV=production
ExecStart=$APP_DIR/node_modules/.bin/next start -p $PORT -H 127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now goshala
systemctl restart goshala

echo "== nginx =="
SERVER_NAME="${DOMAIN:-_}"
[ -n "$DOMAIN" ] && [[ "$DOMAIN" == www.* ]] && SERVER_NAME="$DOMAIN ${DOMAIN#www.}"
cat > /etc/nginx/sites-available/goshala <<NGINX
server {
    listen 80 default_server;
    server_name $SERVER_NAME;
    client_max_body_size 5m;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf /etc/nginx/sites-available/goshala /etc/nginx/sites-enabled/goshala
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "== Daily backups (kept 14 days in /var/backups/goshala) =="
mkdir -p /var/backups/goshala && chown postgres: /var/backups/goshala
cat > /etc/cron.daily/goshala-backup <<'CRON'
#!/bin/sh
f=/var/backups/goshala/goshala-$(date +%F).sql.gz
sudo -u postgres pg_dump goshala | gzip > "$f"
find /var/backups/goshala -name '*.sql.gz' -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/goshala-backup

if [ -n "$DOMAIN" ]; then
  echo "== HTTPS =="
  IP=$(curl -s -4 ifconfig.me || true)
  if getent hosts "$DOMAIN" | grep -q "$IP"; then
    CERT_DOMAINS="-d $DOMAIN"; [[ "$DOMAIN" == www.* ]] && getent hosts "${DOMAIN#www.}" | grep -q "$IP" && CERT_DOMAINS="$CERT_DOMAINS -d ${DOMAIN#www.}"
    certbot --nginx $CERT_DOMAINS --non-interactive --agree-tos --register-unsafely-without-email --redirect || echo "!! HTTPS setup failed; re-run this script once DNS is correct."
  else
    echo "!! $DOMAIN doesn't point to this server ($IP) yet. Point the DNS A record here, then re-run this script to enable HTTPS."
  fi
fi

sleep 3
if curl -sf -o /dev/null http://127.0.0.1:$PORT/; then
  echo; echo "✅ Store is running."
  echo "   Visit: $(grep -oP '^NEXT_PUBLIC_SITE_URL="\K[^"]*' "$APP_DIR/.env")   Admin: /admin"
  echo "   Logs:  sudo journalctl -u goshala -f      Update later: sudo bash $APP_DIR/deploy/oracle/update.sh"
else
  echo "!! The app didn't start. Check: sudo journalctl -u goshala -n 50"; exit 1
fi
