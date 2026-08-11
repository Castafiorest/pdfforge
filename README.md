# PDFForge

> Privacy-first, open-source PDF toolkit — compress, merge, split, organize, convert, and optimize PDFs.

PDFForge is a self-hostable PDF toolkit designed so **simple operations run in your browser** and **heavier operations run on backend workers**. No accounts, no tracking, no permanent storage — your files are processed and deleted automatically.

Built to be easy to deploy (`docker compose up -d`) and ready to evolve into a managed SaaS.

## ✨ Features (MVP)

| Tool | Where it runs |
| --- | --- |
| Compress PDF (lossless / balanced / maximum) | Backend (Ghostscript + pikepdf) |
| Merge PDF | Browser (pdf-lib) |
| Split PDF (ranges, every page, every N) | Browser (pdf-lib) |
| Organize PDF (reorder / rotate / delete / duplicate) | Browser (pdf-lib) |
| Image to PDF (JPG / PNG / WebP) | Browser (pdf-lib) |
| PDF to Image (JPG / PNG, ZIP) | Backend (PyMuPDF) |
| Remove PDF Metadata | Backend (pikepdf) |

Files larger than the configured threshold are automatically routed to the backend so the browser never hangs.

## 🚀 Quick start (Docker)

```bash
git clone https://github.com/USERNAME/pdfforge.git
cd pdfforge
cp .env.example .env
docker compose up -d
```

Then open <http://localhost:3000>.

**Low-spec / Debian GNOME?** See the dedicated guide:
[`docs/self-hosting-debian-gnome.md`](docs/self-hosting-debian-gnome.md) — one command installer tuned for 4 GB RAM machines (e.g. Lenovo V110).

## 🛠 Local development

**Backend**

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
npm install
npm run dev
```

The web app runs on `http://localhost:5173` and proxies `/api` to `http://localhost:8000`.

## 🧱 Architecture

```
Browser (React + pdf-lib)  ── client-side tools
        │
        ▼  (heavy jobs / large files)
FastAPI API  →  Job Manager  →  Worker (Ghostscript / pikepdf / PyMuPDF)
                                       │
                                       ▼
                              Temp storage (/tmp/pdfforge)
                                       │
                                       ▼
                                    Download
```

See [`docs/architecture.md`](docs/architecture.md) for details.

## 🔒 Privacy & Security

- Files are temporary; automatically deleted after TTL (default 30 minutes).
- No permanent storage, no analytics on document content, no AI training.
- Uploads validated (MIME, magic bytes, page count, size, zip-bomb protection).
- Workers run as non-root with resource limits; Ghostscript runs sandboxed.
- Rate limiting per IP, configurable limits via environment variables.

## 📦 Project layout

```
apps/web/      React + Vite + TypeScript + Tailwind (frontend)
apps/api/      FastAPI + SQLAlchemy (backend + worker)
packages/shared/  Shared types & constants
docker/        Dockerfiles
docs/          Architecture, self-hosting & API docs
.github/       CI/CD workflows & templates
```

## 🗺 Roadmap

See [`ROADMAP.md`](ROADMAP.md) and [`IMPLEMENTATION_PLAN_PDFFORGE.md`](IMPLEMENTATION_PLAN_PDFFORGE.md).

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Report security issues via [`SECURITY.md`](SECURITY.md).

## 📄 License

[AGPL-3.0](LICENSE) — open source, forever. If you run a modified version as a service, you must share your changes.
