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

export type ChatStatus = "idle" | "submitted" | "streaming" | "error";
