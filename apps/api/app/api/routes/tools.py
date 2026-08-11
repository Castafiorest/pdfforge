from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.ratelimit import check_rate_limit
from app.db import get_db
from app.schemas.job import BatchCompressResponse, BatchJobItem, JobCreateResponse
from app.services import job_service, storage
from app.services.file_validation import validate_pdf

router = APIRouter(tags=["tools"])

MAX_UPLOAD_FILES = 20


def _read_upload(file: UploadFile) -> bytes:
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    return data


def _require_pdf(data: bytes, filename: str | None = None) -> None:
    result = validate_pdf(data)
    if not result.ok:
        raise HTTPException(status_code=400, detail=result.error)


@router.post(
    "/compress",
    response_model=JobCreateResponse,
    dependencies=[Depends(check_rate_limit)],
)
def compress_pdf(
    file: UploadFile = File(...),
    preset: str = Form("balanced"),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    data = _read_upload(file)
    _require_pdf(data, file.filename)
    if preset not in {"lossless", "balanced", "maximum"}:
        raise HTTPException(status_code=400, detail="Unknown preset.")
    job = job_service.create_job(
        db,
        tool="compress",
        original_filename=file.filename,
        original_size=len(data),
        mime_type=file.content_type,
        preset=preset,
    )
    storage.save_upload(job.id, data)
    storage.save_params(job.id, {"tool": "compress", "preset": preset})
    return JobCreateResponse(job_id=job.id)


@router.post(
    "/compress-batch",
    response_model=BatchCompressResponse,
    dependencies=[Depends(check_rate_limit)],
)
def compress_pdf_batch(
    files: list[UploadFile] = File(...),
    preset: str = Form("balanced"),
    db: Session = Depends(get_db),
) -> BatchCompressResponse:
    """Compress many PDFs at once — one job per file, processed in queue order."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if len(files) > MAX_UPLOAD_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files (max {MAX_UPLOAD_FILES}).",
        )
    if preset not in {"lossless", "balanced", "maximum"}:
        raise HTTPException(status_code=400, detail="Unknown preset.")

    # Validate every file first so a bad file doesn't create partial jobs.
    uploads: list[tuple[str | None, str | None, bytes]] = []
    for file in files:
        data = _read_upload(file)
        _require_pdf(data, file.filename)
        uploads.append((file.filename, file.content_type, data))

    jobs: list[BatchJobItem] = []
    for filename, content_type, data in uploads:
        job = job_service.create_job(
            db,
            tool="compress",
            original_filename=filename,
            original_size=len(data),
            mime_type=content_type,
            preset=preset,
        )
        storage.save_upload(job.id, data)
        storage.save_params(job.id, {"tool": "compress", "preset": preset})
        jobs.append(
            BatchJobItem(
                job_id=job.id, filename=filename, original_size=len(data)
            )
        )
    return BatchCompressResponse(jobs=jobs)


@router.post(
    "/split",
    response_model=JobCreateResponse,
    dependencies=[Depends(check_rate_limit)],
)
def split_pdf_route(
    file: UploadFile = File(...),
    page_spec: str = Form(""),
    every: int | None = Form(None),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    data = _read_upload(file)
    _require_pdf(data, file.filename)
    if not page_spec and not every:
        raise HTTPException(status_code=400, detail="Provide a page range or 'every N'.")
    job = job_service.create_job(
        db,
        tool="split",
        original_filename=file.filename,
        original_size=len(data),
        mime_type=file.content_type,
    )
    storage.save_upload(job.id, data)
    storage.save_params(
        job.id,
        {"tool": "split", "page_spec": page_spec, "every": every},
    )
    return JobCreateResponse(job_id=job.id)


@router.post(
    "/merge",
    response_model=JobCreateResponse,
    dependencies=[Depends(check_rate_limit)],
)
def merge_pdfs_route(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if len(files) > MAX_UPLOAD_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files (max {MAX_UPLOAD_FILES}).",
        )
    total_size = 0
    job = job_service.create_job(
        db,
        tool="merge",
        original_filename=", ".join(f.filename or "" for f in files),
    )
    for idx, file in enumerate(files):
        data = _read_upload(file)
        _require_pdf(data, file.filename)
        total_size += len(data)
        storage.save_upload(job.id, data, index=idx)
    job.original_size = total_size
    db.commit()
    storage.save_params(job.id, {"tool": "merge"})
    return JobCreateResponse(job_id=job.id)


@router.post(
    "/pdf-to-image",
    response_model=JobCreateResponse,
    dependencies=[Depends(check_rate_limit)],
)
def pdf_to_image_route(
    file: UploadFile = File(...),
    image_format: str = Form("png"),
    dpi: int = Form(150),
    pages: str = Form(""),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    data = _read_upload(file)
    _require_pdf(data, file.filename)
    if image_format not in {"png", "jpg", "jpeg"}:
        raise HTTPException(status_code=400, detail="Unsupported image format.")
    if dpi < 50 or dpi > 400:
        raise HTTPException(status_code=400, detail="DPI must be between 50 and 400.")
    job = job_service.create_job(
        db,
        tool="pdf-to-image",
        original_filename=file.filename,
        original_size=len(data),
        mime_type=file.content_type,
    )
    storage.save_upload(job.id, data)
    storage.save_params(
        job.id,
        {"tool": "pdf-to-image", "format": image_format, "dpi": dpi, "pages": pages},
    )
    return JobCreateResponse(job_id=job.id)


@router.post(
    "/remove-metadata",
    response_model=JobCreateResponse,
    dependencies=[Depends(check_rate_limit)],
)
def remove_metadata_route(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    data = _read_upload(file)
    _require_pdf(data, file.filename)
    job = job_service.create_job(
        db,
        tool="remove-metadata",
        original_size=len(data),
        original_filename=file.filename,
        mime_type=file.content_type,
    )
    storage.save_upload(job.id, data)
    storage.save_params(job.id, {"tool": "remove-metadata"})
    return JobCreateResponse(job_id=job.id)
