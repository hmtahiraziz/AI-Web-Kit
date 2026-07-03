"""List and delete ingested documents."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DocumentsServiceDep
from app.models.responses import DeleteResponse, DocumentSummary

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    user: CurrentUser,
    service: DocumentsServiceDep,
) -> list[DocumentSummary]:
    records = service.list_documents()
    return [
        DocumentSummary(
            id=r.document_id,
            filename=r.filename,
            size=r.size,
            chunks=r.chunks,
            status=r.status,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.delete("/{document_id}", response_model=DeleteResponse)
def delete_document(
    document_id: str,
    user: CurrentUser,
    service: DocumentsServiceDep,
) -> DeleteResponse:
    service.delete_document(document_id)
    return DeleteResponse(document_id=document_id)
