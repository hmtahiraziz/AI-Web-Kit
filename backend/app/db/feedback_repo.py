"""Message feedback + abuse reports for Ragmob."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import (
    ChatMessageRow,
    ConversationRow,
    MessageFeedbackRow,
    MessageReportRow,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def upsert_feedback(
    session: Session,
    *,
    user_id: str,
    conversation_id: str,
    message_id: str,
    rating: str,
) -> dict:
    existing = session.scalars(
        select(MessageFeedbackRow).where(
            MessageFeedbackRow.user_id == user_id,
            MessageFeedbackRow.message_id == message_id,
        )
    ).first()
    if existing is None:
        row = MessageFeedbackRow(
            id=uuid.uuid4().hex,
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            rating=rating,
            created_at=_utcnow(),
        )
        session.add(row)
    else:
        existing.rating = rating
        existing.conversation_id = conversation_id
        row = existing
    session.commit()
    return {
        "id": row.id,
        "messageId": row.message_id,
        "conversationId": row.conversation_id,
        "rating": row.rating,
    }


def create_report(
    session: Session,
    *,
    user_id: str,
    conversation_id: str,
    message_id: str,
    reason: str,
    note: str | None,
) -> dict:
    row = MessageReportRow(
        id=uuid.uuid4().hex,
        user_id=user_id,
        conversation_id=conversation_id,
        message_id=message_id,
        reason=reason,
        note=(note or "").strip() or None,
        created_at=_utcnow(),
    )
    session.add(row)
    session.commit()
    return {
        "id": row.id,
        "messageId": row.message_id,
        "conversationId": row.conversation_id,
        "reason": row.reason,
    }


def delete_user_data(session: Session, user_id: str) -> dict[str, int]:
    """Wipe all server-side chat / feedback / report rows for an account."""
    reports = session.execute(
        delete(MessageReportRow).where(MessageReportRow.user_id == user_id)
    ).rowcount
    feedback = session.execute(
        delete(MessageFeedbackRow).where(MessageFeedbackRow.user_id == user_id)
    ).rowcount
    messages = session.execute(
        delete(ChatMessageRow).where(ChatMessageRow.user_id == user_id)
    ).rowcount
    conversations = session.execute(
        delete(ConversationRow).where(ConversationRow.user_id == user_id)
    ).rowcount
    session.commit()
    return {
        "conversations": conversations or 0,
        "messages": messages or 0,
        "feedback": feedback or 0,
        "reports": reports or 0,
    }
