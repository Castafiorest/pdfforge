# PDFForge API — multi-stage, non-root, Ghostscript included.
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Ghostscript (compression engine) + runtime libs for PyMuPDF/Pillow + fonts.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ghostscript \
        libgl1 \
        libglib2.0-0 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching).
COPY apps/api/requirements.txt .
RUN pip install -r requirements.txt

# Application code.
COPY apps/api/app ./app

# Run as non-root; temp dir writable by the app user.
RUN useradd -m -u 1000 pdfforge \
    && mkdir -p /tmp/pdfforge /data \
    && chown -R pdfforge:pdfforge /tmp/pdfforge /data

USER pdfforge

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
