import { apiClient } from "@/services/api/client";
import { API_URL } from "@/lib/env";
import { getAuthToken } from "@/services/auth/token";
import type {
  DeleteDocumentResponse,
  HealthResponse,
  QueryRequest,
  QueryResponse,
} from "@/types/api";
import type {
  UploadDocumentResponse,
  UploadedDocument,
} from "@/types/document";

/**
 * RAG backend client. Maps to the FastAPI + FAISS endpoints:
 *   GET    /health
 *   POST   /ingest
 *   GET    /documents
 *   DELETE /documents/{id}
 *   POST   /query            (non-streaming)
 *   POST   /query/stream     (plain text stream)
 *
 * Base URL should include the /api prefix (e.g. http://localhost:8000/api).
 */

export async function healthCheck(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}

export async function uploadDocument(
  file: File,
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<UploadDocumentResponse>(
    "/ingest",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function listDocuments(): Promise<UploadedDocument[]> {
  const { data } = await apiClient.get<UploadedDocument[]>("/documents");
  return data;
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResponse> {
  const { data } = await apiClient.delete<DeleteDocumentResponse>(
    `/documents/${documentId}`,
  );
  return data;
}

export async function queryRag(payload: QueryRequest): Promise<QueryResponse> {
  const { data } = await apiClient.post<QueryResponse>("/query", payload);
  return data;
}

/**
 * Streaming query. Axios cannot stream response bodies in the browser, so we
 * use fetch + ReadableStream. Yields incremental plain-text token deltas.
 */
export async function* streamQuery(
  payload: QueryRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/query/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Streaming request failed with status ${response.status}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}
