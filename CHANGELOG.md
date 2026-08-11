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
