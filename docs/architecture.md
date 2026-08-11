# Architecture

PDFForge is a **privacy-first PDF toolkit** split between client-side (browser) and server-side processing.

## Overview

```
┌──────────────────────────────┐
│           Browser            │
│   React + TypeScript (Vite)  │
│   pdf-lib / PDF.js           │
│   ┌────────────┬───────────┐ │
│   │ client-side│ server-side│ │
│   │ tools      │ jobs       │ │
│   └────────────┴───────────┘ │
└──────────────┬───────────────┘
               │  /api/v1 (JSON + multipart)
               ▼
┌──────────────────────────────┐
│        FastAPI (API)         │
│  validation · jobs · limits  │
│  SQLAlchemy (SQLite/Postgres)│
└──────────────┬───────────────┘
               │ DB-backed queue (status + params)
               ▼
┌──────────────────────────────┐
│        Worker process        │
│  compress · split · merge    │
│  pdf-to-image · metadata     │
│  Ghostscript · pikepdf · fitz│
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│    Temp storage /tmp/pdfforge│
│    {job_uuid}/input.pdf      │
│    {job_uuid}/output.pdf     │
└──────────────┬───────────────┘
               ▼
          Download / auto-delete (TTL)
```

## Client-side vs server-side

| Tool | Where | Why |
| --- | --- | --- |
| Merge, Split, Organize, Image→PDF | Browser | Private, fast, zero server cost |
| Compress, PDF→Image, Remove metadata | Server worker | Needs Ghostscript / PyMuPDF |

Files larger than `CLIENT_SIDE_MAX_MB` should be routed server-side (frontend routing is a future enhancement; all server tools already accept large uploads up to `MAX_FILE_SIZE_MB`).

## Job lifecycle

```
upload → validate → queued → processing → completed → expired (auto-deleted)
                                └──────────→ failed
```

- Jobs are rows in the `jobs` table (no document content stored).
- Files live in UUID-named folders under `TEMP_DIR/jobs/{uuid}/`.
- `params.json` holds the tool + options for the worker.
- A cleanup loop runs every `CLEANUP_INTERVAL_MINUTES` and deletes expired/stale jobs.

## Concurrency & queue

- The worker polls the DB for `queued` jobs (no Redis required for MVP).
- `MAX_CONCURRENT_JOBS` is enforced with a semaphore.
- Stuck jobs (queued/processing older than TTL) are failed and cleaned up.

## Security model

- Uploads validated: `%PDF-` magic bytes, MIME, size, page count, openability.
- Ghostscript runs with `-dSAFER` in an isolated subprocess with a timeout.
- Workers run as non-root (Docker `USER pdfforge`), resource limits via compose.
- Rate limiting per IP (trusts `X-Forwarded-For` behind Caddy/Cloudflare).
- Output is validated before it is exposed (opens, non-empty, has pages).

## Tech stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS 4, TanStack Query, pdf-lib, PDF.js, react-router.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.
- **PDF engines:** Ghostscript, pikepdf, PyMuPDF.
- **Deployment:** Docker Compose + Caddy (reverse proxy + static hosting).
