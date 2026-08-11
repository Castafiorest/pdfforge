#!/usr/bin/env bash
# PDFForge — one-shot installer for Debian (GNOME or Server, low-spec friendly).
#
# Usage (from the repo root):
#   sudo bash deploy/debian-gnome/install.sh
#
# What it does:
#   1. Installs system packages (ghostscript, nginx, nodejs, python3-venv, zram).
#   2. Sets up the Python venv and installs backend requirements.
#   3. Builds the frontend into apps/web/dist.
#   4. Installs + enables systemd services (api + worker) — auto-start on boot.
#   5. Configures nginx (serves the UI, proxies /api).
#   6. Enables ZRAM swap (2 GB) for RAM headroom.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
USER_NAME="${SUDO_USER:-$(id -un)}"
GROUP_NAME="$(id -gn "$USER_NAME" 2>/dev/null || echo "$USER_NAME")"
API_DIR="$REPO/apps/api"
VENV="$API_DIR/.venv"
DATA_DIR="$REPO/data"
TMP_DIR="$DATA_DIR/tmp"
ENV_FILE="$SCRIPT_DIR/pdfforge.env"
SERVICE_DIR="/etc/systemd/system"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run with sudo:  sudo bash deploy/debian-gnome/install.sh" >&2
  exit 1
fi

echo "=== PDFForge installer ==="
echo "Repo : $REPO"
echo "User : $USER_NAME"
echo ""

# 1) System packages ─────────────────────────────────────────────────────
echo "→ Installing system packages (ghostscript, nginx, nodejs, python3-venv…)"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ghostscript \
  libgl1 libglib2.0-0 \
  fonts-dejavu-core \
  python3 python3-venv python3-pip \
  nodejs npm \
  nginx
apt-get install -y zram-tools || echo "(zram-tools unavailable on this Debian — skipping ZRAM)"

# Node too old? Install Node 20 from NodeSource.
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "→ Node.js $(node -v) is too old for Vite. Installing Node 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 2) Python venv ─────────────────────────────────────────────────────────
echo "→ Setting up Python virtualenv"
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --upgrade pip -q
"$VENV/bin/pip" install -r "$API_DIR/requirements.txt" -q

# 3) Frontend build ──────────────────────────────────────────────────────
echo "→ Building frontend (first npm install may take a while)"
if [ ! -d "$REPO/node_modules" ]; then
  (cd "$REPO" && npm install --no-audit --no-fund)
fi
(cd "$REPO" && npm run build)

# 4) Data directories ────────────────────────────────────────────────────
echo "→ Preparing data directories"
mkdir -p "$DATA_DIR" "$TMP_DIR"
chown -R "$USER_NAME:$GROUP_NAME" "$DATA_DIR"

# 5) Systemd services ────────────────────────────────────────────────────
echo "→ Installing systemd services (auto-start on boot)"
for unit in pdfforge-api pdfforge-worker; do
  sed -e "s|@REPO@|$REPO|g" \
      -e "s|@USER@|$USER_NAME|g" \
      -e "s|@ENV_FILE@|$ENV_FILE|g" \
      "$SCRIPT_DIR/$unit.service" > "$SERVICE_DIR/$unit.service"
done
sed -e "s|@REPO@|$REPO|g" "$SCRIPT_DIR/pdfforge.env" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

systemctl daemon-reload
systemctl enable pdfforge-api.service pdfforge-worker.service
systemctl restart pdfforge-api.service pdfforge-worker.service

# 6) Nginx ───────────────────────────────────────────────────────────────
echo "→ Configuring nginx"
sed -e "s|@REPO@|$REPO|g" "$SCRIPT_DIR/pdfforge-nginx.conf" \
  > /etc/nginx/sites-available/pdfforge
ln -sf /etc/nginx/sites-available/pdfforge /etc/nginx/sites-enabled/pdfforge
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

# 7) ZRAM (RAM headroom for 4 GB machines) ───────────────────────────────
if systemctl list-unit-files 2>/dev/null | grep -q zramswap; then
  echo "→ Enabling ZRAM swap (2 GB)"
  sed -i 's|^#\?ALGO=.*|ALGO=zstd|; s|^#\?SIZE=.*|SIZE=2048|' /etc/default/zramswap
  systemctl enable --now zramswap.service || true
fi

# 8) Done ────────────────────────────────────────────────────────────────
echo ""
echo "=== ✅ PDFForge installed ==="
echo "Web   : http://localhost"
echo "API   : http://localhost/api/v1/health"
echo ""
echo "Status: systemctl status pdfforge-api pdfforge-worker nginx"
echo "Logs  : journalctl -u pdfforge-api -f"
echo ""
echo "Tip (low-spec): switch GNOME to console-only on boot to free ~1 GB RAM:"
echo "    sudo systemctl set-default multi-user.target"
