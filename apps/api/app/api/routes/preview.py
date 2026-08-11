import pymupdf  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.services.file_validation import validate_pdf

router = APIRouter(tags=["preview"])

MAX_PREVIEW_WIDTH = 400


@router.post("/preview")
def preview_page(
    file: UploadFile = File(...),
    page: int = Form(1),
    width: int = Form(180),
) -> Response:
    """Render a single PDF page to a JPEG thumbnail (used as a client-render fallback).

    The upload is validated and never stored — the page image is returned directly.
    """
    data = file.file.read()
    result = validate_pdf(data)
    if not result.ok:
        raise HTTPException(status_code=400, detail=result.error)
    if result.page_count is None or page < 1 or page > result.page_count:
        raise HTTPException(status_code=400, detail="Page out of range.")
    width = max(40, min(width, MAX_PREVIEW_WIDTH))

    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
        try:
            matrix = pymupdf.Matrix(width / 72, width / 72)
            pix = doc[page - 1].get_pixmap(matrix=matrix, alpha=False)
            jpg = pix.tobytes("jpeg")
        finally:
            doc.close()
    except Exception:
        raise HTTPException(
            status_code=400, detail="Could not render page."
        ) from None

    return Response(content=jpg, media_type="image/jpeg")
