from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

JobStatusLiteral = Literal[
    "queued", "processing", "completed", "failed", "expired", "deleted"
]


class JobCreateResponse(BaseModel):
    job_id: str
    status: str = "queued"


class BatchJobItem(BaseModel):
    job_id: str
    filename: str | None = None
    original_size: int | None = None


class BatchCompressResponse(BaseModel):
    jobs: list[BatchJobItem]


class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tool: str
    status: JobStatusLiteral
    progress: int = 0
    original_filename: str | None = None
    original_size: int | None = None
    output_size: int | None = None
    reduction_percent: float | None = None
    preset: str | None = None
    error: str | None = None
    created_at: datetime | None = None
    expires_at: datetime | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
