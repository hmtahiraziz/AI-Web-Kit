"""Retrieve the most relevant chunks for a query from the FAISS store."""

from __future__ import annotations

from dataclasses import dataclass

from langchain_core.documents import Document

from app.core.config import Settings
from app.vectorstore.faiss_store import FAISSStore


@dataclass(frozen=True)
class RetrievedChunk:
    document: Document
    score: float


class RetrievalService:
    def __init__(self, store: FAISSStore, settings: Settings) -> None:
        self._store = store
        self._settings = settings

    def retrieve(self, question: str, k: int | None = None) -> list[RetrievedChunk]:
        top_k = k or self._settings.top_k
        pairs = self._store.similarity_search(question, k=top_k)
        return [RetrievedChunk(document=doc, score=float(score)) for doc, score in pairs]
