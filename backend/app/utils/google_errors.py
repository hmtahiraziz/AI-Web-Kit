"""Map Google Gemini / GenAI SDK errors to application errors."""

from __future__ import annotations

from google.genai.errors import ClientError

from app.core.exceptions import AppError, RateLimitError, UpstreamError

try:
    from langchain_google_genai._common import GoogleGenerativeAIError
except ImportError:  # pragma: no cover
    GoogleGenerativeAIError = type("GoogleGenerativeAIError", (Exception,), {})


def map_google_exception(exc: Exception) -> AppError:
    """Translate provider errors into ``AppError`` subclasses for HTTP handlers."""
    if isinstance(exc, AppError):
        return exc

    status: int | None = None
    message = str(exc)

    if isinstance(exc, ClientError):
        status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
        message = str(exc)

    if isinstance(exc, GoogleGenerativeAIError):
        message = str(exc)
        upper = message.upper()
        if "RESOURCE_EXHAUSTED" in upper or "429" in upper:
            return RateLimitError("Gemini rate limit exceeded. Try again shortly.")
        if "UNAUTHENTICATED" in upper or "401" in upper:
            return UpstreamError(
                "Gemini authentication failed. Check GOOGLE_API_KEY in backend .env."
            )

    if status == 429:
        return RateLimitError("Gemini rate limit exceeded. Try again shortly.")
    if status == 401:
        return UpstreamError(
            "Gemini authentication failed. Check GOOGLE_API_KEY in backend .env."
        )
    if status == 503:
        return UpstreamError("Gemini is temporarily unavailable. Try again shortly.")

    if isinstance(exc, GoogleGenerativeAIError):
        return UpstreamError(f"Gemini request failed: {message}")

    return UpstreamError("Upstream provider error")
