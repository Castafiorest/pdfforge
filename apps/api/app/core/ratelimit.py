import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.core.config import get_settings

settings = get_settings()

_lock = threading.Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)

_WINDOW_SECONDS = 3600


def _client_ip(request: Request) -> str:
    """Resolve client IP, trusting X-Forwarded-For when behind a proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request) -> None:
    """Reject requests that exceed the per-IP hourly job limit."""
    if not settings.rate_limit_enabled:
        return
    ip = _client_ip(request)
    now = time.monotonic()
    with _lock:
        q = _hits[ip]
        while q and now - q[0] > _WINDOW_SECONDS:
            q.popleft()
        if len(q) >= settings.rate_limit_jobs_per_hour:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
            )
        q.append(now)
