export type UploadedDocument = {
  id: string;
  filename: string;
  size: number;
  chunks: number;
  status: "processing" | "ready" | "failed";
  createdAt: string;
};

export type UploadDocumentResponse = {
  success: boolean;
  documentId: string;
  chunks: number;
};
