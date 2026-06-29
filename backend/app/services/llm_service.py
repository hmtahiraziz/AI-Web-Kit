"""LLM wrapper — the ONLY place OpenAI chat models are called.

Exposes ``chat``, ``stream``, and ``summarize``. Other services depend on this
interface, never on ``ChatOpenAI`` directly.
"""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI
from openai import APIError, RateLimitError as OpenAIRateLimit
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


class LLMService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._chat = ChatOpenAI(
            model=settings.openai_chat_model,
            api_key=settings.openai_api_key,
            temperature=0.1,
            streaming=True,
        )

    @retry(
        retry=retry_if_exception_type(OpenAIRateLimit),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def chat(self, messages: list[BaseMessage]) -> str:
        try:
            response = self._chat.invoke(messages)
        except OpenAIRateLimit as exc:
            logger.warning("OpenAI rate limit: %s", exc)
            raise RateLimitError("OpenAI rate limit exceeded") from exc
        except APIError as exc:
            logger.error("OpenAI API error: %s", exc)
            raise UpstreamError("OpenAI request failed") from exc
        return str(response.content)

    def stream(self, messages: list[BaseMessage]) -> Iterator[str]:
        """Yield answer tokens as plain text deltas."""
        try:
            for chunk in self._chat.stream(messages):
                token = chunk.content
                if token:
                    yield str(token)
        except OpenAIRateLimit as exc:
            logger.warning("OpenAI rate limit (stream): %s", exc)
            raise RateLimitError("OpenAI rate limit exceeded") from exc
        except APIError as exc:
            logger.error("OpenAI API error (stream): %s", exc)
            raise UpstreamError("OpenAI request failed") from exc

    def summarize(self, text: str) -> str:
        from langchain_core.messages import HumanMessage, SystemMessage

        messages = [
            SystemMessage(content="Summarize the following text concisely."),
            HumanMessage(content=text),
        ]
        return self.chat(messages)
