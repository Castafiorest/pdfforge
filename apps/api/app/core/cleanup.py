import time
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.config import get_settings
from app.db import SessionLocal
from app.models.job import Job, JobStatus
from app.services import storage

settings = get_settings()


def run_cleanup_once() -> int:
    """Delete expired jobs and mark stale (crashed) jobs as failed. Returns count."""
    now = datetime.now(UTC)
    removed = 0

    with SessionLocal() as db:
        # 1) Jobs past their TTL are deleted.
        expired = db.scalars(
            select(Job).where(
                Job.expires_at.isnot(None),
                Job.expires_at < now,
                Job.status.in_(
                    [
                        JobStatus.COMPLETED.value,
                        JobStatus.QUEUED.value,
                        JobStatus.PROCESSING.value,
                    ]
                ),
            )
        ).all()
        for job in expired:
            storage.delete_job_dir(job.id)
            job.status = JobStatus.EXPIRED.value
            removed += 1

        # 2) Jobs stuck in queued/processing longer than TTL (crashed workers).
        cutoff = now - timedelta(minutes=settings.job_ttl_minutes)
        stale = db.scalars(
            select(Job).where(
                Job.created_at < cutoff,
                Job.status.in_(
                    [JobStatus.QUEUED.value, JobStatus.PROCESSING.value]
                ),
            )
        ).all()
        for job in stale:
            storage.delete_job_dir(job.id)
            job.status = JobStatus.FAILED.value
            job.error = job.error or "Job timed out before processing."
            removed += 1

        db.commit()
    return removed


def cleanup_loop(stop_event=None) -> None:
    """Periodic cleanup loop; runs in the worker process."""
    while True:
        if stop_event and stop_event.is_set():
            break
        try:
            run_cleanup_once()
        except Exception:
            pass
        time.sleep(settings.cleanup_interval_minutes * 60)
