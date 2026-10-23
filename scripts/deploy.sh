#!/usr/bin/env bash
# PDFForge auto-deploy — runs on the server, pulls the promoted `production`
# branch, rebuilds only what changed, and restarts the services.
#
# The server is a deploy target: local modifications in the worktree are
# overwritten. Run it as root (the systemd unit does) or via sudo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
BRANCH="${DEPLOY_BRANCH:-production}"
VENV="$REPO/apps/api/.venv"

cd "$REPO"

# Git/npm must not run as root against a user-owned checkout (dubious
# ownership errors, root-owned node_modules); systemctl still needs root.
OWNER="$(stat -c '%U' "$REPO")"
if [ "$(id -u)" -eq 0 ] && [ "$OWNER" != "root" ]; then
  as_owner() { runuser -u "$OWNER" -- "$@"; }
else
  as_owner() { "$@"; }
fi

say() { echo "[deploy] $*"; }

as_owner git fetch --prune --quiet origin

if ! as_owner git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  say "origin/$BRANCH does not exist yet (CI has not promoted a green main commit). Skipping."
  exit 0
fi

current="$(as_owner git rev-parse HEAD)"
target="$(as_owner git rev-parse "origin/$BRANCH")"

if [ "$current" = "$target" ]; then
  say "Already at ${current:0:7}. Nothing to do."
  exit 0
fi

say "Deploying $BRANCH: ${current:0:7} → ${target:0:7}"

# True when the given paths differ between the deployed and the new commit.
changed() { as_owner git diff --name-only "$current" "$target" -- "$@" | grep -q .; }

as_owner git checkout -q -f -B "$BRANCH" "$target"

if [ -x "$VENV/bin/pip" ] && changed apps/api/requirements.txt; then
  say "Updating Python dependencies"
  as_owner "$VENV/bin/pip" install -q -r apps/api/requirements.txt
fi

if [ ! -d "$REPO/node_modules" ] || changed package.json package-lock.json; then
  say "Installing JS dependencies"
  as_owner npm ci --no-audit --no-fund
fi

if changed apps/web packages/shared package.json package-lock.json; then
  say "Building frontend"
  as_owner npm run build
fi

if [ "$(id -u)" -ne 0 ]; then
  say "Not running as root — skipping service restart."
elif changed apps/api; then
  say "Restarting API + worker"
  systemctl restart pdfforge-api.service pdfforge-worker.service
else
  say "Backend unchanged — no service restart needed."
fi

say "Done: now serving $BRANCH at ${target:0:7}."
