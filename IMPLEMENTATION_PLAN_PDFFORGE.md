# PDFForge — Implementation Plan

> **Project type:** Open-source, privacy-first PDF toolkit + optional hosted SaaS  
> **Working name:** PDFForge  
> **Primary goal:** Build a useful, self-hostable PDF toolkit that can also be offered as a managed SaaS.

---

## 1. Product Vision

PDFForge is a privacy-first PDF toolkit that allows users to compress, merge, split, organize, convert, and optimize PDF files.

The project will be:

- Open-source and self-hostable.
- Easy to deploy using Docker.
- Privacy-focused.
- Lightweight enough to run on low-cost hardware.
- Designed so simple operations can run in the browser.
- Designed so heavier operations can run on backend workers.
- Ready to evolve into a hosted SaaS with Free, Pro, and Business plans.

---

## 2. Core Principles

1. **Privacy first**
   - Files are temporary.
   - No permanent storage by default.
   - Automatic file deletion after processing.
   - No document content used for analytics.

2. **Open-source first**
   - Public GitHub repository.
   - Clear license.
   - CONTRIBUTING guide.
   - Issue templates.
   - Versioned releases.

3. **Self-host friendly**
   - Docker-first deployment.
   - Minimal dependencies.
   - Environment-based configuration.
   - Can run on a small VPS or low-power laptop server.

4. **SaaS-ready**
   - Authentication.
   - Usage limits.
   - Job tracking.
   - Subscription-ready architecture.
   - API-ready architecture.

---

## 3. Recommended Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- pdf-lib for lightweight client-side PDF manipulation
- PDF.js for PDF preview

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

### PDF Processing

- Ghostscript
- pikepdf
- PyMuPDF
- Pillow
- qpdf
- Optional later:
  - OCRmyPDF
  - Tesseract OCR

### Database

Initial:

- SQLite for local development

Production:

- PostgreSQL

### Queue

MVP:

- FastAPI background jobs or simple worker process

Later:

- Redis
- Celery or RQ

### Storage

Default:

```text
/tmp/pdfforge/jobs/
```

Production optional:

- Local disk
- S3-compatible storage
- MinIO

### Deployment

- Docker
- Docker Compose
- Caddy or Nginx
- Cloudflare Tunnel for self-hosted public access
- GitHub Actions for CI/CD

---

## 4. High-Level Architecture

```text
                        ┌─────────────────────┐
                        │       Browser       │
                        │                     │
                        │ React + TypeScript  │
                        └──────────┬──────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
          Client-side tools                  Server-side tools
                  │                                 │
           pdf-lib / PDF.js                         │
                  │                                 ▼
                  │                        ┌─────────────────┐
                  │                        │   FastAPI API   │
                  │                        └────────┬────────┘
                  │                                 │
                  │                        ┌────────▼────────┐
                  │                        │   Job Manager   │
                  │                        └────────┬────────┘
                  │                                 │
                  │                        ┌────────▼────────┐
                  │                        │  PDF Workers    │
                  │                        │                 │
                  │                        │ Ghostscript     │
                  │                        │ pikepdf         │
                  │                        │ PyMuPDF         │
                  │                        └────────┬────────┘
                  │                                 │
                  │                        ┌────────▼────────┐
                  │                        │ Temp Storage    │
                  │                        └─────────────────┘
                  │
                  └──────── Download result
```

---

# 5. Feature Scope

## Phase 1 — MVP

The first public release should focus on features that are immediately useful.

### 5.1 Compress PDF

Compression presets:

- Lossless
- Balanced
- Maximum

Display:

- Original size
- Compressed size
- Percentage reduction
- Page count
- Processing time

Example:

```text
Original Size : 24.8 MB
Compressed    : 6.1 MB
Reduction     : 75.4%
Pages         : 32
Mode          : Balanced
Processing    : 8.4 sec
```

---

### 5.2 Merge PDF

Allow:

- Multiple PDF uploads.
- Drag-and-drop ordering.
- Merge into one document.
- Download merged result.

Prefer client-side processing where possible.

---

### 5.3 Split PDF

Support:

```text
1-5
1,3,7
1-3,8-10
```

Options:

- Extract selected pages.
- Split every page.
- Split every N pages.

---

### 5.4 Organize PDF

Support:

- Reorder pages.
- Rotate pages.
- Delete pages.
- Duplicate pages.

Prefer client-side processing.

---

### 5.5 Image to PDF

Input:

- JPG
- JPEG
- PNG
- WebP

Options:

- Page size.
- Orientation.
- Image fit.
- Margin.

---

### 5.6 PDF to Image

Output:

- JPG
- PNG

Options:

- Resolution.
- Selected pages.
- ZIP download for multiple images.

---

### 5.7 Remove PDF Metadata

Remove:

- Author.
- Creator.
- Producer.
- Subject.
- Keywords.
- Creation metadata where possible.

---

# 6. Phase 2 Features

After the MVP is stable:

- Add watermark.
- Add page numbers.
- Protect PDF with password.
- Remove password when user supplies the valid password.
- Extract embedded images.
- PDF repair.
- Batch compression.
- Batch conversion.
- Better preview UI.
- Drag-and-drop multi-file workspace.

---

# 7. Phase 3 Features

Advanced features:

- OCR.
- Searchable scanned PDF.
- Redaction.
- PDF/A conversion.
- REST API.
- API keys.
- Webhooks.
- Team accounts.
- Shared workspace.
- Enterprise authentication.
- Audit log.

---

# 8. Client-Side vs Server-Side Processing

To reduce server load, not every feature should use the backend.

## Client-side

Recommended:

- Merge.
- Split.
- Reorder.
- Rotate.
- Delete pages.
- Image to PDF.

Advantages:

- Lower server CPU usage.
- Lower bandwidth usage.
- Better privacy.
- Faster response.
- Cheaper hosting.

## Server-side

Recommended:

- Heavy compression.
- OCR.
- PDF repair.
- PDF to high-resolution images.
- Large document processing.
- Advanced optimization.

---

# 9. Repository Structure

```text
pdfforge/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   ├── workers/
│       │   └── main.py
│       │
│       ├── tests/
│       └── requirements.txt
│
├── packages/
│   └── shared/
│
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
│
├── scripts/
│   ├── cleanup.sh
│   └── dev.sh
│
├── docs/
│   ├── architecture.md
│   ├── self-hosting.md
│   └── api.md
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── docker-compose.yml
├── .env.example
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── ROADMAP.md
```

---

# 10. Backend API Design

Base path:

```text
/api/v1
```

## Health

```http
GET /api/v1/health
```

---

## Compression

```http
POST /api/v1/compress
```

Multipart:

```text
file
preset=lossless|balanced|maximum
```

Response:

```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

---

## Job Status

```http
GET /api/v1/jobs/{job_id}
```

Response:

```json
{
  "id": "uuid",
  "status": "completed",
  "progress": 100,
  "original_size": 26004684,
  "output_size": 6396313,
  "reduction_percent": 75.4,
  "expires_at": "..."
}
```

---

## Download

```http
GET /api/v1/jobs/{job_id}/download
```

---

## Delete Job

```http
DELETE /api/v1/jobs/{job_id}
```

Allows the user to explicitly delete their files before automatic cleanup.

---

# 11. Job Lifecycle

```text
UPLOAD
  │
  ▼
VALIDATE
  │
  ▼
QUEUED
  │
  ▼
PROCESSING
  │
  ├──── failure ────► FAILED
  │
  ▼
COMPLETED
  │
  ▼
DOWNLOADABLE
  │
  ▼
EXPIRED
  │
  ▼
DELETED
```

Possible job statuses:

```text
queued
processing
completed
failed
expired
```

---

# 12. Temporary File Structure

```text
/tmp/pdfforge/jobs/{job_uuid}/
│
├── input.pdf
├── output.pdf
└── metadata.json
```

Rules:

- Use UUID folder names.
- Never trust uploaded filename.
- Do not expose filesystem path.
- Delete files after configured TTL.

Example:

```env
JOB_TTL_MINUTES=30
```

---

# 13. Automatic Cleanup

Cleanup job runs every few minutes.

Example logic:

```text
Every 5 minutes:

Find jobs where:
expires_at < now

Then:
delete input file
delete output file
delete job directory
mark job expired
```

Also delete incomplete jobs after crashes.

---

# 14. Upload Limits

Suggested initial limits:

```env
MAX_FILE_SIZE_MB=100
MAX_PAGES=500
MAX_CONCURRENT_JOBS=2
JOB_TTL_MINUTES=30
```

For the first low-cost server:

```text
Concurrent heavy jobs: 1-2
Maximum upload: 50-100 MB
```

Limits should be configurable through environment variables.

---

# 15. Compression Engine

> **Decision (2026-08-11):** presets map to two different strategies —
> **Lossless** = object-level optimization via pikepdf/qpdf (no visual change);
> **Balanced** = image downsampling via Ghostscript (text stays selectable);
> **Maximum** = aggressive Ghostscript downsampling + lower JPEG quality.
> Full page rasterization is NOT used for MVP (it makes text non-selectable).
> If Ghostscript is unavailable, lossy presets degrade gracefully to lossless.

## Lossless

Goals:

- Preserve image quality.
- Optimize object structure.
- Remove unused objects.
- Compress streams.

Tools:

- pikepdf.
- qpdf.

---

## Balanced

Goals:

- Good readability.
- Significant file reduction.
- Suitable default option.

Example target:

```text
Images: ~150 DPI
JPEG Quality: ~75-85
```

---

## Maximum

Goals:

- Smallest practical output.
- Useful for email/document upload limits.

Example target:

```text
Images: ~96 DPI
JPEG Quality: ~50-65
```

Actual values should be tested against sample documents.

---

# 16. Compression Safety

Never silently replace the original file.

Always create:

```text
input.pdf
output.pdf
```

Before returning the result:

- Validate output exists.
- Validate output can be opened.
- Validate output page count.
- Check output size.
- If compression makes the file larger, notify the user.

Example:

```text
Compression did not reduce this document.
The original file is already highly optimized.
```

---

# 17. Frontend Pages

## Landing Page

Sections:

- Hero.
- Tools.
- Privacy.
- Open-source.
- Self-host.
- Pricing.
- GitHub CTA.

---

## Tool Workspace

Example route:

```text
/tools/compress
/tools/merge
/tools/split
/tools/organize
/tools/image-to-pdf
/tools/pdf-to-image
```

---

## Job Result Page

Show:

- Status.
- Progress.
- Original size.
- Result size.
- Reduction.
- Download.
- Delete immediately.

---

# 18. UI Design Direction

Design principles:

- Clean.
- Modern.
- Minimal.
- Fast.
- Mobile friendly.
- No unnecessary dashboard complexity.

Example component:

```text
┌──────────────────────────────────────┐
│             Compress PDF             │
│                                      │
│     Drag your PDF here               │
│         or Browse File               │
│                                      │
│       Maximum size: 100 MB           │
└──────────────────────────────────────┘
```

Compression mode:

```text
○ Lossless
● Balanced
○ Maximum
```

Result:

```text
24.8 MB  →  6.1 MB

75.4% smaller

[ Download PDF ]
```

---

# 19. Authentication

Do not require login for the MVP.

Anonymous users should be able to:

- Compress.
- Merge.
- Split.
- Convert.

Authentication becomes useful for SaaS features.

Later:

- Email/password.
- Google OAuth.
- GitHub OAuth.

---

# 20. SaaS Architecture

Future hosted version:

```text
Visitor
   │
   ├── Anonymous
   │      └── Free limits
   │
   └── Logged in
          │
          ├── Free
          ├── Pro
          └── Business
```

---

# 21. Suggested Pricing Model

Initial concept only.

## Free

```text
Rp0
```

- Max file: 50 MB.
- Limited daily jobs.
- Standard queue.
- Basic tools.

## Pro

Possible range:

```text
Rp29.000 - Rp49.000 / month
```

- Larger files.
- Higher daily limits.
- Batch processing.
- Priority queue.
- OCR quota.
- Processing history.

## Business

Possible range:

```text
Rp99.000 - Rp299.000 / month
```

- Larger limits.
- API access.
- Team workspace.
- Higher OCR quota.
- Priority processing.
- Commercial support.

Pricing should only be finalized after measuring real infrastructure costs.

---

# 22. Database Model

## users

```text
id
email
name
password_hash
created_at
updated_at
```

---

## jobs

```text
id
user_id nullable
tool
status
original_filename
original_size
output_size
mime_type
preset
created_at
started_at
completed_at
expires_at
```

Do not store document contents in the database.

---

## subscriptions

Future:

```text
id
user_id
plan
provider
provider_subscription_id
status
started_at
expires_at
```

---

## usage_records

```text
id
user_id
tool
bytes_processed
pages_processed
processing_time_ms
created_at
```

Do not store document content.

---

# 23. Privacy Requirements

Privacy statement should clearly say:

- Files are temporarily processed.
- Files are automatically deleted.
- File contents are not analyzed for advertising.
- Files are not used for AI training.
- No permanent storage unless the user explicitly chooses a future storage feature.

Recommended:

```text
Default retention: 30 minutes
```

Allow self-hosters to configure it.

---

# 24. Security Requirements

Mandatory:

- Validate MIME type.
- Validate PDF magic bytes.
- Generate random internal filenames.
- Never execute user filenames.
- Limit upload sizes.
- Limit request rate.
- Limit processing time.
- Run workers as non-root.
- Sandbox Ghostscript.
- Disable unnecessary Ghostscript capabilities.
- Keep dependencies patched.
- Prevent path traversal.
- Prevent zip bombs.
- Protect against malformed PDFs.
- Enforce resource limits.
- Sanitize error messages.

Production containers should have:

- CPU limit.
- Memory limit.
- Read-only filesystem where practical.
- Restricted temporary directory.
- No Docker socket access.

---

# 25. Rate Limiting

Anonymous users:

```text
Example:
10 jobs / hour / IP
```

Authenticated Free:

```text
Example:
25 jobs / day
```

Pro:

```text
Higher configurable limits
```

Do not hardcode limits directly into business logic.

---

# 26. Observability

Collect application metrics only.

Useful metrics:

- Number of jobs.
- Tool usage.
- Processing duration.
- Original file size.
- Output file size.
- Compression ratio.
- Failure rate.
- CPU usage.
- Memory usage.
- Queue length.

Never log:

- Document contents.
- Passwords.
- Sensitive request bodies.

---

# 27. Testing Strategy

## Unit Tests

Test:

- File validation.
- Compression preset generation.
- Job state transitions.
- Cleanup logic.
- Usage limit calculation.

## Integration Tests

Test:

```text
Upload
→ Process
→ Download
→ Delete
```

## PDF Corpus

Maintain test PDFs:

```text
tests/fixtures/
├── text-only.pdf
├── image-heavy.pdf
├── scanned.pdf
├── already-compressed.pdf
├── large-document.pdf
└── malformed.pdf
```

Do not commit sensitive documents.

---

# 28. Compression Benchmark

Create benchmark tests.

For every sample PDF record:

```text
Original size
Output size
Compression %
Processing time
Visual quality
Page count
```

Example:

| Document | Original | Balanced | Reduction | Time |
|---|---:|---:|---:|---:|
| Scan A | 20 MB | 5 MB | 75% | 8 sec |
| Report B | 7 MB | 3 MB | 57% | 4 sec |
| Text C | 2 MB | 1.8 MB | 10% | 2 sec |

---

# 29. Docker Deployment

Desired command:

```bash
git clone https://github.com/USERNAME/pdfforge.git
cd pdfforge
docker compose up -d
```

Then:

```text
http://localhost:3000
```

This should be one of the project's strongest open-source selling points.

---

# 30. Environment Variables

Example:

```env
APP_ENV=production

API_PORT=8000
WEB_PORT=3000

DATABASE_URL=postgresql://...

TEMP_DIR=/tmp/pdfforge
MAX_FILE_SIZE_MB=100
MAX_PAGES=500
MAX_CONCURRENT_JOBS=2
JOB_TTL_MINUTES=30

REDIS_URL=redis://redis:6379

RATE_LIMIT_ENABLED=true
```

---

# 31. GitHub Actions

CI pipeline:

```text
Push / Pull Request
       │
       ├── Frontend lint
       ├── Frontend test
       ├── Backend lint
       ├── Backend test
       ├── Build Docker image
       └── Security scan
```

On version tag:

```text
v0.1.0
```

Automatically:

- Build Docker image.
- Publish GitHub release.
- Generate changelog.
- Optionally publish container image.

---

# 32. Open-Source Project Files

Required:

```text
README.md
LICENSE
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
ROADMAP.md
CHANGELOG.md
```

**Decision (2026-08-11):** license is **AGPL-3.0** — protects against closed-source
forks while allowing monetized hosted SaaS (network copyleft).

---

# 33. Implementation Milestones & Status

> Updated 2026-08-11. Status: `x` done · `~` in progress · ` ` planned.

## M0 — Repo & tooling ✅
- [x] Monorepo scaffold (`apps/web`, `apps/api`, `packages/shared`)
- [x] Tooling: ruff, prettier/eslint, pre-commit-ready, `.gitignore`, `.editorconfig`
- [x] CI: backend lint+test, frontend lint+build, docker build
- [x] OSS files: README, LICENSE (AGPL-3.0), CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, ROADMAP, CHANGELOG

## M1 — Backend core ✅
- [x] FastAPI skeleton (`core/`, `api/`, `models/`, `schemas/`, `services/`, `workers/`)
- [x] Job lifecycle + SQLite (SQLAlchemy; Alembic deferred to a later phase)
- [x] Temp file structure `/tmp/pdfforge/jobs/{uuid}/` + params.json
- [x] Job CRUD: create → status → download → delete
- [x] Auto-cleanup scheduler (TTL 30 min) + DB-backed queue worker (semaphore for `MAX_CONCURRENT_JOBS`)

## M2 — Compression engine ✅
- [x] Presets: lossless (pikepdf), balanced/maximum (Ghostscript downsampling)
- [x] Compression safety: never silently replace original, validate output opens
- [x] Upload validation: magic bytes, size, page count, zip-bomb guard
- [x] Rate limiting per IP (`X-Forwarded-For` aware) + configurable limits

## M3 — Client tools (web) ✅
- [x] Vite/React/TS/Tailwind scaffold, landing page, `/tools/*` routes
- [x] Merge, Split (ranges/every/all), Organize (reorder/rotate/delete/duplicate) via pdf-lib
- [x] Image→PDF (JPG/PNG/WebP via canvas) with page-size/fit/margin options
- [x] PDF.js page previews, i18n EN+ID, code-split lazy loading

## M4 — Server tools + results UI ✅
- [x] PDF→Image (PyMuPDF, PNG/JPG, ZIP output), Remove Metadata (pikepdf)
- [x] Job result page: phase-based progress, sizes, reduction %, download, delete
- [x] Upload validation wired into all tool endpoints

## M5 — Deployment & hardening ✅
- [x] Multi-stage Dockerfiles (`api`, `web` with Caddy; worker shares API image)
- [x] docker-compose with healthchecks, resource limits, non-root user
- [x] Caddyfile (static hosting + `/api` reverse proxy + security headers)
- [x] `.env.example`, `scripts/dev.sh`, `scripts/setup.ps1`, `scripts/cleanup.sh`
- [x] Docs: `architecture.md`, `self-hosting.md`, `api.md`

## M6 — Release v0.1.0 ✅
- [x] GitHub Actions: CI (lint/test/build) + release (tag → GHCR images → release notes)
- [x] Integration tests: upload → process → download → delete (18 tests passing)
- [x] Issue templates + PR template

## Known follow-ups (not blocking v0.1.0)
- [ ] Alembic migrations (currently `create_all` on startup)
- [ ] Frontend size-based routing: files > `CLIENT_SIDE_MAX_MB` → server fallback
- [ ] Redis + RQ/ARQ queue for horizontal worker scaling
- [ ] Benchmark corpus script with visual-quality comparison
- [ ] Password-protect PDFs, watermark, page numbers (Phase 2)

Recommended license options:

### Option A — AGPL-3.0

Useful if the goal is to discourage companies from taking a modified hosted version private.

### Option B — Apache-2.0

Useful if maximum adoption and commercial friendliness are more important.

License choice should be finalized before public launch.

---

# 33. README Structure

```markdown
# PDFForge

Privacy-first open-source PDF toolkit.

## Features

## Demo

## Why PDFForge?

## Quick Start

## Docker

## Self Hosting

## Development

## Privacy

## Security

## Roadmap

## Contributing

## License
```

Include screenshots after the UI is ready.

---

# 34. GitHub Community Setup

Enable:

- Issues.
- Discussions.
- Pull Requests.
- GitHub Actions.

Issue labels:

```text
bug
enhancement
good first issue
help wanted
documentation
security
frontend
backend
pdf-engine
```

---

# 35. Public Roadmap

## v0.1.0

- Compress PDF.
- Basic frontend.
- Upload/download.
- Auto cleanup.
- Docker.

## v0.2.0

- Merge.
- Split.
- Organize pages.
- Client-side processing.

## v0.3.0

- Image to PDF.
- PDF to image.
- Metadata removal.

## v0.4.0

- Authentication.
- User limits.
- Processing history.

## v0.5.0

- Batch processing.
- Watermark.
- Password protection.

## v0.6.0

- OCR.

## v1.0.0

- Stable API.
- Production-ready SaaS.
- Full documentation.
- Stable Docker deployment.

---

# 36. Development Milestones

## Milestone 0 — Repository Bootstrap

Tasks:

- Create repository.
- Add license.
- Add README.
- Add CONTRIBUTING.
- Add frontend app.
- Add backend app.
- Add Docker Compose.
- Add CI.

Acceptance criteria:

- Frontend runs.
- Backend runs.
- `/health` endpoint works.
- Docker Compose starts the complete project.

---

## Milestone 1 — Compression Engine

Tasks:

- File upload.
- PDF validation.
- Job ID.
- Temporary storage.
- Lossless preset.
- Balanced preset.
- Maximum preset.
- Compression result.
- Download.
- Automatic deletion.

Acceptance criteria:

```text
Upload PDF
→ choose preset
→ compress
→ show result
→ download
```

No manual server intervention required.

---

## Milestone 2 — PDF Workspace

Tasks:

- Merge.
- Split.
- Reorder.
- Rotate.
- Delete page.
- PDF preview.

Acceptance criteria:

Most page manipulation happens in the browser.

---

## Milestone 3 — Conversion

Tasks:

- Image to PDF.
- PDF to image.
- Remove metadata.

---

## Milestone 4 — Production Hardening

Tasks:

- Rate limiting.
- Worker resource limits.
- Error handling.
- Request timeout.
- Cleanup recovery.
- Security tests.
- Logging.
- Metrics.

---

## Milestone 5 — Open-Source Launch

Tasks:

- Improve README.
- Add screenshots.
- Add demo GIF/video.
- Publish first release.
- Create good-first-issue tickets.
- Add Discussions.
- Write self-hosting guide.
- Announce project.

---

## Milestone 6 — SaaS Layer

Only after the open-source core is stable.

Tasks:

- Authentication.
- Plans.
- Usage limits.
- Billing.
- Processing history.
- Admin dashboard.
- API keys.

---

# 37. Codex Implementation Strategy

Do not ask Codex to build the entire project in one prompt.

Use milestone-based tasks.

Recommended order:

```text
Task 01 — Bootstrap monorepo
Task 02 — FastAPI health API
Task 03 — Upload validation
Task 04 — Job manager
Task 05 — Ghostscript compression
Task 06 — Compression presets
Task 07 — Download endpoint
Task 08 — Cleanup worker
Task 09 — Compression UI
Task 10 — Docker Compose
Task 11 — Tests
Task 12 — Merge tool
Task 13 — Split tool
Task 14 — Organize pages
Task 15 — Conversion tools
Task 16 — Security hardening
```

Each Codex task should include:

```text
Objective
Context
Files allowed to change
Technical requirements
Acceptance criteria
Tests required
Non-goals
```

---

# 38. Example Codex Task Format

```markdown
# Task: Implement PDF Compression API

## Objective

Create the first production-safe PDF compression endpoint.

## Requirements

- Add `POST /api/v1/compress`.
- Accept exactly one PDF.
- Maximum size controlled by environment variable.
- Validate PDF signature.
- Generate UUID job directory.
- Never use uploaded filename as filesystem path.
- Support:
  - lossless
  - balanced
  - maximum
- Store temporary files inside configured temp directory.
- Return a job ID.

## Security

- Reject non-PDF files.
- Prevent path traversal.
- Add processing timeout.
- Do not execute user-controlled shell strings.

## Tests

Add tests for:

- Valid PDF.
- Invalid PDF.
- File too large.
- Unsupported preset.
- Successful job creation.

## Acceptance Criteria

The endpoint can accept a valid PDF and create a processing job without blocking the API process.
```

---

# 39. Server Strategy for Low-Cost Hardware

For the first server:

```text
Linux
Docker
Caddy
Cloudflare Tunnel
PDFForge
```

Suggested constraints:

```text
Heavy workers: 1
Maximum concurrent compression jobs: 1-2
Upload limit: 50 MB initially
TTL: 30 minutes
```

Do not allow unlimited workers.

If traffic increases:

```text
Phase 1
Single server

Phase 2
Web + Worker

Phase 3
Multiple workers + Redis

Phase 4
Object storage + load balancer
```

---

# 40. Production Deployment Layout

Initial:

```text
Internet
   │
Cloudflare
   │
Cloudflare Tunnel
   │
Caddy
   │
├── React
└── FastAPI
       │
       ├── Worker
       ├── PostgreSQL
       └── Temporary storage
```

Later:

```text
CDN
 │
Load Balancer
 │
API
 │
Redis Queue
 │
Worker Pool
 │
Object Storage
```

---

# 41. Definition of MVP Done

The project is ready for its first public release when:

- Repository is public.
- License exists.
- Docker setup works.
- Compress PDF works.
- Merge PDF works.
- Split PDF works.
- Organize pages works.
- Image to PDF works.
- PDF to image works.
- Metadata removal works.
- Files are automatically deleted.
- Upload limits exist.
- Processing limits exist.
- README explains self-hosting.
- Tests pass.
- GitHub Actions pass.
- Version `v0.1.0` or `v0.2.0` is released.

---

# 42. Open-Source Growth Goals

After launch:

- Publish releases regularly.
- Respond to issues.
- Create beginner-friendly issues.
- Accept community PRs.
- Document architecture decisions.
- Keep roadmap public.
- Write release notes.
- Encourage self-hosting.
- Collect anonymous usage feedback only when users explicitly opt in.

The goal is not artificial stars.

The goal is to create a project that is genuinely useful and actively maintained.

---

# 43. Codex for Open Source Long-Term Preparation

Do not build the project only for a promotion.

Instead, create evidence of genuine maintenance:

- Public repository.
- Consistent commit history.
- Releases.
- Issues.
- Pull requests.
- Community feedback.
- Contributors.
- Self-host users.
- Documentation.
- Project roadmap.

These signals are naturally produced by maintaining a healthy open-source project.

---

# 44. Recommended Initial Scope

Do **not** begin with:

- Billing.
- Teams.
- OCR.
- Enterprise features.
- Kubernetes.
- Microservices.
- Complex storage infrastructure.

Start with:

```text
Compress
Merge
Split
Organize
Convert
Privacy
Docker
```

This keeps the first release realistic.

---

# 45. First Sprint

Recommended first development sprint:

### Step 1

Create repository and project skeleton.

### Step 2

Run:

```text
React
FastAPI
Docker Compose
```

### Step 3

Implement `/health`.

### Step 4

Implement PDF upload validation.

### Step 5

Implement Ghostscript compression.

### Step 6

Implement job result page.

### Step 7

Implement download.

### Step 8

Implement automatic cleanup.

### Step 9

Add tests.

### Step 10

Publish first development release:

```text
v0.1.0-alpha
```

---

# 46. Final Product Direction

The long-term product should be positioned as:

> **A privacy-first, open-source PDF toolkit that anyone can self-host, with an optional managed cloud service for users who prefer convenience.**

The open-source project remains useful independently of the hosted SaaS.

That separation is important for both community trust and long-term sustainability.
