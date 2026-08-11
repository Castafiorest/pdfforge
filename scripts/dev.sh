#!/usr/bin/env bash
# PDFForge — local development runner.
# Starts API + worker + web with live reload. Requires Python 3.11+ and Node 20+.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/apps/api"

# 1) Backend venv + deps
if [ ! -d "$API/.venv" ]; then
  echo "→ Creating Python venv…"
  python3 -m venv "$API/.venv"
fi
# shellcheck disable=SC1091
source "$API/.venv/bin/activate"
pip install -q -r "$API/requirements-dev.txt"

# 2) Frontend deps
if [ ! -d "$ROOT/node_modules" ]; then
  echo "→ Installing npm dependencies…"
  (cd "$ROOT" && npm install)
fi

export TEMP_DIR="${TEMP_DIR:-$ROOT/.tmp}"
export DATABASE_URL="${DATABASE_URL:-sqlite:///$ROOT/apps/api/data/pdfforge.db}"
export RATE_LIMIT_ENABLED="${RATE_LIMIT_ENABLED:-true}"
mkdir -p "$TEMP_DIR"

echo "→ Starting API (8000), worker and web (5173)…"
trap 'kill 0' EXIT
(cd "$API" && uvicorn app.main:app --reload --port 8000) &
(cd "$API" && python -m app.workers.worker) &
(cd "$ROOT" && npm run dev) &
wait
