"""Split documents into embedded-ready chunks and stamp metadata.

Each output chunk carries the metadata required to build citations later:
``document_id``, ``filename``, ``page_number``, ``section``, ``chunk_id``,
``created_at``.
"""

from __future__ import annotations

from datetime import datetime, timezone

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import Settings
from app.utils.text_utils import detect_section, normalize_whitespace


class ChunkService:
    def __init__(self, settings: Settings) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            add_start_index=True,
        )

    def split(
        self, documents: list[Document], *, document_id: str, filename: str
    ) -> list[Document]:
        chunks = self._splitter.split_documents(documents)
        created_at = datetime.now(timezone.utc).isoformat()

        enriched: list[Document] = []
        for index, chunk in enumerate(chunks):
            chunk.page_content = normalize_whitespace(chunk.page_content)
            if not chunk.page_content:
                continue

            page_number = chunk.metadata.get("page_number")
            section = chunk.metadata.get("section") or detect_section(chunk.page_content)

            chunk.metadata = {
                "document_id": document_id,
                "filename": filename,
                "page_number": page_number,
                "section": section,
                "chunk_id": f"{document_id}:{index}",
                "created_at": created_at,
            }
            enriched.append(chunk)
        return enriched
