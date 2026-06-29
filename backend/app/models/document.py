"""Document and chunk metadata models."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ChunkMetadata(BaseModel):
    """Metadata attached to every embedded chunk stored in FAISS.

    These fields are also used to build citations at query time.
    """

    document_id: str
    filename: str
    page_number: int | None = None
    section: str | None = None
    chunk_id: str
    created_at: str = Field(default_factory=_utcnow_iso)

    model_config = ConfigDict(extra="ignore")


class DocumentRecord(BaseModel):
    """Registry entry describing an ingested document."""

    document_id: str
    filename: str
    content_type: str | None = None
    size: int = 0
    chunks: int = 0
    status: str = "ready"
    created_at: str = Field(default_factory=_utcnow_iso)
