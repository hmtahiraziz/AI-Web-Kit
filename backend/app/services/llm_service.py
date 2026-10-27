"""LLM wrapper — the ONLY place OpenAI chat models are called.

Uses the official ``openai`` client for chat completions (including vision).
"""

from __future__ import annotations

import base64
from collections.abc import Iterator
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from openai import (
    APIError,
    AuthenticationError,
    OpenAI,
    RateLimitError as OpenAIRateLimitError,
)
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import Settings
from app.core.exceptions import RateLimitError, UpstreamError
from app.core.logger import get_logger

logger = get_logger(__name__)


def _message_text(content: object) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    return str(content)


def _parts_from_human_content(content: object) -> str | list[dict[str, Any]]:
    """Build OpenAI user content from a string or multimodal content list.

    Multimodal list items use::
        {"type": "text", "text": "..."}
        {"type": "image", "data": <bytes>, "mime_type": "image/jpeg"}
    """
    if isinstance(content, list):
        parts: list[dict[str, Any]] = []
        for item in content:
            if not isinstance(item, dict):
                text = _message_text(item)
                if text:
                    parts.append({"type": "text", "text": text})
                continue
            kind = item.get("type")
            if kind == "text":
                text = _message_text(item.get("text"))
                if text:
                    parts.append({"type": "text", "text": text})
            elif kind == "image":
                data = item.get("data")
                mime = item.get("mime_type") or item.get("mimeType") or "image/jpeg"
                if isinstance(data, (bytes, bytearray)) and data:
                    b64 = base64.b64encode(bytes(data)).decode("ascii")
                    parts.append(
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime};base64,{b64}",
                            },
                        }
                    )
        if not parts:
            return ""
        return parts

    return _message_text(content)


def _to_openai_messages(messages: list[BaseMessage]) -> list[dict[str, Any]]:
    """Convert LangChain messages to OpenAI chat completion messages."""
    result: list[dict[str, Any]] = []

    for message in messages:
        if isinstance(message, SystemMessage):
            result.append(
                {"role": "system", "content": _message_text(message.content)}
            )
        elif isinstance(message, HumanMessage):
            result.append(
                {"role": "user", "content": _parts_from_human_content(message.content)}
            )
        elif isinstance(message, AIMessage):
            result.append(
                {"role": "assistant", "content": _message_text(message.content)}
            )

    return result


def _map_openai_error(exc: Exception) -> UpstreamError | RateLimitError:
    if isinstance(exc, OpenAIRateLimitError):
        return RateLimitError("OpenAI rate limit exceeded. Try again shortly.")
    if isinstance(exc, AuthenticationError):
        return UpstreamError(
            "OpenAI authentication failed. Check OPENAI_API_KEY in backend .env."
        )
    if isinstance(exc, APIError):
        status = getattr(exc, "status_code", None)
        message = str(exc)
        if status == 429:
            return RateLimitError("OpenAI rate limit exceeded. Try again shortly.")
        if status in {401, 403}:
            return UpstreamError(
                "OpenAI authentication failed. Check OPENAI_API_KEY in backend .env."
            )
        if status in {500, 502, 503}:
            return UpstreamError(
                "OpenAI is temporarily unavailable. Try again shortly."
            )
        return UpstreamError(f"OpenAI request failed: {message}")
    return UpstreamError("OpenAI request failed")


class LLMService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = OpenAI(api_key=settings.openai_api_key)

    @retry(
        retry=retry_if_exception_type(RateLimitError),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def chat(self, messages: list[BaseMessage]) -> str:
        payload = _to_openai_messages(messages)
        try:
            response = self._client.chat.completions.create(
                model=self._settings.openai_chat_model,
                messages=payload,
                temperature=0.1,
            )
        except (APIError, AuthenticationError, OpenAIRateLimitError) as exc:
            logger.error("OpenAI API error: %s", exc)
            raise _map_openai_error(exc) from exc
        except Exception as exc:
            logger.error("OpenAI API error: %s", exc)
            raise UpstreamError("OpenAI request failed") from exc

        choice = response.choices[0] if response.choices else None
        return (choice.message.content if choice and choice.message else None) or ""

    def stream(self, messages: list[BaseMessage]) -> Iterator[str]:
        """Yield answer tokens as plain text deltas."""
        payload = _to_openai_messages(messages)
        try:
            stream = self._client.chat.completions.create(
                model=self._settings.openai_chat_model,
                messages=payload,
                temperature=0.1,
                stream=True,
            )
            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                text = delta.content if delta else None
                if text:
                    yield text
        except (APIError, AuthenticationError, OpenAIRateLimitError) as exc:
            logger.error("OpenAI API error (stream): %s", exc)
            raise _map_openai_error(exc) from exc
        except Exception as exc:
            logger.error("OpenAI API error (stream): %s", exc)
            raise UpstreamError("OpenAI request failed") from exc

    def summarize(self, text: str) -> str:
        messages = [
            SystemMessage(content="Summarize the following text concisely."),
            HumanMessage(content=text),
        ]
        return self.chat(messages)
