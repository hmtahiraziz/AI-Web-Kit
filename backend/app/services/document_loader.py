"""Load raw uploaded files into LangChain ``Document`` objects.

Routes by file extension to the appropriate LangChain loader. Page numbers are
preserved where the loader provides them (PDF).
"""

from __future__ import annotations

from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document

from app.core.exceptions import UnsupportedFileError
from app.core.logger import get_logger
from app.utils.file_utils import get_extension

logger = get_logger(__name__)


class DocumentLoaderService:
    """Loads PDF, TXT, and Markdown files into documents."""

    def load(self, path: Path) -> list[Document]:
        ext = get_extension(path.name)
        if ext == ".pdf":
            documents = self._load_pdf(path)
        elif ext in {".txt", ".md", ".markdown"}:
            documents = self._load_text(path)
        else:
            raise UnsupportedFileError(f"Cannot load file type '{ext}'")

        logger.info("Loaded %d page(s)/section(s) from %s", len(documents), path.name)
        return documents

    def _load_pdf(self, path: Path) -> list[Document]:
        # PyPDFLoader yields one Document per page with metadata["page"] (0-based).
        docs = PyPDFLoader(str(path)).load()
        for doc in docs:
            page = doc.metadata.get("page")
            if isinstance(page, int):
                doc.metadata["page_number"] = page + 1
        return docs

    def _load_text(self, path: Path) -> list[Document]:
        return TextLoader(str(path), encoding="utf-8", autodetect_encoding=True).load()
