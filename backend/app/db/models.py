"""ORM models persisted in Neon Postgres."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class DocumentRow(Base):
    """Ingested document registry (vectors remain in FAISS). Web kit RAG only."""

    __tablename__ = "documents"

    document_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )


class ConversationRow(Base):
    """Chat conversation owned by a Clerk user (Ragmob / assistant)."""

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(256), default="New chat", nullable=False)
    mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        onupdate=_utcnow,
        nullable=False,
    )


class ChatMessageRow(Base):
    """Server-side chat transcript for Ragmob sync."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    conversation_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )
