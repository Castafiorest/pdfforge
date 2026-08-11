from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.cleanup import run_cleanup_once
from app.core.config import get_settings
from app.db import engine
from app.models import Base

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # MVP: create tables on startup. Alembic migrations come in a later phase.
    Base.metadata.create_all(bind=engine)
    try:
        run_cleanup_once()
    except Exception:
        pass
    yield


app = FastAPI(
    title="PDFForge API",
    version="0.1.0",
    description="Privacy-first PDF toolkit API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
