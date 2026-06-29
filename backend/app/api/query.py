"""Query endpoints: non-streaming JSON and streaming plain text."""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.dependencies import CurrentUser, RAGServiceDep
from app.core.logger import get_logger
from app.models.requests import QueryRequest
from app.models.responses import QueryResponse

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


@router.post("/stream")
def query_stream(
    payload: QueryRequest,
    user: CurrentUser,
    service: RAGServiceDep,
) -> StreamingResponse:
    logger.info("Query stream started user=%s", user.user_id)

    def token_generator():
        for token in service.answer_stream(payload.question, top_k=payload.top_k):
            yield token

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
