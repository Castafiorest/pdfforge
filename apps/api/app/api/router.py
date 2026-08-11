from fastapi import APIRouter

from app.api.routes import health, jobs, preview, tools

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(preview.router)
api_router.include_router(tools.router)
api_router.include_router(jobs.router)
