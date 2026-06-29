import { create } from "zustand";
import type { ChatMessage, ChatStatus, Citation } from "@/types/chat";

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type ChatState = {
  messages: ChatMessage[];
  status: ChatStatus;
  draft: string;
  error: string | null;
  activeCitations: Citation[];

  setDraft: (draft: string) => void;
  setStatus: (status: ChatStatus) => void;
  setError: (error: string | null) => void;
  setActiveCitations: (citations: Citation[]) => void;

  addUserMessage: (content: string) => string;
  addAssistantMessage: () => string;
  appendToMessage: (id: string, delta: string) => void;
  setMessageCitations: (id: string, citations: Citation[]) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  status: "idle",
  draft: "",
  error: null,
  activeCitations: [],

  setDraft: (draft) => set({ draft }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setActiveCitations: (activeCitations) => set({ activeCitations }),

  addUserMessage: (content) => {
    const id = createId();
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role: "user", content, createdAt: Date.now() },
      ],
    }));
    return id;
  },

  addAssistantMessage: () => {
    const id = createId();
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role: "assistant", content: "", createdAt: Date.now() },
      ],
    }));
    return id;
  },

  appendToMessage: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id
          ? { ...message, content: message.content + delta }
          : message,
      ),
    })),

  setMessageCitations: (id, citations) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, citations } : message,
      ),
      activeCitations: citations,
    })),

  reset: () =>
    set({
      messages: [],
      status: "idle",
      draft: "",
      error: null,
      activeCitations: [],
    }),
}));
