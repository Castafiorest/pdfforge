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

## Option B — Manual setup

### 1. Install system packages

```bash
sudo apt update
sudo apt install -y ghostscript libgl1 libglib2.0-0 fonts-dejavu-core \
  python3 python3-venv python3-pip nodejs npm nginx zram-tools
```

> Node must be ≥ 18 for Vite. If `node -v` is older, install Node 20:
> `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash && sudo apt install -y nodejs`

### 2. Backend (venv)

```bash
cd apps/api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Frontend (build)

```bash
cd <repo root>
npm install
npm run build
```

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
