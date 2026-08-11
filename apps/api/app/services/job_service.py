from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.job import Job, JobStatus
from app.services import storage

settings = get_settings()


def create_job(
    db: Session,
    tool: str,
    original_filename: str | None = None,
    original_size: int | None = None,
    mime_type: str | None = None,
    preset: str | None = None,
    user_id: str | None = None,
) -> Job:
    job = Job(
        tool=tool,
        status=JobStatus.QUEUED.value,
        original_filename=original_filename,
        original_size=original_size,
        mime_type=mime_type,
        preset=preset,
        user_id=user_id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    storage.ensure_job_dir(job.id)
    return job


def mark_processing(db: Session, job: Job) -> None:
    job.status = JobStatus.PROCESSING.value
    job.progress = 10
    job.started_at = datetime.now(UTC)
    db.commit()


def mark_completed(
    db: Session, job: Job, output_size: int | None = None
) -> None:
    job.status = JobStatus.COMPLETED.value
    job.progress = 100
    job.output_size = output_size
    job.completed_at = datetime.now(UTC)
    job.expires_at = job.completed_at + timedelta(minutes=settings.job_ttl_minutes)
    db.commit()


def mark_failed(db: Session, job: Job, error: str) -> None:
    job.status = JobStatus.FAILED.value
    job.error = error[:2000]
    db.commit()


def set_progress(db: Session, job: Job, progress: int) -> None:
    job.progress = progress
    db.commit()
