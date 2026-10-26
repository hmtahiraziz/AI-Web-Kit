"""Direct LLM chat endpoint — plain-text streaming, no RAG.

Persists completed turns to Neon when ``conversationId`` is provided (Ragmob).

## Contract (agreed)

1. **Text-only** — ``POST /api/chat/stream`` JSON (unchanged / backward compatible).
2. **Vision (Ragmob)** — **separate upload** ``POST /api/chat/images``, then
   ``POST /api/chat/stream`` JSON with ``imageId`` (+ ``conversationId``).
3. Legacy: inline ``imageBase64`` or multipart on ``/stream`` still accepted.

See ``docs/ragmob-chat-image-contract.md``.
"""

from __future__ import annotations

import base64
import binascii
import uuid
from dataclasses import dataclass

from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import StreamingResponse

from app.core.config import Settings
from app.core.dependencies import ChatServiceDep, CurrentUser, SettingsDep
from app.core.exceptions import AppError, NotFoundError, UnsupportedFileError
from app.core.logger import get_logger
from app.db import chat_repo, feedback_repo, get_session_factory
from app.models.requests import (
    ChatImageUploadRequest,
    ChatRequest,
    FeedbackRequest,
    RenameConversationRequest,
    ReportRequest,
)
from app.models.responses import (
    ChatImageUploadResponse,
    DeleteConversationResponse,
    FeedbackResponse,
    ReportResponse,
)
from app.services.image_context_cache import get_image_context_cache
from app.utils.google_errors import map_google_exception
from app.utils.image_utils import ValidatedImage, validate_chat_image
from app.utils.streaming import continue_token_stream, start_token_stream

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@dataclass(slots=True)
class _StreamTurn:
    message: str
    mode: str | None
    system_prompt: str | None
    conversation_id: str | None
    user_message_id: str | None
    assistant_message_id: str | None
    image: ValidatedImage | None
    has_new_image: bool
    image_reuse: bool = False
    image_id: str | None = None


def _persist_turn(
    *,
    user_id: str,
    turn: _StreamTurn,
    assistant_text: str,
) -> None:
    if not turn.conversation_id or not assistant_text.strip():
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
            conversation_id=turn.conversation_id,
            user_message=turn.message,
            assistant_message=assistant_text,
            mode=turn.mode,
            user_message_id=turn.user_message_id,
            assistant_message_id=turn.assistant_message_id,
            has_image=turn.has_new_image,
        )
        logger.info(
            "Persisted chat turn user=%s conversation=%s has_image=%s",
            user_id,
            turn.conversation_id,
            turn.has_new_image,
        )
    except Exception:
        logger.exception("Failed to persist chat turn")
        session.rollback()
    finally:
        session.close()


def _load_history(
    *,
    user_id: str,
    conversation_id: str | None,
    settings: Settings,
    exclude_ids: set[str],
) -> list[tuple[str, str]]:
    if not conversation_id:
        return []
    factory = get_session_factory()
    if factory is None:
        return []
    session = factory()
    try:
        return chat_repo.list_messages_for_context(
            session,
            user_id,
            conversation_id,
            limit=settings.chat_history_limit,
            exclude_ids=exclude_ids,
        )
    except Exception:
        logger.exception("Failed to load chat history for context")
        return []
    finally:
        session.close()


def _cached_to_validated(cached) -> ValidatedImage:
    return ValidatedImage(
        data=cached.data,
        mime_type=cached.mime_type,
        width=cached.width,
        height=cached.height,
        byte_length=len(cached.data),
    )


def _resolve_image_for_turn(
    *,
    user_id: str,
    conversation_id: str | None,
    uploaded: ValidatedImage | None,
    image_id: str | None,
    settings: Settings,
    image_reuse: bool = False,
) -> tuple[ValidatedImage | None, bool]:
    """Return (image_to_send, is_newly_uploaded).

    Order:
    1. Inline upload (legacy base64 / multipart) → bind to conversation.
    2. ``imageId`` from ``POST /chat/images`` → load pending, bind to conversation.
    3. Else conversation cache (text follow-up).
    """
    cache = get_image_context_cache(settings.chat_image_context_ttl_seconds)

    if uploaded is not None:
        if not conversation_id:
            logger.warning(
                "Vision turn without conversationId — follow-ups cannot reuse this image"
            )
        else:
            cache.put(
                user_id,
                conversation_id,
                data=uploaded.data,
                mime_type=uploaded.mime_type,
                width=uploaded.width,
                height=uploaded.height,
            )
        return uploaded, not image_reuse

    if image_id:
        pending = cache.get_pending(user_id, image_id)
        if pending is None:
            raise UnsupportedFileError(
                "Unknown or expired imageId. Upload again via POST /chat/images."
            )
        if conversation_id:
            cache.bind_pending_to_conversation(user_id, image_id, conversation_id)
        else:
            logger.warning(
                "imageId used without conversationId — follow-ups cannot reuse this image"
            )
        return _cached_to_validated(pending), not image_reuse

    if not conversation_id:
        return None, False
    cached = cache.get(user_id, conversation_id)
    if cached is None:
        logger.info(
            "Image context miss user=%s conversation=%s",
            user_id,
            conversation_id,
        )
        return None, False
    logger.info(
        "Image context hit user=%s conversation=%s bytes=%d",
        user_id,
        conversation_id,
        len(cached.data),
    )
    return _cached_to_validated(cached), False


def _build_streaming_response(
    *,
    user_id: str,
    turn: _StreamTurn,
    service: ChatServiceDep,
    settings: Settings,
) -> StreamingResponse:
    exclude: set[str] = set()
    if turn.user_message_id:
        exclude.add(turn.user_message_id)
    if turn.assistant_message_id:
        exclude.add(turn.assistant_message_id)

    history = _load_history(
        user_id=user_id,
        conversation_id=turn.conversation_id,
        settings=settings,
        exclude_ids=exclude,
    )

    image, has_new = _resolve_image_for_turn(
        user_id=user_id,
        conversation_id=turn.conversation_id,
        uploaded=turn.image,
        image_id=turn.image_id,
        settings=settings,
        image_reuse=turn.image_reuse,
    )
    turn.image = image
    turn.has_new_image = has_new

    logger.info(
        "Chat stream started user=%s conversation=%s has_image=%s new_image=%s history=%d",
        user_id,
        turn.conversation_id,
        image is not None,
        has_new,
        len(history),
    )

    prefix, token_iter = start_token_stream(
        service.stream(
            turn.message,
            mode=turn.mode,
            system_prompt=turn.system_prompt,
            history=history,
            image_bytes=image.data if image else None,
            image_mime=image.mime_type if image else None,
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
                user_id=user_id,
                turn=turn,
                assistant_text="".join(chunks),
            )
        except AppError:
            raise
        except Exception as exc:
            logger.exception("Chat stream failed user=%s", user_id)
            raise map_google_exception(exc) from exc

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _read_validated_image(
    upload: UploadFile | None,
    settings: Settings,
) -> ValidatedImage | None:
    if upload is None:
        return None
    # Empty filename / no content → treat as omitted
    filename = (upload.filename or "").strip()
    data = await upload.read()
    if not data and not filename:
        return None
    max_bytes = int(settings.chat_image_max_mb * 1024 * 1024)
    return validate_chat_image(
        data,
        declared_mime=upload.content_type,
        max_bytes=max_bytes,
        max_dimension=settings.chat_image_max_dimension,
    )


def _validated_image_from_base64(
    image_base64: str | None,
    image_mime: str | None,
    settings: Settings,
) -> ValidatedImage | None:
    if not image_base64 or not image_base64.strip():
        return None
    raw = image_base64.strip()
    # Allow accidental data-URL prefixes from clients.
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        data = base64.b64decode(raw, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise UnsupportedFileError(
            "Could not decode imageBase64. Send standard base64 image bytes."
        ) from exc
    max_bytes = int(settings.chat_image_max_mb * 1024 * 1024)
    return validate_chat_image(
        data,
        declared_mime=image_mime,
        max_bytes=max_bytes,
        max_dimension=settings.chat_image_max_dimension,
    )


def _form_turn(
    *,
    message: str | None,
    mode: str | None,
    system_prompt: str | None,
    conversation_id: str | None,
    user_message_id: str | None,
    assistant_message_id: str | None,
    image: ValidatedImage | None,
    image_reuse: bool = False,
    image_id: str | None = None,
) -> _StreamTurn:
    text = (message or "").strip()
    has_vision_ref = image is not None or bool(image_id)
    if not text:
        raise UnsupportedFileError(
            "A question is required. Type what you want to ask about the image."
            if has_vision_ref
            else "Message text is required."
        )
    if len(text) > 4000:
        raise UnsupportedFileError("Message must be at most 4000 characters.")
    return _StreamTurn(
        message=text,
        mode=(mode or None),
        system_prompt=(system_prompt or None),
        conversation_id=(conversation_id or None),
        user_message_id=(user_message_id or None),
        assistant_message_id=(assistant_message_id or None),
        image=image,
        # Final has_new_image is decided in _resolve_image_for_turn (reuse-aware).
        has_new_image=has_vision_ref and not image_reuse,
        image_reuse=image_reuse,
        image_id=(image_id or None),
    )


@router.post(
    "/stream",
    summary="Stream a chat reply (JSON text, imageId, or legacy image body)",
    response_class=StreamingResponse,
    responses={
        200: {
            "description": "Plain-text token stream",
            "content": {"text/plain": {"schema": {"type": "string"}}},
        },
        401: {"description": "Missing or invalid Clerk JWT"},
        413: {"description": "Image too large"},
        422: {"description": "Invalid image or payload"},
        429: {"description": "Rate limited"},
        502: {"description": "Upstream Gemini error"},
    },
)
async def chat_stream(
    request: Request,
    user: CurrentUser,
    service: ChatServiceDep,
    settings: SettingsDep,
) -> StreamingResponse:
    content_type = (request.headers.get("content-type") or "").lower()

    if "multipart/form-data" in content_type:
        # Large vision uploads — raise part limit so image bytes aren't truncated
        # into a text field when filename= is present but body is big.
        form = await request.form(max_part_size=12 * 1024 * 1024)
        image_file: UploadFile | None = None
        for key, value in form.multi_items():
            if key == "image" and isinstance(value, UploadFile):
                image_file = value
                break
        if image_file is None:
            raw = form.get("image")
            if raw not in (None, ""):
                raise UnsupportedFileError(
                    "Field 'image' must be a file upload "
                    "(multipart part needs Content-Disposition filename)."
                )

        image = await _read_validated_image(image_file, settings)

        def _form_str(name: str) -> str | None:
            value = form.get(name)
            if value is None or isinstance(value, UploadFile):
                return None
            text = str(value).strip()
            return text or None

        reuse_raw = (_form_str("imageReuse") or _form_str("image_reuse") or "").lower()
        turn = _form_turn(
            message=_form_str("message"),
            mode=_form_str("mode"),
            system_prompt=_form_str("systemPrompt") or _form_str("system_prompt"),
            conversation_id=_form_str("conversationId")
            or _form_str("conversation_id"),
            user_message_id=_form_str("userMessageId") or _form_str("user_message_id"),
            assistant_message_id=_form_str("assistantMessageId")
            or _form_str("assistant_message_id"),
            image=image,
            image_reuse=reuse_raw in {"1", "true", "yes"},
        )
        return _build_streaming_response(
            user_id=user.user_id,
            turn=turn,
            service=service,
            settings=settings,
        )

    # Default: JSON body (text-only, imageId, or legacy imageBase64)
    try:
        body = await request.json()
    except Exception as exc:
        raise UnsupportedFileError(
            "Expected application/json or multipart/form-data body."
        ) from exc

    payload = ChatRequest.model_validate(body)
    # Prefer imageId (separate upload). Inline base64 remains for legacy clients.
    image = None
    if not payload.image_id:
        image = _validated_image_from_base64(
            payload.image_base64,
            payload.image_mime,
            settings,
        )
    turn = _form_turn(
        message=payload.message,
        mode=payload.mode,
        system_prompt=payload.system_prompt,
        conversation_id=payload.conversation_id,
        user_message_id=payload.user_message_id,
        assistant_message_id=payload.assistant_message_id,
        image=image,
        image_reuse=bool(payload.image_reuse),
        image_id=payload.image_id,
    )
    return _build_streaming_response(
        user_id=user.user_id,
        turn=turn,
        service=service,
        settings=settings,
    )


def _store_uploaded_image(
    *,
    user_id: str,
    validated: ValidatedImage,
    conversation_id: str | None,
    settings: Settings,
) -> dict:
    image_id = uuid.uuid4().hex
    cache = get_image_context_cache(settings.chat_image_context_ttl_seconds)
    cache.put_pending(
        user_id,
        image_id,
        data=validated.data,
        mime_type=validated.mime_type,
        width=validated.width,
        height=validated.height,
    )
    if conversation_id:
        cache.put(
            user_id,
            conversation_id,
            data=validated.data,
            mime_type=validated.mime_type,
            width=validated.width,
            height=validated.height,
        )
    return {
        "imageId": image_id,
        "mimeType": validated.mime_type,
        "width": validated.width,
        "height": validated.height,
        "expiresInSeconds": settings.chat_image_context_ttl_seconds,
    }


@router.post(
    "/images",
    summary="Upload a chat image (returns imageId for /chat/stream)",
    status_code=201,
    response_model=ChatImageUploadResponse,
    responses={
        201: {"description": "Image accepted; use imageId on /chat/stream"},
        401: {"description": "Missing or invalid Clerk JWT"},
        413: {"description": "Image too large"},
        422: {"description": "Invalid or unsupported image"},
    },
)
async def upload_chat_image(
    request: Request,
    user: CurrentUser,
    settings: SettingsDep,
) -> dict:
    """Separate vision upload for Ragmob.

    Preferred body: JSON ``{ imageBase64, imageMime?, conversationId? }``.
    Also accepts multipart ``image`` file (+ optional ``conversationId``).
    """
    content_type = (request.headers.get("content-type") or "").lower()

    if "multipart/form-data" in content_type:
        form = await request.form(max_part_size=12 * 1024 * 1024)
        upload: UploadFile | None = None
        for key, value in form.multi_items():
            if key == "image" and isinstance(value, UploadFile):
                upload = value
                break
        if upload is None:
            raise UnsupportedFileError("Field 'image' must be a file upload.")
        validated = await _read_validated_image(upload, settings)
        if validated is None:
            raise UnsupportedFileError("Image file is required.")
        conv = form.get("conversationId") or form.get("conversation_id")
        conversation_id = (
            str(conv).strip()
            if conv is not None and not isinstance(conv, UploadFile)
            else None
        ) or None
        return _store_uploaded_image(
            user_id=user.user_id,
            validated=validated,
            conversation_id=conversation_id,
            settings=settings,
        )

    try:
        body = await request.json()
    except Exception as exc:
        raise UnsupportedFileError(
            "Expected application/json ({ imageBase64 }) or multipart/form-data."
        ) from exc

    payload = ChatImageUploadRequest.model_validate(body)
    validated = _validated_image_from_base64(
        payload.image_base64,
        payload.image_mime,
        settings,
    )
    if validated is None:
        raise UnsupportedFileError("imageBase64 is required.")
    return _store_uploaded_image(
        user_id=user.user_id,
        validated=validated,
        conversation_id=payload.conversation_id,
        settings=settings,
    )


# Explicit multipart signature for OpenAPI /docs (legacy combined stream).
@router.post(
    "/stream/vision",
    summary="Stream a vision chat reply (multipart image + question)",
    response_class=StreamingResponse,
    include_in_schema=True,
)
async def chat_stream_vision(
    user: CurrentUser,
    service: ChatServiceDep,
    settings: SettingsDep,
    message: str | None = Form(default=None, max_length=4000),
    mode: str | None = Form(default=None, max_length=32),
    system_prompt: str | None = Form(default=None, alias="systemPrompt", max_length=4000),
    conversation_id: str | None = Form(default=None, alias="conversationId", max_length=64),
    user_message_id: str | None = Form(default=None, alias="userMessageId", max_length=64),
    assistant_message_id: str | None = Form(
        default=None, alias="assistantMessageId", max_length=64
    ),
    image: UploadFile = File(..., description="JPEG, PNG, or WebP image"),
) -> StreamingResponse:
    """Dedicated multipart vision endpoint (alias of multimodal ``/chat/stream``)."""
    validated = await _read_validated_image(image, settings)
    if validated is None:
        raise UnsupportedFileError("Image file is required.")
    turn = _form_turn(
        message=message,
        mode=mode,
        system_prompt=system_prompt,
        conversation_id=conversation_id,
        user_message_id=user_message_id,
        assistant_message_id=assistant_message_id,
        image=validated,
    )
    return _build_streaming_response(
        user_id=user.user_id,
        turn=turn,
        service=service,
        settings=settings,
    )


@router.get(
    "/conversations",
    summary="List the signed-in user's conversations",
    response_model=list[dict],
)
def list_conversations(user: CurrentUser) -> list[dict]:
    factory = get_session_factory()
    if factory is None:
        return []
    session = factory()
    try:
        return chat_repo.list_conversations(session, user.user_id)
    finally:
        session.close()


@router.get(
    "/conversations/{conversation_id}",
    summary="Get one conversation with messages",
    response_model=dict,
    responses={404: {"description": "Conversation not found"}},
)
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


@router.patch(
    "/conversations/{conversation_id}",
    summary="Rename a conversation",
    response_model=dict,
    responses={404: {"description": "Conversation not found"}},
)
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


@router.delete(
    "/conversations/{conversation_id}",
    summary="Delete a conversation",
    response_model=DeleteConversationResponse,
    responses={404: {"description": "Conversation not found"}},
)
def delete_conversation(conversation_id: str, user: CurrentUser) -> dict:
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        ok = chat_repo.delete_conversation(session, user.user_id, conversation_id)
        if not ok:
            raise NotFoundError(f"Conversation '{conversation_id}' not found")
        # Drop any ephemeral vision context for this conversation.
        get_image_context_cache().clear(user.user_id, conversation_id)
        return {"success": True, "conversationId": conversation_id}
    finally:
        session.close()


@router.post(
    "/feedback",
    summary="Thumbs up/down on an assistant message",
    response_model=FeedbackResponse,
)
def submit_feedback(payload: FeedbackRequest, user: CurrentUser) -> dict:
    """Store thumbs up/down for an assistant message."""
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        result = feedback_repo.upsert_feedback(
            session,
            user_id=user.user_id,
            conversation_id=payload.conversation_id,
            message_id=payload.message_id,
            rating=payload.rating,
        )
        logger.info(
            "Feedback saved user=%s message=%s rating=%s",
            user.user_id,
            payload.message_id,
            payload.rating,
        )
        return {"success": True, **result}
    finally:
        session.close()


@router.post(
    "/reports",
    summary="Report a harmful assistant message",
    response_model=ReportResponse,
)
def submit_report(payload: ReportRequest, user: CurrentUser) -> dict:
    """Store a user report of a harmful or inappropriate assistant response."""
    factory = get_session_factory()
    if factory is None:
        raise NotFoundError("Database not configured")
    session = factory()
    try:
        result = feedback_repo.create_report(
            session,
            user_id=user.user_id,
            conversation_id=payload.conversation_id,
            message_id=payload.message_id,
            reason=payload.reason,
            note=payload.note,
        )
        logger.info(
            "Report saved user=%s message=%s reason=%s",
            user.user_id,
            payload.message_id,
            payload.reason,
        )
        return {"success": True, **result}
    finally:
        session.close()
