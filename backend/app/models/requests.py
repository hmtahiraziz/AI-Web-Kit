"""Inbound request models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Payload for ``POST /api/query`` and ``POST /api/query/stream``."""

    question: str = Field(..., min_length=1, max_length=4000)
    top_k: int | None = Field(default=None, ge=1, le=20, alias="topK")

    model_config = {"populate_by_name": True}


class ChatRequest(BaseModel):
    """Payload for ``POST /api/chat/stream`` (direct LLM, no RAG)."""

    message: str = Field(..., min_length=1, max_length=4000)
    mode: str | None = Field(default=None, max_length=32)
    system_prompt: str | None = Field(default=None, max_length=4000, alias="systemPrompt")
    # Ragmob sync — when set, the completed turn is written to Neon.
    conversation_id: str | None = Field(default=None, max_length=64, alias="conversationId")
    user_message_id: str | None = Field(default=None, max_length=64, alias="userMessageId")
    assistant_message_id: str | None = Field(
        default=None, max_length=64, alias="assistantMessageId"
    )

    model_config = {"populate_by_name": True}


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)

