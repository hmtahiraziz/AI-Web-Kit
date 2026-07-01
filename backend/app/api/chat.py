"""Direct LLM chat endpoint — plain-text streaming, no RAG."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.dependencies import ChatServiceDep, CurrentUser
from app.core.exceptions import AppError
from app.core.logger import get_logger
from app.models.requests import ChatRequest
from app.utils.google_errors import map_google_exception
from app.utils.streaming import continue_token_stream, start_token_stream

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
def chat_stream(
    payload: ChatRequest,
    user: CurrentUser,
    service: ChatServiceDep,
) -> StreamingResponse:
    logger.info("Chat stream started user=%s", user.user_id)

    prefix, token_iter = start_token_stream(
        service.stream(payload.message),
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
            logger.exception("Chat stream failed user=%s", user.user_id)
            raise map_google_exception(exc) from exc

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
