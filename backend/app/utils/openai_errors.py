"""Map OpenAI / LangChain OpenAI SDK errors to application errors."""

from __future__ import annotations

from openai import APIError, AuthenticationError, RateLimitError as OpenAIRateLimitError

from app.core.exceptions import AppError, RateLimitError, UpstreamError

try:
    from langchain_openai.chat_models.base import OpenAIError as LangChainOpenAIError
except ImportError:  # pragma: no cover
    try:
        from openai import OpenAIError as LangChainOpenAIError
    except ImportError:
        LangChainOpenAIError = type("LangChainOpenAIError", (Exception,), {})


def map_openai_exception(exc: Exception) -> AppError:
    """Translate provider errors into ``AppError`` subclasses for HTTP handlers."""
    if isinstance(exc, AppError):
        return exc

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

    message = str(exc)
    upper = message.upper()

    if isinstance(exc, LangChainOpenAIError) or "OPENAI" in upper:
        if "429" in upper or "RATE LIMIT" in upper or "RATE_LIMIT" in upper:
            return RateLimitError("OpenAI rate limit exceeded. Try again shortly.")
        if "401" in upper or "403" in upper or "AUTH" in upper or "API KEY" in upper:
            return UpstreamError(
                "OpenAI authentication failed. Check OPENAI_API_KEY in backend .env."
            )
        if "503" in upper or "502" in upper or "500" in upper:
            return UpstreamError(
                "OpenAI is temporarily unavailable. Try again shortly."
            )
        return UpstreamError(f"OpenAI request failed: {message}")

    return UpstreamError("Upstream provider error")
