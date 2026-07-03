"""Query endpoints: non-streaming JSON and streaming plain text."""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.dependencies import CurrentUser, RAGServiceDep
from app.core.exceptions import AppError
from app.core.logger import get_logger
from app.models.requests import QueryRequest
from app.models.responses import CitationsResponse, QueryResponse
from app.utils.google_errors import map_google_exception
from app.utils.streaming import continue_token_stream, start_token_stream

logger = get_logger(__name__)

router = APIRouter(prefix="/query", tags=["query"])


@router.post("", response_model=QueryResponse)
def query(
    payload: QueryRequest,
    user: CurrentUser,
    service: RAGServiceDep,
) -> QueryResponse:
    start = time.perf_counter()
    result = service.answer(payload.question, top_k=payload.top_k)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "Query user=%s citations=%d latency_ms=%.1f",
        user.user_id, len(result.citations), elapsed_ms,
    )
    return result


@router.post("/citations", response_model=CitationsResponse)
def query_citations(
    payload: QueryRequest,
    user: CurrentUser,
    service: RAGServiceDep,
) -> CitationsResponse:
    """Return source citations for a question without generating an answer."""
    try:
        citations = service.citations_for(payload.question, top_k=payload.top_k)
    except AppError:
        raise
    except Exception as exc:
        logger.exception("Citations failed user=%s", user.user_id)
        raise map_google_exception(exc) from exc
    logger.info("Citations user=%s count=%d", user.user_id, len(citations))
    return CitationsResponse(citations=citations)


@router.post("/stream")
def query_stream(
    payload: QueryRequest,
    user: CurrentUser,
    service: RAGServiceDep,
) -> StreamingResponse:
    logger.info("Query stream started user=%s", user.user_id)

    prefix, token_iter = start_token_stream(
        service.answer_stream(payload.question, top_k=payload.top_k),
        on_error=map_google_exception,
    )

    def token_generator():
        try:
            yield from continue_token_stream(
                prefix, token_iter, on_error=map_google_exception
            )
        except AppError:
            raise
        except Exception as exc:
            logger.exception("Query stream failed user=%s", user.user_id)
            raise map_google_exception(exc) from exc

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
