"""Document registry CRUD against Neon."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import DocumentRow
from app.models.document import DocumentRecord


def _row_to_record(row: DocumentRow) -> DocumentRecord:
    created = row.created_at
    if isinstance(created, datetime):
        created_at = created.isoformat()
    else:
        created_at = str(created)
    return DocumentRecord(
        document_id=row.document_id,
        filename=row.filename,
        content_type=row.content_type,
        size=row.size,
        chunks=row.chunks,
        status=row.status,
        created_at=created_at,
    )


def upsert_document(session: Session, record: DocumentRecord) -> None:
    row = session.get(DocumentRow, record.document_id)
    if row is None:
        created: datetime | None = None
        try:
            created = datetime.fromisoformat(record.created_at.replace("Z", "+00:00"))
        except ValueError:
            created = None
        session.add(
            DocumentRow(
                document_id=record.document_id,
                filename=record.filename,
                content_type=record.content_type,
                size=record.size,
                chunks=record.chunks,
                status=record.status,
                **({"created_at": created} if created else {}),
            )
        )
    else:
        row.filename = record.filename
        row.content_type = record.content_type
        row.size = record.size
        row.chunks = record.chunks
        row.status = record.status
    session.commit()


def list_documents(session: Session) -> list[DocumentRecord]:
    rows = session.scalars(
        select(DocumentRow).order_by(DocumentRow.created_at.desc())
    ).all()
    return [_row_to_record(r) for r in rows]


def get_document(session: Session, document_id: str) -> DocumentRecord | None:
    row = session.get(DocumentRow, document_id)
    return _row_to_record(row) if row else None


def delete_document(session: Session, document_id: str) -> bool:
    row = session.get(DocumentRow, document_id)
    if row is None:
        return False
    session.delete(row)
    session.commit()
    return True


def sync_from_records(session: Session, records: list[DocumentRecord]) -> int:
    """Upsert FAISS/json registry rows into Neon. Returns count written."""
    for record in records:
        upsert_document(session, record)
    return len(records)
