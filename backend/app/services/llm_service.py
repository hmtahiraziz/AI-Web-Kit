"""LLM wrapper — the ONLY place Gemini chat models are called.

Exposes ``chat``, ``stream``, and ``summarize``. Other services depend on this
interface, never on ``ChatGoogleGenerativeAI`` directly.
"""

from __future__ import annotations

from collections.abc import Iterator

from google.api_core.exceptions import GoogleAPIError, ResourceExhausted
from google.genai.errors import ClientError
from langchain_core.messages import BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
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

try:
    from langchain_google_genai._common import GoogleGenerativeAIError
except ImportError:  # pragma: no cover
    GoogleGenerativeAIError = type("GoogleGenerativeAIError", (Exception,), {})


def _chunk_text(content: object) -> str:
    """Normalize LangChain/Gemini chunk content to plain text."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text", "")))
            else:
                parts.append(str(block))
        return "".join(parts)
    return str(content)


class LLMService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._chat = ChatGoogleGenerativeAI(
            model=settings.gemini_chat_model,
            google_api_key=settings.google_api_key,
            temperature=0.1,
            streaming=True,
        )

    @retry(
        retry=retry_if_exception_type(ResourceExhausted),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def chat(self, messages: list[BaseMessage]) -> str:
        try:
            response = self._chat.invoke(messages)
        except ResourceExhausted as exc:
            logger.warning("Gemini rate limit: %s", exc)
            raise RateLimitError("Gemini rate limit exceeded") from exc
        except (GoogleAPIError, ClientError, GoogleGenerativeAIError) as exc:
            logger.error("Gemini API error: %s", exc)
            raise UpstreamError("Gemini request failed") from exc
        return _chunk_text(response.content)

    def stream(self, messages: list[BaseMessage]) -> Iterator[str]:
        """Yield answer tokens as plain text deltas."""
        try:
            for chunk in self._chat.stream(messages):
                token = _chunk_text(chunk.content)
                if token:
                    yield token
        except ResourceExhausted as exc:
            logger.warning("Gemini rate limit (stream): %s", exc)
            raise RateLimitError("Gemini rate limit exceeded") from exc
        except (GoogleAPIError, ClientError, GoogleGenerativeAIError) as exc:
            logger.error("Gemini API error (stream): %s", exc)
            raise UpstreamError("Gemini request failed") from exc

    def summarize(self, text: str) -> str:
        from langchain_core.messages import HumanMessage, SystemMessage

        messages = [
            SystemMessage(content="Summarize the following text concisely."),
            HumanMessage(content=text),
        ]
        return self.chat(messages)
