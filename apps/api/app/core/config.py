from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables (and `.env`)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str = "sqlite:///./data/pdfforge.db"

    temp_dir: Path = Path("/tmp/pdfforge")
    max_file_size_mb: int = 100
    max_pages: int = 500
    max_concurrent_jobs: int = 2
    job_ttl_minutes: int = 30

    # Files larger than this (MB) should be processed server-side.
    client_side_max_mb: int = 40

    rate_limit_enabled: bool = True
    rate_limit_jobs_per_hour: int = 10

    cleanup_interval_minutes: int = 5

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Future: Redis-backed queue / rate limiting.
    redis_url: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
