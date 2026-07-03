"""Helpers for plain-text streaming endpoints."""

from __future__ import annotations

from collections.abc import Callable, Iterator

from app.core.exceptions import AppError


def start_token_stream(
    token_iter: Iterator[str],
    *,
    on_error: Callable[[Exception], AppError],
) -> tuple[list[str], Iterator[str]]:
    """Consume the first token before returning a ``StreamingResponse``.

    Errors while producing the first token are raised here so they can still be
    mapped to a normal JSON error response.
    """
    try:
        first = next(token_iter)
    except StopIteration:
        return [], token_iter
    except AppError:
        raise
    except Exception as exc:
        raise on_error(exc) from exc

    return [first], token_iter


def continue_token_stream(
    prefix: list[str],
    token_iter: Iterator[str],
    *,
    on_error: Callable[[Exception], AppError],
) -> Iterator[str]:
    """Yield any prefetched tokens, then the remainder of ``token_iter``."""
    yield from prefix
    try:
        yield from token_iter
    except AppError:
        raise
    except Exception as exc:
        raise on_error(exc) from exc
