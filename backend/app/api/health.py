"""Health check endpoint (public)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings
from app.models.responses import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="healthy", version=get_settings().app_version)
