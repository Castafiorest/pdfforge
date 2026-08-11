from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.job import Job, JobStatus
from app.schemas.job import JobStatusResponse
from app.services import storage

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _get_job_or_404(db: Session, job_id: str) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: str, db: Session = Depends(get_db)) -> Job:
    return _get_job_or_404(db, job_id)


@router.get("/{job_id}/download")
def download_job(job_id: str, db: Session = Depends(get_db)):
    job = _get_job_or_404(db, job_id)
    if job.status != JobStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Job is not ready for download.")
    out = storage.output_file(job_id)
    if not out.exists():
        raise HTTPException(status_code=404, detail="Output file missing.")
    return FileResponse(
        out,
        media_type="application/zip" if out.suffix == ".zip" else "application/pdf",
        filename=_download_name(job),
    )


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = _get_job_or_404(db, job_id)
    storage.delete_job_dir(job_id)
    job.status = JobStatus.DELETED.value
    db.commit()


def _download_name(job: Job) -> str:
    base = (job.original_filename or "document").rsplit(".", 1)[0]
    suffix = {
        "compress": "-compressed",
        "split": "-split",
        "merge": "-merged",
        "pdf-to-image": "-images",
        "remove-metadata": "-clean",
    }.get(job.tool, "")
    # The real artifact decides the extension: ZIP for image batches / multi-part splits.
    out = storage.output_file(job.id)
    ext = out.suffix if out.suffix in {".zip", ".pdf"} else ".pdf"
    return f"{base}{suffix}{ext}"
