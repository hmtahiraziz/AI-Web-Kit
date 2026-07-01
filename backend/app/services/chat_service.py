"""Direct LLM chat — no retrieval or citations.

Used by ``POST /api/chat/stream`` for general assistant chat (e.g. mobile).
"""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.llm_service import LLMService

_SYSTEM_PROMPT = (
    "You are a helpful, concise AI assistant. Answer clearly and accurately."
)


class ChatService:
    def __init__(self, llm_service: LLMService) -> None:
        self._llm = llm_service

    def stream(self, message: str) -> Iterator[str]:
        """Yield plain-text answer tokens for a single user message."""
        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=message),
        ]
        yield from self._llm.stream(messages)
