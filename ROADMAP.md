# Roadmap

> Status legend: `[ ]` planned · `[~]` in progress · `[x]` done

## v0.1.0 — MVP (current target)

- [ ] Monorepo scaffold (web + api + shared) & CI
- [ ] Job lifecycle: upload → queue → process → download → delete
- [ ] Auto-cleanup with TTL (default 30 min)
- [ ] **Compress PDF** — lossless / balanced / maximum presets
- [ ] **Merge PDF** (client-side)
- [ ] **Split PDF** — ranges, every page, every N (client-side)
- [ ] **Organize PDF** — reorder / rotate / delete / duplicate (client-side)
- [ ] **Image to PDF** — JPG/PNG/WebP (client-side)
- [ ] **PDF to Image** — JPG/PNG + ZIP (server-side)
- [ ] **Remove PDF Metadata** (server-side)
- [ ] Bilingual UI (English + Indonesian)
- [ ] Docker Compose deployment (web + api + worker + Caddy)

## Phase 2 — After MVP stabilizes

- [ ] Watermark
- [ ] Page numbers
- [ ] Protect PDF with password
- [ ] Remove password (with valid password)
- [ ] Extract embedded images
- [ ] PDF repair
- [x] Batch compression (multi-file, queued one-by-one)
- [ ] Batch conversion
- [ ] Better preview UI (PDF.js)
- [ ] Drag-and-drop multi-file workspace

## Phase 3 — Advanced & SaaS

- [ ] OCR + searchable scanned PDF (OCRmyPDF + Tesseract)
- [ ] Redaction
- [ ] PDF/A conversion
- [ ] Public REST API + API keys + webhooks
- [ ] Authentication (email/password, Google & GitHub OAuth)
- [ ] Team accounts / shared workspace / audit log
- [ ] PostgreSQL in production, Redis + RQ/ARQ queue
- [ ] S3/MinIO storage for job output
- [ ] Subscriptions (Free / Pro / Business) & usage tracking
- [ ] Observability: metrics, queue length, failure rate
