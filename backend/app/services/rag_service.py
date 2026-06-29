"""RAG orchestration: retrieve -> build prompt -> generate -> cite.

Coordinates retrieval, the LLM, and citation building. Exposes a non-streaming
``answer`` and a streaming ``answer_stream``.
"""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.logger import get_logger
from app.models.responses import QueryResponse
from app.services.citation_service import CitationService
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService, RetrievedChunk

logger = get_logger(__name__)

_SYSTEM_PROMPT = (
    "You are a helpful assistant for the SA AI Web Kit. Answer the user's "
    "question using ONLY the provided context. If the answer is not contained "
    "in the context, say you don't have enough information. Be concise and cite "
    "the source documents you used."
)


class RAGService:
    def __init__(
        self,
        retrieval_service: RetrievalService,
        llm_service: LLMService,
        citation_service: CitationService,
    ) -> None:
        self._retrieval = retrieval_service
        self._llm = llm_service
        self._citations = citation_service

    def _build_context(self, chunks: list[RetrievedChunk]) -> str:
        blocks: list[str] = []
        for i, chunk in enumerate(chunks, start=1):
            meta = chunk.document.metadata
            source = meta.get("filename", "unknown")
            page = meta.get("page_number")
            location = f"{source}" + (f", page {page}" if page else "")
            blocks.append(f"[{i}] ({location})\n{chunk.document.page_content}")
        return "\n\n".join(blocks)

    def _build_messages(self, question: str, context: str) -> list:
        user_content = (
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Answer using only the context above."
        )
        return [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=user_content),
        ]

    def answer(self, question: str, top_k: int | None = None) -> QueryResponse:
        chunks = self._retrieval.retrieve(question, k=top_k)
        if not chunks:
            return QueryResponse(
                answer="I don't have any documents to answer that yet.",
                citations=[],
            )
        messages = self._build_messages(question, self._build_context(chunks))
        answer = self._llm.chat(messages)
        citations = self._citations.build(chunks)
        return QueryResponse(answer=answer, citations=citations)

    def answer_stream(self, question: str, top_k: int | None = None) -> Iterator[str]:
        """Yield plain-text answer tokens progressively."""
        chunks = self._retrieval.retrieve(question, k=top_k)
        if not chunks:
            yield "I don't have any documents to answer that yet."
            return
        messages = self._build_messages(question, self._build_context(chunks))
        yield from self._llm.stream(messages)
