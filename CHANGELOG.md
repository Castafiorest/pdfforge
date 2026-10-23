# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: monorepo (`apps/web`, `apps/api`, `packages/shared`).
- Backend job lifecycle (queued → processing → completed/failed → expired/deleted).
- Auto-cleanup of temporary files (default TTL 30 min).
- Compression presets: lossless, balanced, maximum.
- Batch compression (multiple files, one job each, processed in queue order).
- Client-side tools: merge, split, organize, image-to-PDF.
- Server-side tools: PDF-to-image, remove metadata.
- Bilingual UI (English + Indonesian).
- Docker Compose deployment with Caddy reverse proxy.
- `.gitattributes` enforcing LF line endings, so Windows checkouts cannot commit
  CRLF into shell scripts.
- Auto-deploy: `pdfforge-deploy.timer` pulls `master` (the production branch,
  updated through reviewed PRs) on the server, rebuilds only what changed, and
  restarts the API/worker.

### Changed

- Node requirement is now `^20.19.0 || >=22.12.0` (Vite 7 minimum) in `engines`,
  CI, and the Debian installer, which previously accepted Node 18.
- The Debian installer uses `npm ci` instead of `npm install` for reproducible
  frontend builds that never rewrite the committed lockfile.
- The Debian installer detects `libglib2.0-0t64` vs `libglib2.0-0` and refuses
  unsupported operating systems or Debian < 12 with a clear message.
