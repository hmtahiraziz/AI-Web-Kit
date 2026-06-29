"""Domain-level exceptions.

These are raised by services and translated into HTTP responses by the
centralized exception handlers registered in ``app.main``.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for application errors."""

    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class AuthError(AppError):
    status_code = 401
    detail = "Authentication failed"


class ForbiddenError(AppError):
    status_code = 403
    detail = "Forbidden"


class NotFoundError(AppError):
    status_code = 404
    detail = "Resource not found"


class UnsupportedFileError(AppError):
    status_code = 422
    detail = "Unsupported file type"


class RateLimitError(AppError):
    status_code = 429
    detail = "Rate limit exceeded"


class UpstreamError(AppError):
    status_code = 502
    detail = "Upstream provider error"
