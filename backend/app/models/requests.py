"""Inbound request models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Payload for ``POST /api/query`` and ``POST /api/query/stream``."""

    question: str = Field(..., min_length=1, max_length=4000)
    top_k: int | None = Field(default=None, ge=1, le=20, alias="topK")

    model_config = {"populate_by_name": True}
