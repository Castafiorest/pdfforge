import json
import shutil
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


def job_dir(job_id: str) -> Path:
    return settings.temp_dir / "jobs" / job_id


def ensure_job_dir(job_id: str) -> Path:
    d = job_dir(job_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def input_path(job_id: str, index: int = 0) -> Path:
    return job_dir(job_id) / f"input-{index}.pdf"


def upload_paths(job_id: str) -> list[Path]:
    """All saved uploads for a job (used by merge)."""
    return sorted(job_dir(job_id).glob("input-*.pdf"))


def output_path(job_id: str) -> Path:
    return job_dir(job_id) / "output.pdf"


def output_zip_path(job_id: str) -> Path:
    return job_dir(job_id) / "output.zip"


def metadata_path(job_id: str) -> Path:
    return job_dir(job_id) / "metadata.json"


def params_path(job_id: str) -> Path:
    return job_dir(job_id) / "params.json"


def save_params(job_id: str, params: dict) -> None:
    params_path(job_id).write_text(json.dumps(params), encoding="utf-8")


def load_params(job_id: str) -> dict:
    p = params_path(job_id)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {}


def save_upload(job_id: str, data: bytes, index: int = 0) -> Path:
    p = input_path(job_id, index)
    p.write_bytes(data)
    return p


def read_input(job_id: str) -> bytes:
    return input_path(job_id).read_bytes()


def read_output(job_id: str) -> bytes:
    return output_path(job_id).read_bytes()


def output_file(job_id: str) -> Path:
    """Return the actual output artifact (ZIP takes precedence)."""
    if output_zip_path(job_id).exists():
        return output_zip_path(job_id)
    return output_path(job_id)


def delete_job_dir(job_id: str) -> None:
    d = job_dir(job_id)
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
