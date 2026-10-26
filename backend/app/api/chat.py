"""Direct LLM chat endpoint — plain-text streaming, no RAG.

Persists completed turns to Neon when ``conversationId`` is provided (Ragmob).
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.dependencies import ChatServiceDep, CurrentUser
from app.core.exceptions import AppError, NotFoundError
from app.core.logger import get_logger
from app.db import chat_repo, get_session_factory
from app.models.requests import ChatRequest, RenameConversationRequest
from app.utils.google_errors import map_google_exception
from app.utils.streaming import continue_token_stream, start_token_stream

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def _persist_turn(
    *,
    user_id: str,
    payload: ChatRequest,
    assistant_text: str,
) -> None:
    if not payload.conversation_id or not assistant_text.strip():
        return
    factory = get_session_factory()
    if factory is None:
        logger.warning("Skip chat persist — DATABASE_URL not configured")
        return
    session = factory()
    try:
        chat_repo.save_turn(
            session,
            user_id=user_id,
            conversation_id=payload.conversation_id,
            user_message=payload.message,
            assistant_message=assistant_text,
            mode=payload.mode,
            user_message_id=payload.user_message_id,
            assistant_message_id=payload.assistant_message_id,
        )
        logger.info(
            "Persisted chat turn user=%s conversation=%s",
            user_id,
            payload.conversation_id,
        )
    except Exception:
        logger.exception("Failed to persist chat turn")
        session.rollback()
    finally:
        session.close()


@router.post("/stream")
def chat_stream(
    payload: ChatRequest,
    user: CurrentUser,
    service: ChatServiceDep,
) -> StreamingResponse:
    logger.info("Chat stream started user=%s", user.user_id)

    prefix, token_iter = start_token_stream(
        service.stream(
            payload.message,
            mode=payload.mode,
            system_prompt=payload.system_prompt,
        ),
        on_error=map_google_exception,
    )

    def token_generator():
        chunks: list[str] = []
        try:
            for piece in continue_token_stream(
                prefix, token_iter, on_error=map_google_exception
            ):
                chunks.append(piece)
                yield piece
            _persist_turn(
                user_id=user.user_id,
                payload=payload,
                assistant_text="".join(chunks),
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


@router.get("/conversations")
def list_conversations(user: CurrentUser) -> list[dict]:
    factory = get_session_factory()
    if factory is None:
        return []
    session = factory()
    try:
        return chat_repo.list_conversations(session, user.user_id)
    finally:
        session.close()


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, user: CurrentUser) -> dict:
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        data = chat_repo.get_conversation(session, user.user_id, conversation_id)
        if data is None:
            raise NotFoundError(f"Conversation '{conversation_id}' not found")
        return data
    finally:
        session.close()


@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    payload: RenameConversationRequest,
    user: CurrentUser,
) -> dict:
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        data = chat_repo.rename_conversation(
            session, user.user_id, conversation_id, payload.title
        )
        if data is None:
            raise NotFoundError(f"Conversation '{conversation_id}' not found")
        return data
    finally:
        session.close()


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, user: CurrentUser) -> dict:
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        ok = chat_repo.delete_conversation(session, user.user_id, conversation_id)
        if not ok:
            raise NotFoundError(f"Conversation '{conversation_id}' not found")
        return {"success": True, "conversationId": conversation_id}
    finally:
        session.close()
