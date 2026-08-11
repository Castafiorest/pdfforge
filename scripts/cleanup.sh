#!/usr/bin/env bash
# PDFForge — manual cleanup of expired/stale job data.
# Normally automatic; this is for maintenance or after a crash.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/apps/api"

if [ ! -d "$API/.venv" ]; then
  echo "No venv found. Run scripts/dev.sh first." >&2
  exit 1
fi

source "$API/.venv/bin/activate"
export DATABASE_URL="${DATABASE_URL:-sqlite:///$ROOT/apps/api/data/pdfforge.db}"

(cd "$API" && python -c "from app.core.cleanup import run_cleanup_once; n = run_cleanup_once(); print(f'Cleaned up {n} job(s).')")
