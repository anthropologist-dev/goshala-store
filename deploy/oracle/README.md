# Hosting on Oracle Cloud (Always Free)

Everything below works from a phone browser. Total time: about 30 minutes, most of it waiting.

## 1. Create the Oracle account
Sign up at **cloud.oracle.com/free**. Pick a **home region** close to your customers (e.g. *India South (Hyderabad)* or *India West (Mumbai)*); free VMs can only be created there and it can't be changed later. A card is needed for verification; Always Free resources aren't charged.

## 2. Make an SSH key in Cloud Shell
In the Oracle console, tap the **Cloud Shell** icon (`>_`, top right) and run:
```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/goshala && cat ~/.ssh/goshala.pub
```
Copy the line it prints.

## 3. Create the VM
Menu → **Compute → Instances → Create instance**
- **Image:** Canonical **Ubuntu 24.04**
- **Shape:** Ampere → **VM.Standard.A1.Flex**, **1 OCPU, 6 GB** (leaves room for a second free VM later). If you get "out of capacity", try another availability domain or try again later; the AMD **VM.Standard.E2.1.Micro** also works (slower builds).
- **Networking:** keep "Assign a public IPv4 address" on
- **SSH keys:** "Paste public keys" → paste the line from step 2
- Create, and note the **Public IP** once it's running.

## 4. Open web ports
Instance page → click the **Subnet** → **Security Lists** → *Default Security List* → **Add Ingress Rules**:
- Source CIDR `0.0.0.0/0`, TCP, destination port `80`
- Source CIDR `0.0.0.0/0`, TCP, destination port `443`

## 5. Point your domain (optional now, needed for HTTPS)
At Hostinger's DNS settings, set **A records** for `www` and `@` to the VM's public IP. You can skip this and test on the IP first; re-run the script after DNS changes to turn on HTTPS.

## 6. Run the setup
Back in Cloud Shell:
```bash
ssh -i ~/.ssh/goshala ubuntu@YOUR_PUBLIC_IP
curl -fsSL https://raw.githubusercontent.com/anthropologist-dev/goshala-store/main/deploy/oracle/setup.sh -o setup.sh && sudo bash setup.sh
```
It asks for the domain and your admin email/password, then installs and starts everything (10–15 minutes on first run). When it prints **✅ Store is running**, open the address and log in at `/admin`.

## Afterwards
- **Update after code changes:** `sudo bash /opt/goshala-store/deploy/oracle/update.sh`
- **Logs:** `sudo journalctl -u goshala -f`
- **Backups:** a database dump is saved daily in `/var/backups/goshala` (14 days kept). Copy one off the server now and then (e.g. `scp` from Cloud Shell); they're lost if the VM is deleted.
- **Idle reclamation:** Oracle may reclaim Always Free VMs that stay under 20% CPU, network and memory use for 7 days. A small shop can look idle, so keep the backups current.
