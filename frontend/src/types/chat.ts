export type ChatRole = "user" | "assistant";

export type Citation = {
  source: string;
  page?: number;
  section?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  citations?: Citation[];
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

/** RAG uses uploaded documents; direct is general LLM chat. */
export type ChatMode = "rag" | "direct";
