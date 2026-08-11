"""PDF tools (server-side handlers). Each returns a dict of result metadata."""

from app.services.tools.merge import merge_pdfs
from app.services.tools.pdf_to_image import pdf_to_image_zip
from app.services.tools.remove_metadata import remove_metadata
from app.services.tools.split import split_pdf

__all__ = ["merge_pdfs", "pdf_to_image_zip", "remove_metadata", "split_pdf"]
