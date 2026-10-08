#!/usr/bin/env bash
# PDFForge service control.
# Usage:
#   ./pdfforge-ctl.sh start     # start all services
#   ./pdfforge-ctl.sh stop      # stop all services
#   ./pdfforge-ctl.sh restart   # restart all services
#   ./pdfforge-ctl.sh status    # show active state of all services
set -euo pipefail

SERVICES=(pdfforge-api pdfforge-worker nginx cloudflared)

cmd="${1:-status}"

case "$cmd" in
  start)
    sudo systemctl start "${SERVICES[@]}"
    echo "✅ PDFForge services started"
    ;;
  stop)
    sudo systemctl stop "${SERVICES[@]}"
    echo "🛑 PDFForge services stopped"
    ;;
  restart)
    sudo systemctl restart "${SERVICES[@]}"
    echo "🔄 PDFForge services restarted"
    ;;
  status)
    printf "%-18s %s\n" "SERVICE" "STATE"
    for s in "${SERVICES[@]}"; do
      printf "%-18s %s\n" "$s" "$(systemctl is-active "$s")"
    done
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
