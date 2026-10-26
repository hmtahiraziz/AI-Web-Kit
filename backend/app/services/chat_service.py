"""Direct LLM chat — no retrieval or citations.

Used by ``POST /api/chat/stream`` for general assistant chat (e.g. mobile).
"""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.modes import resolve_system_prompt
from app.services.llm_service import LLMService


class ChatService:
    def __init__(self, llm_service: LLMService) -> None:
        self._llm = llm_service

    def stream(
        self,
        message: str,
        *,
        mode: str | None = None,
        system_prompt: str | None = None,
    ) -> Iterator[str]:
        """Yield plain-text answer tokens for a single user message."""
        prompt = resolve_system_prompt(mode, system_prompt)
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=message),
        ]
        yield from self._llm.stream(messages)
