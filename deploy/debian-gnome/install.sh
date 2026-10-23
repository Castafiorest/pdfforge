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
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
USER_NAME="${SUDO_USER:-$(id -un)}"
GROUP_NAME="$(id -gn "$USER_NAME" 2>/dev/null || echo "$USER_NAME")"
API_DIR="$REPO/apps/api"
VENV="$API_DIR/.venv"
DATA_DIR="$REPO/data"
TMP_DIR="$DATA_DIR/tmp"
# Render the env to a system path (NOT inside the repo) so the git-tracked
# template in deploy/debian-gnome/pdfforge.env keeps its @REPO@ placeholders.
ENV_FILE="/etc/pdfforge.env"
SERVICE_DIR="/etc/systemd/system"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run with sudo:  sudo bash deploy/debian-gnome/install.sh" >&2
  exit 1
fi

# Debian/Ubuntu only: this script relies on apt, systemd and Debian package names.
if [ ! -r /etc/os-release ]; then
  echo "Cannot detect the OS (/etc/os-release missing). This installer targets Debian 12+." >&2
  exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
case "${ID:-} ${ID_LIKE:-}" in
  *debian* | *ubuntu*) ;;
  *)
    echo "Unsupported OS: ${PRETTY_NAME:-unknown}. This installer targets Debian 12+." >&2
    exit 1
    ;;
esac
DISTRO_MAJOR="${VERSION_ID%%.*}"
if [ "${ID:-}" = "debian" ] && [ -n "$DISTRO_MAJOR" ] && [ "$DISTRO_MAJOR" -lt 12 ]; then
  echo "Debian ${VERSION_ID} is too old. This installer targets Debian 12+." >&2
  exit 1
fi

echo "=== PDFForge installer ==="
echo "Repo : $REPO"
echo "User : $USER_NAME"
echo ""

# 1) System packages ─────────────────────────────────────────────────────
echo "→ Installing system packages (ghostscript, nginx, nodejs, python3-venv…)"
apt-get update -qq
# libglib2.0-0 was renamed to libglib2.0-0t64 in Debian 13 / Ubuntu 24.04.
GLIB_PKG="libglib2.0-0"
if apt-cache show libglib2.0-0t64 >/dev/null 2>&1; then
  GLIB_PKG="libglib2.0-0t64"
fi
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ghostscript \
  libgl1 "$GLIB_PKG" \
  fonts-dejavu-core \
  python3 python3-venv python3-pip \
  nodejs npm \
  nginx
apt-get install -y zram-tools || echo "(zram-tools unavailable on this Debian — skipping ZRAM)"

# Vite 7 needs Node ^20.19.0 || >=22.12.0 — a bare major-version check is not
# enough (Debian 12 ships Node 18, Debian 13 ships 20.19).
node_supports_vite() {
  command -v node >/dev/null 2>&1 || return 1
  local major minor
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  minor="$(node -p 'process.versions.node.split(".")[1]' 2>/dev/null || echo 0)"
  if [ "$major" -gt 22 ]; then return 0; fi
  if [ "$major" -eq 22 ] && [ "$minor" -ge 12 ]; then return 0; fi
  if [ "$major" -eq 20 ] && [ "$minor" -ge 19 ]; then return 0; fi
  return 1
}

if ! node_supports_vite; then
  echo "→ Node.js $(node -v 2>/dev/null || echo 'not installed') cannot run Vite 7. Installing Node.js 22 LTS…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
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
# npm ci (not install): the committed lockfile is authoritative, so a Linux
# box never rewrites a lockfile generated on another OS and builds stay
# reproducible. It also fails loudly if package.json and the lockfile drift.
echo "→ Installing JS dependencies + building frontend"
(cd "$REPO" && npm ci --no-audit --no-fund)
(cd "$REPO" && npm run build)
# Keep build artifacts and installed deps owned by the user so they can rebuild
# without sudo (npm runs as root here, including the npm ci above).
chown -R "$USER_NAME:$GROUP_NAME" "$REPO/apps/web/dist" "$REPO/node_modules"

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
# Auto-deploy: pull the production branch (`master`), rebuild, restart.
sed -e "s|@REPO@|$REPO|g" \
  "$SCRIPT_DIR/pdfforge-deploy.service" > "$SERVICE_DIR/pdfforge-deploy.service"
sed -e "s|@INTERVAL@|${DEPLOY_INTERVAL:-5min}|g" \
  "$SCRIPT_DIR/pdfforge-deploy.timer" > "$SERVICE_DIR/pdfforge-deploy.timer"
# Render the env template (@REPO@ placeholders) into the system env file.
sed -e "s|@REPO@|$REPO|g" "$SCRIPT_DIR/pdfforge.env" > "$ENV_FILE"
chown "$USER_NAME:$GROUP_NAME" "$ENV_FILE"
chmod 600 "$ENV_FILE"

systemctl daemon-reload
systemctl enable pdfforge-api.service pdfforge-worker.service
systemctl restart pdfforge-api.service pdfforge-worker.service
systemctl enable --now pdfforge-deploy.timer

# 6) Nginx ───────────────────────────────────────────────────────────────
# nginx runs as www-data; allow it to traverse the user's home directory
# so it can serve the built frontend (chmod o+x = traverse, no listing).
USER_HOME="$(getent passwd "$USER_NAME" | cut -d: -f6)"
[ -n "$USER_HOME" ] && chmod o+x "$USER_HOME"
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
echo "Deploy: systemctl list-timers pdfforge-deploy.timer (pulls origin/master)"
echo ""
echo "Tip (low-spec): switch GNOME to console-only on boot to free ~1 GB RAM:"
echo "    sudo systemctl set-default multi-user.target"
