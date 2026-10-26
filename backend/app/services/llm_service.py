"""LLM wrapper — the ONLY place Gemini chat models are called.

Uses the native ``google.genai`` client so both legacy ``AIza`` and newer
``AQ.`` auth keys from Google AI Studio work correctly.
"""

from __future__ import annotations

from collections.abc import Iterator

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
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


def _parts_from_human_content(content: object) -> list[types.Part]:
    """Build Gemini parts from a string or multimodal content list.

    Multimodal list items use::
        {"type": "text", "text": "..."}
        {"type": "image", "data": <bytes>, "mime_type": "image/jpeg"}
    """
    if isinstance(content, list):
        parts: list[types.Part] = []
        for item in content:
            if not isinstance(item, dict):
                text = _message_text(item)
                if text:
                    parts.append(types.Part.from_text(text=text))
                continue
            kind = item.get("type")
            if kind == "text":
                text = _message_text(item.get("text"))
                if text:
                    parts.append(types.Part.from_text(text=text))
            elif kind == "image":
                data = item.get("data")
                mime = item.get("mime_type") or item.get("mimeType") or "image/jpeg"
                if isinstance(data, (bytes, bytearray)) and data:
                    parts.append(
                        types.Part.from_bytes(data=bytes(data), mime_type=str(mime))
                    )
        if not parts:
            parts.append(types.Part.from_text(text=""))
        return parts

    return [types.Part.from_text(text=_message_text(content))]


def _to_genai_request(
    messages: list[BaseMessage],
) -> tuple[str | None, list[types.Content]]:
    """Convert LangChain messages to Gemini system instruction + contents."""
    system_instruction: str | None = None
    contents: list[types.Content] = []

    for message in messages:
        if isinstance(message, SystemMessage):
            system_instruction = _message_text(message.content)
        elif isinstance(message, HumanMessage):
            contents.append(
                types.Content(
                    role="user",
                    parts=_parts_from_human_content(message.content),
                )
            )
        elif isinstance(message, AIMessage):
            contents.append(
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=_message_text(message.content))],
                )
            )

    return system_instruction, contents


def _generation_config(
    settings: Settings,
    system_instruction: str | None,
) -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        temperature=0.1,
        system_instruction=system_instruction,
    )


def _map_client_error(exc: ClientError) -> UpstreamError | RateLimitError:
    status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
    message = str(exc)
    upper = message.upper()

    if status == 429 or "RESOURCE_EXHAUSTED" in upper:
        return RateLimitError("Gemini rate limit exceeded. Try again shortly.")
    if status == 401 or "UNAUTHENTICATED" in upper:
        return UpstreamError(
            "Gemini authentication failed. Check GOOGLE_API_KEY in backend .env."
        )
    if status == 503:
        return UpstreamError("Gemini is temporarily unavailable. Try again shortly.")
    return UpstreamError(f"Gemini request failed: {message}")


class LLMService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = genai.Client(api_key=settings.google_api_key)

    @retry(
        retry=retry_if_exception_type(RateLimitError),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def chat(self, messages: list[BaseMessage]) -> str:
        system_instruction, contents = _to_genai_request(messages)
        try:
            response = self._client.models.generate_content(
                model=self._settings.gemini_chat_model,
                contents=contents,
                config=_generation_config(self._settings, system_instruction),
            )
        except ClientError as exc:
            logger.error("Gemini API error: %s", exc)
            raise _map_client_error(exc) from exc
        except Exception as exc:
            logger.error("Gemini API error: %s", exc)
            raise UpstreamError("Gemini request failed") from exc

        return response.text or ""

    def stream(self, messages: list[BaseMessage]) -> Iterator[str]:
        """Yield answer tokens as plain text deltas."""
        system_instruction, contents = _to_genai_request(messages)
        try:
            stream = self._client.models.generate_content_stream(
                model=self._settings.gemini_chat_model,
                contents=contents,
                config=_generation_config(self._settings, system_instruction),
            )
            for chunk in stream:
                text = chunk.text
                if text:
                    yield text
        except ClientError as exc:
            logger.error("Gemini API error (stream): %s", exc)
            raise _map_client_error(exc) from exc
        except Exception as exc:
            logger.error("Gemini API error (stream): %s", exc)
            raise UpstreamError("Gemini request failed") from exc

    def summarize(self, text: str) -> str:
        messages = [
            SystemMessage(content="Summarize the following text concisely."),
            HumanMessage(content=text),
        ]
        return self.chat(messages)
