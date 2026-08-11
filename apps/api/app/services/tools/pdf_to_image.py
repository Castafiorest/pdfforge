import zipfile
from pathlib import Path

import fitz  # PyMuPDF


def pdf_to_image_zip(
    input_path: Path,
    output_zip: Path,
    image_format: str = "png",
    dpi: int = 150,
    page_spec: str | None = None,
) -> int:
    """Render PDF pages to images and pack them into a ZIP archive."""
    image_format = (image_format or "png").lower()
    if image_format not in {"png", "jpg", "jpeg"}:
        raise ValueError("Unsupported image format")

    ext = "jpg" if image_format in {"jpg", "jpeg"} else "png"
    zoom = dpi / 72.0

    pages = _parse_pages(page_spec) if page_spec else None

    with fitz.open(input_path) as doc:
        total = len(doc)
        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            indices = pages if pages else range(total)
            for idx in indices:
                if idx < 0 or idx >= total:
                    continue
                pix = doc[idx].get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                data = pix.tobytes(ext)
                zf.writestr(f"page-{idx + 1:03d}.{ext}", data)
    return output_zip.stat().st_size


def _parse_pages(spec: str) -> list[int]:
    pages: list[int] = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_s, _, end_s = part.partition("-")
            pages.extend(range(int(start_s) - 1, int(end_s)))
        else:
            pages.append(int(part) - 1)
    return pages
