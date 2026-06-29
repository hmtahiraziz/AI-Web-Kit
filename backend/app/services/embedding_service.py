"""Embedding provider wrapper.

The only place ``OpenAIEmbeddings`` is constructed. Returned as a LangChain
``Embeddings`` instance so the FAISS store stays provider-agnostic.
"""

from __future__ import annotations

from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

from app.core.config import Settings


class EmbeddingService:
    def __init__(self, settings: Settings) -> None:
        self._embeddings = OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )

    @property
    def embeddings(self) -> Embeddings:
        return self._embeddings
