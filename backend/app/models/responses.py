"""Outbound response models.

Field names use the exact casing the Next.js frontend consumes (e.g.
``documentId``) so responses serialize to the agreed wire contract.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"


class IngestResponse(BaseModel):
    success: bool = True
    document_id: str = Field(..., serialization_alias="documentId")
    chunks: int

    model_config = {"populate_by_name": True}


class DocumentSummary(BaseModel):
    """One item in ``GET /api/documents``."""

    id: str
    filename: str
    size: int = 0
    chunks: int = 0
    status: str = "ready"
    created_at: str = Field(..., serialization_alias="createdAt")

    model_config = {"populate_by_name": True}


class DeleteResponse(BaseModel):
    success: bool = True
    document_id: str = Field(..., serialization_alias="documentId")

    model_config = {"populate_by_name": True}


class Citation(BaseModel):
    source: str
    page: int | None = None
    section: str | None = None


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)


class CitationsResponse(BaseModel):
    citations: list[Citation] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    detail: str
