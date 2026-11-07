#!/usr/bin/env bash
# Pull the latest code, rebuild, apply database migrations and restart.
set -euo pipefail
APP_DIR=/opt/goshala-store
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo"; exit 1; }
cd "$APP_DIR"
/etc/cron.daily/goshala-backup   # backup before changing anything
sudo -u goshala git pull --ff-only
sudo -u goshala bash -c "set -a; . ./.env; set +a; npm ci --no-audit --no-fund && npm run build && npm run setup"
systemctl restart goshala
echo "✅ Updated"
