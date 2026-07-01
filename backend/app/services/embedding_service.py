"""Embedding provider wrapper.

The only place ``GoogleGenerativeAIEmbeddings`` is constructed. Returned as a
LangChain ``Embeddings`` instance so the FAISS store stays provider-agnostic.
"""

from __future__ import annotations

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import Settings


class EmbeddingService:
    def __init__(self, settings: Settings) -> None:
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.google_api_key,
            output_dimensionality=settings.gemini_embedding_dimension,
        )

    @property
    def embeddings(self) -> Embeddings:
        return self._embeddings
