"""Inbound request models."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Payload for ``POST /api/query`` and ``POST /api/query/stream``."""

    question: str = Field(..., min_length=1, max_length=4000)
    top_k: int | None = Field(default=None, ge=1, le=20, alias="topK")

    model_config = {"populate_by_name": True}


class ChatImageUploadRequest(BaseModel):
    """JSON body for ``POST /api/chat/images`` (Ragmob preferred upload)."""

    image_base64: str = Field(
        ...,
        alias="imageBase64",
        min_length=8,
        max_length=16_000_000,
        description="Raw image bytes as standard base64 (no data: URL prefix).",
    )
    image_mime: str | None = Field(
        default=None,
        alias="imageMime",
        max_length=64,
    )
    conversation_id: str | None = Field(
        default=None,
        alias="conversationId",
        max_length=64,
        description="Optional early bind into conversation image context.",
    )

    model_config = {"populate_by_name": True}


class ChatRequest(BaseModel):
    """JSON payload for ``POST /api/chat/stream``.

    Contract:
    - Text-only: ``message`` (+ optional mode / ids) — unchanged / backward compatible.
    - Vision (Ragmob): upload via ``POST /api/chat/images``, then stream with ``imageId``.
    - Legacy: inline ``imageBase64`` on this path still accepted.
    """

    message: str = Field(default="", max_length=4000)
    mode: str | None = Field(default=None, max_length=32)
    system_prompt: str | None = Field(default=None, max_length=4000, alias="systemPrompt")
    # Ragmob sync — when set, the completed turn is written to Neon.
    conversation_id: str | None = Field(default=None, max_length=64, alias="conversationId")
    user_message_id: str | None = Field(default=None, max_length=64, alias="userMessageId")
    assistant_message_id: str | None = Field(
        default=None, max_length=64, alias="assistantMessageId"
    )
    # Preferred vision reference from POST /chat/images.
    image_id: str | None = Field(default=None, alias="imageId", max_length=64)
    # Legacy inline vision upload (still supported).
    image_base64: str | None = Field(
        default=None,
        alias="imageBase64",
        max_length=16_000_000,
        description="Raw image bytes as standard base64 (no data: URL prefix).",
    )
    image_mime: str | None = Field(
        default=None,
        alias="imageMime",
        max_length=64,
        description="Declared MIME, e.g. image/jpeg",
    )
    # Client re-using a prior image (via imageId or base64) for follow-up reliability.
    # Refreshes conversation context but must NOT mark Neon turn as a new upload.
    image_reuse: bool = Field(default=False, alias="imageReuse")

    model_config = {"populate_by_name": True}


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)


class FeedbackRequest(BaseModel):
    """Payload for ``POST /api/chat/feedback``."""

    message_id: str = Field(..., min_length=1, max_length=64, alias="messageId")
    conversation_id: str = Field(..., min_length=1, max_length=64, alias="conversationId")
    rating: Literal["up", "down"]

    model_config = {"populate_by_name": True}


class ReportRequest(BaseModel):
    """Payload for ``POST /api/chat/reports``."""

    message_id: str = Field(..., min_length=1, max_length=64, alias="messageId")
    conversation_id: str = Field(..., min_length=1, max_length=64, alias="conversationId")
    reason: Literal[
        "harmful",
        "illegal",
        "sexual_minors",
        "misinformation",
        "other",
    ]
    note: str | None = Field(default=None, max_length=2000)

    model_config = {"populate_by_name": True}

