"""Build citations from retrieved chunks, preserving metadata and order."""

from __future__ import annotations

from app.models.responses import Citation
from app.services.retrieval_service import RetrievedChunk


class CitationService:
    def build(self, chunks: list[RetrievedChunk]) -> list[Citation]:
        citations: list[Citation] = []
        seen: set[tuple[str, int | None, str | None]] = set()

        for chunk in chunks:
            meta = chunk.document.metadata
            source = meta.get("filename") or meta.get("source") or "unknown"
            page = meta.get("page_number")
            section = meta.get("section")

            key = (source, page, section)
            if key in seen:
                continue
            seen.add(key)

            citations.append(Citation(source=source, page=page, section=section))
        return citations
