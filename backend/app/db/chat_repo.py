"""Chat conversation / message persistence for Ragmob (Neon)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import ChatMessageRow, ConversationRow


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _derive_title(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return "New chat"
    return cleaned[:40] + ("…" if len(cleaned) > 40 else "")


def ensure_conversation(
    session: Session,
    *,
    user_id: str,
    conversation_id: str,
    mode: str | None = None,
    title_from: str | None = None,
) -> ConversationRow:
    row = session.get(ConversationRow, conversation_id)
    if row is None:
        row = ConversationRow(
            id=conversation_id,
            user_id=user_id,
            title=_derive_title(title_from or ""),
            mode=mode,
            created_at=_utcnow(),
            updated_at=_utcnow(),
        )
        session.add(row)
    else:
        if row.user_id != user_id:
            raise PermissionError("Conversation belongs to another user")
        if mode:
            row.mode = mode
        if title_from and (row.title == "New chat" or not row.title):
            row.title = _derive_title(title_from)
        row.updated_at = _utcnow()
    return row


def upsert_message(
    session: Session,
    *,
    message_id: str | None,
    user_id: str,
    conversation_id: str,
    role: str,
    content: str,
    mode: str | None = None,
) -> ChatMessageRow:
    mid = message_id or uuid.uuid4().hex
    row = session.get(ChatMessageRow, mid)
    if row is None:
        row = ChatMessageRow(
            id=mid,
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            mode=mode,
            created_at=_utcnow(),
        )
        session.add(row)
    else:
        if row.user_id != user_id:
            raise PermissionError("Message belongs to another user")
        row.content = content
        row.mode = mode
    return row


def save_turn(
    session: Session,
    *,
    user_id: str,
    conversation_id: str,
    user_message: str,
    assistant_message: str,
    mode: str | None = None,
    user_message_id: str | None = None,
    assistant_message_id: str | None = None,
    has_image: bool = False,
) -> None:
    """Persist one user + assistant exchange after a successful stream.

    Image bytes are never written to Postgres. When ``has_image`` is true the
    stored user content is prefixed with a lightweight marker for history UIs.
    """
    stored_user = user_message
    if has_image and not stored_user.startswith("[Image]"):
        stored_user = f"[Image] {stored_user}".strip()

    ensure_conversation(
        session,
        user_id=user_id,
        conversation_id=conversation_id,
        mode=mode,
        title_from=stored_user,
    )
    upsert_message(
        session,
        message_id=user_message_id,
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=stored_user,
        mode=mode,
    )
    upsert_message(
        session,
        message_id=assistant_message_id,
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_message,
        mode=mode,
    )
    session.commit()


def list_messages_for_context(
    session: Session,
    user_id: str,
    conversation_id: str,
    *,
    limit: int = 20,
    exclude_ids: set[str] | None = None,
) -> list[tuple[str, str]]:
    """Return recent ``(role, content)`` pairs for LLM context (oldest first)."""
    if limit <= 0:
        return []
    exclude = exclude_ids or set()
    rows = session.scalars(
        select(ChatMessageRow)
        .where(
            ChatMessageRow.user_id == user_id,
            ChatMessageRow.conversation_id == conversation_id,
        )
        .order_by(ChatMessageRow.created_at.desc())
        .limit(max(limit * 2, limit))  # over-fetch to allow exclusions
    ).all()

    selected: list[tuple[str, str]] = []
    for row in rows:
        if row.id in exclude:
            continue
        selected.append((row.role, row.content))
        if len(selected) >= limit:
            break
    selected.reverse()
    return selected


def list_conversations(session: Session, user_id: str) -> list[dict]:
    rows = session.scalars(
        select(ConversationRow)
        .where(ConversationRow.user_id == user_id)
        .order_by(ConversationRow.updated_at.desc())
    ).all()

    result: list[dict] = []
    for row in rows:
        messages = session.scalars(
            select(ChatMessageRow)
            .where(
                ChatMessageRow.user_id == user_id,
                ChatMessageRow.conversation_id == row.id,
            )
            .order_by(ChatMessageRow.created_at.asc())
        ).all()
        if not messages:
            continue
        result.append(_conversation_dict(row, messages))
    return result


def get_conversation(session: Session, user_id: str, conversation_id: str) -> dict | None:
    row = session.get(ConversationRow, conversation_id)
    if row is None or row.user_id != user_id:
        return None
    messages = session.scalars(
        select(ChatMessageRow)
        .where(
            ChatMessageRow.user_id == user_id,
            ChatMessageRow.conversation_id == conversation_id,
        )
        .order_by(ChatMessageRow.created_at.asc())
    ).all()
    return _conversation_dict(row, messages)


def rename_conversation(
    session: Session, user_id: str, conversation_id: str, title: str
) -> dict | None:
    row = session.get(ConversationRow, conversation_id)
    if row is None or row.user_id != user_id:
        return None
    row.title = title.strip()[:256] or "New chat"
    row.updated_at = _utcnow()
    session.commit()
    return get_conversation(session, user_id, conversation_id)


def delete_conversation(session: Session, user_id: str, conversation_id: str) -> bool:
    row = session.get(ConversationRow, conversation_id)
    if row is None or row.user_id != user_id:
        return False
    session.execute(
        delete(ChatMessageRow).where(
            ChatMessageRow.user_id == user_id,
            ChatMessageRow.conversation_id == conversation_id,
        )
    )
    session.delete(row)
    session.commit()
    return True


def _conversation_dict(row: ConversationRow, messages: list[ChatMessageRow]) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "mode": row.mode or "general",
        "createdAt": int(row.created_at.timestamp() * 1000),
        "updatedAt": int(row.updated_at.timestamp() * 1000),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "createdAt": int(m.created_at.timestamp() * 1000),
            }
            for m in messages
        ],
    }
