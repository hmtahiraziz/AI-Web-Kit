"""List and delete ingested documents (registry + vectors + uploaded file)."""

from __future__ import annotations

from app.core.config import Settings
from app.core.exceptions import NotFoundError
from app.core.logger import get_logger
from app.models.document import DocumentRecord
from app.utils.file_utils import delete_file, stored_filename
from app.vectorstore.faiss_store import FAISSStore

logger = get_logger(__name__)


class DocumentsService:
    def __init__(self, settings: Settings, store: FAISSStore) -> None:
        self._settings = settings
        self._store = store

    def list_documents(self) -> list[DocumentRecord]:
        return self._store.list_documents()

    def delete_document(self, document_id: str) -> None:
        record = self._store.get_document(document_id)
        if record is None:
            raise NotFoundError(f"Document '{document_id}' not found")

        removed = self._store.delete_document(document_id)
        self._store.unregister_document(document_id)

        disk_name = stored_filename(document_id, record.filename)
        delete_file(self._settings.upload_path / disk_name)

        logger.info(
            "Deleted document=%s vectors_removed=%d", document_id, removed
        )
