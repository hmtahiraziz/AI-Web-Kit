"""Health check endpoint (public)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings
from app.db import check_database
from app.models.responses import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    summary="Liveness / dependency check",
    response_model=HealthResponse,
)
def health() -> HealthResponse:
    db = check_database()
    overall = "healthy" if db["status"] in {"ok", "unconfigured"} else "degraded"
    return HealthResponse(
        status=overall,
        version=get_settings().app_version,
        database=db["status"],
    )
