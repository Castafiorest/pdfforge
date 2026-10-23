# Self-hosting on Debian GNOME (low-spec)

Target hardware: **Lenovo V110-15AST · AMD A9-9420 (2-core) · 4 GB RAM · 128 GB SSD · Debian GNOME**

Two options: the **one-shot installer** (recommended) or the **manual steps** below it.

---

## Option A — One-shot installer

From the repository root:

```bash
sudo bash deploy/debian-gnome/install.sh
```

That installs everything: Ghostscript, nginx, Node, Python venv, builds the frontend,
installs two systemd services (auto-start on boot), configures nginx, and enables ZRAM swap.

Then just open **http://localhost**.

---

## Auto-deploy (after the first install)

`master` is the production branch: code reaches it only through a reviewed pull
request whose CI run is green. The server checks `origin/master` every 5 minutes
(`pdfforge-deploy.timer`), pulls it, rebuilds only what changed, and restarts the
API/worker when the backend changed.

```
main ──push──► PR main → master (CI must pass) ──merge──► server updates ≤5 min
```

So releasing only needs a merge on GitHub — no shell session on the server.

Enforce the gate in **Settings → Branches → Add branch ruleset** for `master`:
require a pull request and the `CI` status check before merging.

```bash
systemctl list-timers pdfforge-deploy.timer          # next scheduled check
journalctl -u pdfforge-deploy -f                     # deploy log
sudo systemctl start pdfforge-deploy.service         # deploy now, don't wait
sudo systemctl disable --now pdfforge-deploy.timer   # turn auto-deploy off
```

> The server is a **deploy target**: anything edited there is overwritten on the
> next deploy. Change the interval at install time with
> `sudo DEPLOY_INTERVAL=15min bash deploy/debian-gnome/install.sh`.

---

## Option B — Manual setup

### 1. Install system packages

```bash
sudo apt update
# Debian 13+ / Ubuntu 24.04+ ship libglib2.0-0t64; on Debian 12 use libglib2.0-0.
GLIB_PKG=libglib2.0-0t64
sudo apt install -y ghostscript libgl1 "$GLIB_PKG" fonts-dejavu-core \
  python3 python3-venv python3-pip nodejs npm nginx zram-tools
```

> Vite 7 requires **Node `^20.19.0` or `>=22.12.0`** — a plain `node >= 20` is not
> enough (Node 20.0–20.18 fails). If `node -v` is older, install Node 22 LTS:
> `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash && sudo apt install -y nodejs`

### 2. Backend (venv)

```bash
cd apps/api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Frontend (build)

```bash
cd <repo root>
npm ci
npm run build
```

> Use `npm ci`, not `npm install`: it installs exactly what `package-lock.json`
> specifies and never rewrites the lockfile, so a Linux server does not produce
> lockfile churn when the lockfile was generated on another OS.

### 4. Environment (low-spec tuned)

Copy the tuned env and edit paths if your repo is not in the default location:

```bash
mkdir -p data/tmp
cp deploy/debian-gnome/pdfforge.env apps/api/.env
# Edit apps/api/.env: replace @REPO@ with the repo path
```

Key values for 4 GB RAM:

```env
MAX_CONCURRENT_JOBS=1     # NEVER raise this on 4 GB
MAX_FILE_SIZE_MB=40
MAX_PAGES=300
JOB_TTL_MINUTES=15
```

### 5. systemd services (auto-start on boot)

```bash
sudo cp deploy/debian-gnome/pdfforge-api.service /etc/systemd/system/
sudo cp deploy/debian-gnome/pdfforge-worker.service /etc/systemd/system/
# Edit both: replace @REPO@, @USER@ and @ENV_FILE@ with real values
sudo systemctl daemon-reload
sudo systemctl enable --now pdfforge-api pdfforge-worker
```

### 6. nginx

```bash
sudo cp deploy/debian-gnome/pdfforge-nginx.conf /etc/nginx/sites-available/pdfforge
sudo ln -sf /etc/nginx/sites-available/pdfforge /etc/nginx/sites-enabled/pdfforge
sudo rm -f /etc/nginx/sites-enabled/default
# Edit /etc/nginx/sites-available/pdfforge: replace @REPO@ with the repo path
sudo nginx -t && sudo systemctl reload nginx
```

### 7. ZRAM swap (strongly recommended for 4 GB)

```bash
sudo sed -i 's/^#\?ALGO=.*/ALGO=zstd/; s/^#\?SIZE=.*/SIZE=2048/' /etc/default/zramswap
sudo systemctl enable --now zramswap.service
```

---

## Useful for low-spec

**Free ~1 GB of RAM by booting to console** (GNOME stays installed, start it manually with `startx`):

```bash
sudo systemctl set-default multi-user.target   # boot to console (saves ~1 GB)
sudo systemctl set-default graphical.target    # back to GNOME
```

**Verify after install:**

```bash
free -h                          # RAM + ZRAM
systemctl status pdfforge-api pdfforge-worker nginx
curl -s http://localhost/api/v1/health   # → {"status":"ok",...}
```

## Updating

```bash
git pull
sudo bash deploy/debian-gnome/install.sh   # rebuilds + restarts (idempotent)
```

## Expected performance (A9-9420, 2-core)

| File size | Approx. processing time |
| --- | --- |
| 5 MB | ~15–30 s |
| 20 MB | ~1 min |
| 40 MB (max) | ~2–3 min |

Perfectly fine for personal / family use. For public multi-user use, consider a stronger CPU.
