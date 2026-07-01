"""FAISS vector store wrapper.

Encapsulates all FAISS access behind a small, reusable API. A JSON sidecar
(``registry.json``) tracks ingested documents so listing/deletion does not
require scanning the index.

This is the ONLY module that touches FAISS directly.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.core.logger import get_logger
from app.models.document import DocumentRecord

logger = get_logger(__name__)

_INDEX_NAME = "index"
_REGISTRY_FILE = "registry.json"


class FAISSStore:
    """Reusable wrapper around a persisted FAISS index + document registry."""

    def __init__(
        self,
        index_dir: Path,
        embeddings: Embeddings,
        *,
        embedding_dim: int = 768,
    ) -> None:
        self._dir = index_dir
        self._embeddings = embeddings
        self._embedding_dim = embedding_dim
        self._store: FAISS | None = None
        self._lock = threading.RLock()
        self._dir.mkdir(parents=True, exist_ok=True)

    # --- index lifecycle ---------------------------------------------------

    @property
    def _faiss_file(self) -> Path:
        return self._dir / f"{_INDEX_NAME}.faiss"

    def create_index(self) -> FAISS:
        """Create an empty in-memory index without calling the embedding API."""
        index = faiss.IndexFlatL2(self._embedding_dim)
        self._store = FAISS(
            embedding_function=self._embeddings,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )
        return self._store

    def load_index(self) -> FAISS:
        """Load the index from disk, or create a fresh one if none exists."""
        with self._lock:
            if self._faiss_file.exists():
                self._store = FAISS.load_local(
                    folder_path=str(self._dir),
                    embeddings=self._embeddings,
                    index_name=_INDEX_NAME,
                    allow_dangerous_deserialization=True,
                )
                logger.info("Loaded FAISS index from %s", self._dir)
            else:
                self.create_index()
                logger.info("Created new FAISS index at %s", self._dir)
            return self._store  # type: ignore[return-value]

    def _ensure_store(self) -> FAISS:
        if self._store is None:
            self.load_index()
        return self._store  # type: ignore[return-value]

    def save_index(self) -> None:
        with self._lock:
            if self._store is not None:
                self._store.save_local(
                    folder_path=str(self._dir), index_name=_INDEX_NAME
                )

    def persist(self) -> None:
        """Alias for ``save_index`` (public, intention-revealing name)."""
        self.save_index()

    # --- documents ---------------------------------------------------------

    def add_documents(self, documents: list[Document]) -> int:
        """Embed and add documents to the index. Returns the count added."""
        if not documents:
            return 0
        with self._lock:
            store = self._ensure_store()
            store.add_documents(documents)
            self.persist()
        return len(documents)

    def has_documents(self) -> bool:
        """True when the registry lists at least one ingested document."""
        return bool(self._read_registry())

    def similarity_search(
        self, query: str, k: int = 5
    ) -> list[tuple[Document, float]]:
        """Return up to ``k`` (document, score) pairs for ``query``."""
        if not self.has_documents():
            return []
        with self._lock:
            store = self._ensure_store()
            return store.similarity_search_with_score(query, k=k)

    def delete_document(self, document_id: str) -> int:
        """Delete every chunk whose metadata ``document_id`` matches.

        Returns the number of vectors removed.
        """
        with self._lock:
            store = self._ensure_store()
            ids_to_delete = [
                doc_id
                for doc_id, doc in store.docstore._dict.items()  # type: ignore[attr-defined]
                if doc.metadata.get("document_id") == document_id
            ]
            if ids_to_delete:
                store.delete(ids_to_delete)
                self.persist()
            return len(ids_to_delete)

    # --- registry sidecar --------------------------------------------------

    @property
    def _registry_path(self) -> Path:
        return self._dir / _REGISTRY_FILE

    def _read_registry(self) -> dict[str, dict]:
        if not self._registry_path.exists():
            return {}
        try:
            return json.loads(self._registry_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            logger.warning("Registry file unreadable; starting fresh")
            return {}

    def _write_registry(self, data: dict[str, dict]) -> None:
        self._registry_path.write_text(
            json.dumps(data, indent=2), encoding="utf-8"
        )

    def register_document(self, record: DocumentRecord) -> None:
        with self._lock:
            data = self._read_registry()
            data[record.document_id] = record.model_dump()
            self._write_registry(data)

    def list_documents(self) -> list[DocumentRecord]:
        data = self._read_registry()
        records = [DocumentRecord(**item) for item in data.values()]
        records.sort(key=lambda r: r.created_at, reverse=True)
        return records

    def get_document(self, document_id: str) -> DocumentRecord | None:
        data = self._read_registry()
        item = data.get(document_id)
        return DocumentRecord(**item) if item else None

    def unregister_document(self, document_id: str) -> bool:
        with self._lock:
            data = self._read_registry()
            if document_id in data:
                del data[document_id]
                self._write_registry(data)
                return True
            return False
