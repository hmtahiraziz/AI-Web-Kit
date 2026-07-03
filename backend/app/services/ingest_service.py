"""Ingestion pipeline: save -> load -> chunk -> embed -> store -> register."""

from __future__ import annotations

import uuid
from pathlib import Path

from app.core.config import Settings
from app.core.logger import get_logger
from app.models.document import DocumentRecord
from app.services.chunk_service import ChunkService
from app.services.document_loader import DocumentLoaderService
from app.utils.file_utils import save_bytes, stored_filename, validate_extension
from app.vectorstore.faiss_store import FAISSStore

logger = get_logger(__name__)


class IngestService:
    def __init__(
        self,
        settings: Settings,
        loader: DocumentLoaderService,
        chunker: ChunkService,
        store: FAISSStore,
    ) -> None:
        self._settings = settings
        self._loader = loader
        self._chunker = chunker
        self._store = store

    def ingest(self, *, filename: str, content_type: str | None, data: bytes) -> DocumentRecord:
        validate_extension(filename)

        document_id = uuid.uuid4().hex
        disk_name = stored_filename(document_id, filename)
        path: Path = save_bytes(self._settings.upload_path, disk_name, data)

        documents = self._loader.load(path)
        chunks = self._chunker.split(
            documents, document_id=document_id, filename=filename
        )
        added = self._store.add_documents(chunks)

        record = DocumentRecord(
            document_id=document_id,
            filename=filename,
            content_type=content_type,
            size=len(data),
            chunks=added,
            status="ready",
        )
        self._store.register_document(record)
        logger.info(
            "Ingested document=%s filename=%s chunks=%d", document_id, filename, added
        )
        return record
