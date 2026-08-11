# Contributing to PDFForge

Thanks for your interest in contributing! 🎉

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, be respectful.

## How to contribute

1. **Find or open an issue** — check existing issues first, then open one describing what you want to do.
2. **Fork** the repository and create a branch: `git checkout -b feat/my-feature`.
3. **Make your changes** following the conventions below.
4. **Add tests** for new functionality (unit + integration where applicable).
5. **Run the checks** (lint + tests).
6. **Open a pull request** using the [template](.github/pull_request_template.md).

## Development setup

```bash
# Backend
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
ruff check . && pytest

# Frontend
npm install
npm run lint && npm test
```

## Conventions

- **Python**: formatted with `ruff format`, linted with `ruff check` (line length 100). Type hints required.
- **TypeScript**: formatted with `prettier`, linted with `eslint`. 
- **Commits**: clear, imperative messages (e.g. `feat: add split by range`, `fix: handle empty upload`).
- **Privacy rule**: never log document contents, filenames in logs are fine but content is not.
- **AGPL-3.0**: by contributing, you agree your contributions are licensed under AGPL-3.0.

## Test PDF fixtures

Sample PDFs live in `apps/api/tests/fixtures/`. Do **not** commit sensitive documents.
Generate a small text-only PDF instead:

```bash
python -c "import fitz; d=fitz.open(); p=d.new_page(); p.insert_text((72,72),'hello'); d.save('apps/api/tests/fixtures/text-only.pdf')"
```

## Questions?

Open a discussion or an issue — we're friendly!
