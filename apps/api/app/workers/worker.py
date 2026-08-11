import threading
import time
import zipfile
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.cleanup import run_cleanup_once
from app.core.config import get_settings
from app.db import SessionLocal
from app.models.job import Job, JobStatus
from app.services import job_service, storage
from app.services.compression import compress
from app.services.tools import merge_pdfs, pdf_to_image_zip, remove_metadata, split_pdf

settings = get_settings()

_semaphore = threading.BoundedSemaphore(max(1, settings.max_concurrent_jobs))

def _retry(fn, attempts: int = 4, base_delay: float = 0.05):
    """Retry a callable against transient OS/DB locks (e.g. Windows Defender,
    SQLite busy). Raises the last error when all attempts are exhausted."""
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            return fn()
        except Exception as exc:
            last = exc
            if attempt < attempts - 1:
                time.sleep(base_delay * (attempt + 1))
    assert last is not None
    raise last

# ── Tool handlers ───────────────────────────────────────────────────────
def _handle_compress(job_id: str, params: dict) -> dict:
    preset = params.get("preset") or "balanced"
    size = compress(storage.input_path(job_id), storage.output_path(job_id), preset)
    return {"output_size": size}


def _handle_split(job_id: str, params: dict) -> dict:
    every = params.get("every")
    page_spec = params.get("page_spec", "")
    parts = split_pdf(
        storage.input_path(job_id),
        storage.job_dir(job_id),
        page_spec,
        int(every) if every else None,
    )
    if len(parts) == 1:
        parts[0].replace(storage.output_path(job_id))
        out = storage.output_path(job_id)
    else:
        out = _zip_outputs(job_id, parts)
    return {"output_size": out.stat().st_size}


def _handle_merge(job_id: str, params: dict) -> dict:
    size = merge_pdfs(storage.upload_paths(job_id), storage.output_path(job_id))
    return {"output_size": size}


def _handle_pdf_to_image(job_id: str, params: dict) -> dict:
    size = pdf_to_image_zip(
        storage.input_path(job_id),
        storage.output_zip_path(job_id),
        image_format=params.get("format", "png"),
        dpi=int(params.get("dpi", 150)),
        page_spec=params.get("pages") or None,
    )
    return {"output_size": size}


def _handle_remove_metadata(job_id: str, params: dict) -> dict:
    size = remove_metadata(storage.input_path(job_id), storage.output_path(job_id))
    return {"output_size": size}


HANDLERS = {
    "compress": _handle_compress,
    "split": _handle_split,
    "merge": _handle_merge,
    "pdf-to-image": _handle_pdf_to_image,
    "remove-metadata": _handle_remove_metadata,
}


def _zip_outputs(job_id: str, files: list) -> object:
    zpath = storage.output_zip_path(job_id)
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, f.name)
    return zpath


def _validate_output_pdf(path) -> None:
    """Compression safety: never return a file that can't be opened."""
    import pikepdf

    def _open_check() -> None:
        with pikepdf.open(path) as pdf:
            if len(pdf.pages) == 0:
                raise RuntimeError("Processing produced a PDF with no pages.")

    _retry(_open_check)


# ── Queue claim & dispatch ──────────────────────────────────────────────
def _claim_and_dispatch() -> None:
    with SessionLocal() as db:
        jobs = db.scalars(
            select(Job)
            .where(Job.status == JobStatus.QUEUED.value)
            .order_by(Job.created_at)
            .limit(settings.max_concurrent_jobs)
        ).all()
        ids: list[str] = []
        for job in jobs:
            job.status = JobStatus.PROCESSING.value
            job.progress = 5
            job.started_at = datetime.now(UTC)
            ids.append(job.id)
        db.commit()

    for job_id in ids:
        threading.Thread(
            target=_process_job_id, args=(job_id,), daemon=True
        ).start()


def _process_job_id(job_id: str) -> None:
    try:
        with _semaphore:
            _process_job(job_id)
    except Exception as exc:
        with SessionLocal() as db:
            job = db.get(Job, job_id)
            if job:
                job_service.mark_failed(db, job, str(exc))


def _process_job(job_id: str) -> None:
    with SessionLocal() as db:
        job = db.get(Job, job_id)
        if job is None or job.status not in (
            JobStatus.QUEUED.value,
            JobStatus.PROCESSING.value,
        ):
            return
        job_service.mark_processing(db, job)

    params = storage.load_params(job_id)
    handler = HANDLERS.get(params.get("tool") or _tool_for(job_id))
    if handler is None:
        raise RuntimeError("No handler for tool.")

    result = handler(job_id, params)

    out = storage.output_file(job_id)
    if not out.exists() or out.stat().st_size == 0:
        raise RuntimeError("Processing produced no output.")
    if out.suffix == ".pdf":
        _validate_output_pdf(out)

    with SessionLocal() as db:
        job = db.get(Job, job_id)
        if job:
            # Retry: transient SQLite "database is locked" must not flip a
            # successful job to failed.
            _retry(lambda: job_service.mark_completed(db, job, result.get("output_size")))


def _tool_for(job_id: str) -> str:
    with SessionLocal() as db:
        job = db.get(Job, job_id)
        return job.tool if job else ""


# ── Main loop ───────────────────────────────────────────────────────────
def worker_loop(stop_event=None) -> None:
    while True:
        if stop_event and stop_event.is_set():
            break
        try:
            run_cleanup_once()
        except Exception:
            pass
        try:
            _claim_and_dispatch()
        except Exception:
            pass
        time.sleep(1)


def main() -> None:
    print(f"PDFForge worker starting (concurrency={settings.max_concurrent_jobs})...")
    try:
        worker_loop()
    except KeyboardInterrupt:
        print("Worker stopped.")


if __name__ == "__main__":
    main()
