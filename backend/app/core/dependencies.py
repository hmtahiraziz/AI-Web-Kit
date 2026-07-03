"""Dependency injection wiring.

Services are constructed once (cached) and provided to routers via FastAPI
``Depends``. Routers depend on these providers, never on concrete SDKs.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthError
from app.core.security import AuthenticatedUser, get_verifier
from app.services.chat_service import ChatService
from app.services.chunk_service import ChunkService
from app.services.citation_service import CitationService
from app.services.document_loader import DocumentLoaderService
from app.services.documents_service import DocumentsService
from app.services.embedding_service import EmbeddingService
from app.services.ingest_service import IngestService
from app.services.llm_service import LLMService
from app.services.rag_service import RAGService
from app.services.retrieval_service import RetrievalService
from app.vectorstore.faiss_store import FAISSStore


# --- singletons --------------------------------------------------------------


def clear_dependency_caches() -> None:
    """Drop cached settings and services (e.g. after ``.env`` changes)."""
    get_settings.cache_clear()
    get_llm_service.cache_clear()
    get_embedding_service.cache_clear()
    get_faiss_store.cache_clear()


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService(get_settings())


@lru_cache(maxsize=1)
def get_faiss_store() -> FAISSStore:
    settings = get_settings()
    store = FAISSStore(
        settings.faiss_index_path,
        get_embedding_service().embeddings,
        embedding_dim=settings.gemini_embedding_dimension,
    )
    store.load_index()
    return store


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService(get_settings())


# --- composed services -------------------------------------------------------


def get_ingest_service() -> IngestService:
    settings = get_settings()
    return IngestService(
        settings=settings,
        loader=DocumentLoaderService(),
        chunker=ChunkService(settings),
        store=get_faiss_store(),
    )


def get_documents_service() -> DocumentsService:
    return DocumentsService(get_settings(), get_faiss_store())


def get_rag_service() -> RAGService:
    settings = get_settings()
    retrieval = RetrievalService(get_faiss_store(), settings)
    return RAGService(
        retrieval_service=retrieval,
        llm_service=get_llm_service(),
        citation_service=CitationService(),
    )


def get_chat_service() -> ChatService:
    return ChatService(get_llm_service())


# --- auth --------------------------------------------------------------------


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    """Validate the ``Authorization: Bearer <jwt>`` header via Clerk."""
    if settings.auth_disabled:
        return AuthenticatedUser(user_id="dev-user", claims={})

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError("Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise AuthError("Empty bearer token")

    return get_verifier().verify(token)


# --- typed aliases -----------------------------------------------------------

CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
IngestServiceDep = Annotated[IngestService, Depends(get_ingest_service)]
DocumentsServiceDep = Annotated[DocumentsService, Depends(get_documents_service)]
RAGServiceDep = Annotated[RAGService, Depends(get_rag_service)]
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
