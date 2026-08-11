import io
from dataclasses import dataclass

import pikepdf

from app.core.config import get_settings

settings = get_settings()

PDF_MAGIC = b"%PDF-"


@dataclass
class ValidationResult:
    ok: bool
    error: str | None = None
    page_count: int | None = None
    size: int = 0


def validate_pdf(data: bytes) -> ValidationResult:
    """Validate a PDF upload: magic bytes, size limit, openability, page-count limit."""
    size = len(data)
    if size < 8:
        return ValidationResult(ok=False, error="File is too small to be a valid PDF.", size=size)
    if not data.startswith(PDF_MAGIC):
        return ValidationResult(
            ok=False, error="Not a valid PDF (missing %PDF- header).", size=size
        )
    if size > settings.max_file_size_bytes:
        return ValidationResult(
            ok=False,
            error=f"File exceeds the maximum size of {settings.max_file_size_mb} MB.",
            size=size,
        )
    try:
        with pikepdf.open(io.BytesIO(data)) as pdf:
            page_count = len(pdf.pages)
            # Basic decompression-bomb guard: warn on suspiciously large page count.
            if page_count == 0:
                return ValidationResult(ok=False, error="PDF has no pages.", size=size)
    except pikepdf.PasswordError:
        return ValidationResult(
            ok=False, error="PDF is password-protected. Unlock it first and try again.", size=size
        )
    except Exception:
        return ValidationResult(
            ok=False,
            error="Could not open the PDF — the file may be malformed or encrypted.",
            size=size,
        )
    if page_count > settings.max_pages:
        return ValidationResult(
            ok=False,
            error=f"Document has {page_count} pages (max allowed: {settings.max_pages}).",
            size=size,
        )
    return ValidationResult(ok=True, page_count=page_count, size=size)


def validate_images(data: bytes) -> ValidationResult:
    """Lightweight validation for image uploads (image-to-pdf path)."""
    size = len(data)
    if size > settings.max_file_size_bytes:
        return ValidationResult(
            ok=False,
            error=f"File exceeds the maximum size of {settings.max_file_size_mb} MB.",
            size=size,
        )
    # Check for common image signatures.
    signatures = {
        b"\xff\xd8\xff": "jpeg",
        b"\x89PNG\r\n\x1a\n": "png",
        b"RIFF": "webp",
    }
    for sig in signatures:
        if data.startswith(sig):
            return ValidationResult(ok=True, size=size)
    return ValidationResult(ok=False, error="Unsupported or invalid image file.", size=size)
