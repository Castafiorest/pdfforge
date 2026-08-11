# Self-hosting PDFForge

PDFForge is designed to run on a small VPS or even a low-power home server.

## Requirements

- Docker **20.10+** with Docker Compose v2.
- ~1 GB RAM free (each container is limited to 1 GB).
- A little disk for temporary files (scaled to your max upload size).

## Quick start

```bash
git clone https://github.com/USERNAME/pdfforge.git
cd pdfforge
cp .env.example .env
docker compose up -d
```

Open <http://localhost:3000>.

> **Low-spec / Debian GNOME (no Docker)?** Use the one-shot installer:
> [`self-hosting-debian-gnome.md`](self-hosting-debian-gnome.md)

## Configuration

Edit `.env` (all values are optional — sensible defaults are built in):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBLIC_URL` | `http://localhost:3000` | Public URL; Caddy also handles TLS if you use `https://` |
| `WEB_PORT` | `3000` | Host port for the web UI |
| `MAX_FILE_SIZE_MB` | `100` | Max upload size |
| `MAX_PAGES` | `500` | Max pages per document |
| `MAX_CONCURRENT_JOBS` | `2` | Parallel worker jobs |
| `JOB_TTL_MINUTES` | `30` | Auto-delete time for files |
| `RATE_LIMIT_ENABLED` | `true` | Per-IP rate limiting |
| `RATE_LIMIT_JOBS_PER_HOUR` | `10` | Anonymous hourly job limit |

## Production notes

- **Persistent data:** only the SQLite database and job metadata are persisted (volume `pdfforge_data`). **Files are never stored**.
- **TLS:** set `PUBLIC_URL=https://pdf.example.com` and point DNS at the host — Caddy will obtain and renew a Let's Encrypt certificate automatically.
- **Behind Cloudflare:** Cloudflare Tunnel is supported; the API trusts `X-Forwarded-For` for rate limiting.
- **Resource limits:** containers ship with CPU/memory limits in `docker-compose.yml`. Raise them if you raise `MAX_CONCURRENT_JOBS`.

## Updating

```bash
git pull
docker compose up -d --build
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `Web` won't start | `PUBLIC_URL` invalid or port 3000 busy |
| Compression returns "failed" | Ghostscript missing in API image (rebuild) or file corrupt |
| Rate limit errors | You exceeded the hourly limit; raise `RATE_LIMIT_JOBS_PER_HOUR` |
| Disk filling up | Lower `JOB_TTL_MINUTES` or run `scripts/cleanup.sh` |

## Exposing publicly

Preferred options:

1. **Caddy built-in TLS** — set `PUBLIC_URL=https://your.domain` (auto HTTPS).
2. **Cloudflare Tunnel** — `cloudflared tunnel --url http://localhost:3000` (no open ports needed).

## Metrics

The API exposes `/api/v1/health`. Application metrics are collected only for operations (job counts, durations, sizes) — never document contents.
