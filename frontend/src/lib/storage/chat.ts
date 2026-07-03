import type { ChatMessage, ChatMode, Conversation } from "@/types/chat";

const CONVERSATIONS_KEY = "sa-ai-web-kit.chat.conversations";
const ACTIVE_KEY = "sa-ai-web-kit.chat.active";
const MODE_KEY = "sa-ai-web-kit.chat.mode";

const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 200;

export type PersistedChat = {
  conversations: Conversation[];
  activeId: string | null;
  mode?: ChatMode;
};

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text = firstUser?.content.trim();
  if (!text) return "New chat";
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

export function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadChat(): PersistedChat {
  if (typeof window === "undefined") {
    return { conversations: [], activeId: null, mode: "rag" };
  }
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    const modeRaw = localStorage.getItem(MODE_KEY);
    const mode: ChatMode = modeRaw === "direct" ? "direct" : "rag";
    if (!raw) return { conversations: [], activeId: null, mode };
    const conversations = JSON.parse(raw) as Conversation[];
    const activeId = localStorage.getItem(ACTIVE_KEY);
    return {
      conversations: Array.isArray(conversations) ? conversations : [],
      activeId,
      mode,
    };
  } catch {
    return { conversations: [], activeId: null, mode: "rag" };
  }
}

export function saveChat(chat: PersistedChat): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = chat.conversations
      .slice(-MAX_CONVERSATIONS)
      .map((c) => ({
        ...c,
        messages: c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
      }));
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmed));
    if (chat.activeId) {
      localStorage.setItem(ACTIVE_KEY, chat.activeId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
    if (chat.mode) {
      localStorage.setItem(MODE_KEY, chat.mode);
    }
  } catch {
    // best-effort
  }
}

export function loadChatMode(): ChatMode {
  if (typeof window === "undefined") return "rag";
  return localStorage.getItem(MODE_KEY) === "direct" ? "direct" : "rag";
}

export function saveChatMode(mode: ChatMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // best-effort
  }
}
