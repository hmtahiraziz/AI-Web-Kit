"""Outbound response models.

Field names use the exact casing the Next.js frontend consumes (e.g.
``documentId``) so responses serialize to the agreed wire contract.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    database: str = "unconfigured"


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


class ChatImageUploadResponse(BaseModel):
    """Returned by ``POST /api/chat/images`` (Ragmob vision upload)."""

    image_id: str = Field(..., serialization_alias="imageId")
    mime_type: str = Field(..., serialization_alias="mimeType")
    width: int
    height: int
    expires_in_seconds: int = Field(..., serialization_alias="expiresInSeconds")

    model_config = {"populate_by_name": True}


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: int = Field(..., serialization_alias="createdAt")

    model_config = {"populate_by_name": True}


class ConversationSummaryResponse(BaseModel):
    id: str
    title: str
    mode: str | None = None
    updated_at: int = Field(..., serialization_alias="updatedAt")
    created_at: int | None = Field(default=None, serialization_alias="createdAt")

    model_config = {"populate_by_name": True}


class ConversationDetailResponse(ConversationSummaryResponse):
    messages: list[ChatMessageResponse] = Field(default_factory=list)


class DeleteConversationResponse(BaseModel):
    success: bool = True
    conversation_id: str = Field(..., serialization_alias="conversationId")

    model_config = {"populate_by_name": True}


class FeedbackResponse(BaseModel):
    success: bool = True
    message_id: str | None = Field(default=None, serialization_alias="messageId")
    rating: str | None = None

    model_config = {"populate_by_name": True}


class ReportResponse(BaseModel):
    success: bool = True
    id: str | None = None

    model_config = {"populate_by_name": True}


class DeleteAccountResponse(BaseModel):
    success: bool = True
    deleted: dict[str, int] = Field(default_factory=dict)
