import type { Citation } from "@/types/chat";

export type HealthResponse = {
  status: "healthy" | "ok" | "degraded" | "down";
  version?: string;
};

export type QueryRequest = {
  question: string;
  topK?: number;
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
};

export type CitationsResponse = {
  citations: Citation[];
};

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

export type DeleteDocumentResponse = {
  success: boolean;
  documentId: string;
};
