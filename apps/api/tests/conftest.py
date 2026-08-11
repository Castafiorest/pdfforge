"""Pytest configuration — sets up an isolated env before importing the app."""
import os
import tempfile

# Must be set before importing app modules.
os.environ.setdefault(
    "TEMP_DIR", tempfile.mkdtemp(prefix="pdfforge_tests_")
)
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite:///"
    + os.path.join(tempfile.mkdtemp(prefix="pdfforge_db_"), "test.db"),
)
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pymupdf
import pytest


@pytest.fixture(scope="session")
def sample_pdf() -> bytes:
    """A tiny text-only PDF."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "PDFForge test")
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture(scope="session")
def image_pdf() -> bytes:
    """A PDF with an embedded image (good for compression tests)."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "PDFForge image test")
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
    page.insert_image(pymupdf.Rect(72, 120, 400, 300), pixmap=pix)
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture(scope="session")
def multi_page_pdf() -> bytes:
    doc = pymupdf.open()
    for i in range(4):
        page = doc.new_page()
        page.insert_text((72, 72), f"page {i + 1}")
    data = doc.tobytes()
    doc.close()
    return data
