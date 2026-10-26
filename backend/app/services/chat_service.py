"""Direct LLM chat — no retrieval or citations.

Used by ``POST /api/chat/stream`` for general assistant chat (e.g. mobile).
Supports optional vision images and prior conversation turns.
"""

from __future__ import annotations

from collections.abc import Iterator, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

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
        history: Sequence[tuple[str, str]] | None = None,
        image_bytes: bytes | None = None,
        image_mime: str | None = None,
    ) -> Iterator[str]:
        """Yield plain-text answer tokens for a user message (optionally with image)."""
        prompt = resolve_system_prompt(mode, system_prompt)
        text = (message or "").strip()
        # Require the caller's question — no predefined vision caption.
        if not text:
            return

        messages: list[BaseMessage] = [SystemMessage(content=prompt)]

        for role, content in history or ():
            cleaned = (content or "").strip()
            if not cleaned:
                continue
            if role == "assistant":
                messages.append(AIMessage(content=cleaned))
            elif role == "user":
                messages.append(HumanMessage(content=cleaned))

        if image_bytes and image_mime:
            messages.append(
                HumanMessage(
                    content=[
                        {"type": "text", "text": text},
                        {
                            "type": "image",
                            "data": image_bytes,
                            "mime_type": image_mime,
                        },
                    ]
                )
            )
        else:
            messages.append(HumanMessage(content=text))

        yield from self._llm.stream(messages)
