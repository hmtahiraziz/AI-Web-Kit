"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { fetchCitations, streamChat, streamQuery } from "@/services/api";
import { isApiError } from "@/services/api/client";
import {
  deriveTitle,
  loadChat,
  newConversation,
  saveChat,
  saveChatMode,
} from "@/lib/storage/chat";
import type {
  ChatMessage,
  ChatMode,
  ChatStatus,
  Citation,
  Conversation,
} from "@/types/chat";

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type ChatState = {
  conversations: Conversation[];
  activeId: string | null;
  mode: ChatMode;
  status: ChatStatus;
  error: string | null;
  draft: string;
  activeCitations: Citation[];
  streamingMessageId: string | null;
  hydrated: boolean;
};

type ChatAction =
  | {
      type: "HYDRATE";
      conversations: Conversation[];
      activeId: string | null;
      mode: ChatMode;
    }
  | { type: "SET_MODE"; mode: ChatMode }
  | { type: "SET_DRAFT"; draft: string }
  | { type: "SET_STATUS"; status: ChatStatus }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_STREAMING"; id: string | null }
  | { type: "SET_CITATIONS"; messageId: string; citations: Citation[] }
  | { type: "CLEAR_CITATIONS" }
  | { type: "ADD_USER"; content: string; id: string }
  | { type: "ADD_ASSISTANT"; id: string }
  | { type: "REMOVE_ASSISTANT"; id: string }
  | { type: "APPEND"; id: string; delta: string }
  | { type: "NEW_CONVERSATION" }
  | { type: "SELECT"; id: string }
  | { type: "DELETE"; id: string };

const initialState: ChatState = {
  conversations: [],
  activeId: null,
  mode: "rag",
  status: "idle",
  error: null,
  draft: "",
  activeCitations: [],
  streamingMessageId: null,
  hydrated: false,
};

function updateActive(
  state: ChatState,
  updater: (messages: ChatMessage[]) => ChatMessage[],
): ChatState {
  return {
    ...state,
    conversations: state.conversations.map((c) => {
      if (c.id !== state.activeId) return c;
      const messages = updater(c.messages);
      return {
        ...c,
        messages,
        title: deriveTitle(messages),
        updatedAt: Date.now(),
      };
    }),
  };
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "HYDRATE": {
      if (action.conversations.length === 0) {
        const convo = newConversation();
        return {
          ...state,
          conversations: [convo],
          activeId: convo.id,
          mode: action.mode,
          hydrated: true,
        };
      }
      const activeId =
        action.activeId &&
        action.conversations.some((c) => c.id === action.activeId)
          ? action.activeId
          : action.conversations[action.conversations.length - 1].id;
      return {
        ...state,
        conversations: action.conversations,
        activeId,
        mode: action.mode,
        hydrated: true,
      };
    }
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        activeCitations: action.mode === "direct" ? [] : state.activeCitations,
      };
    case "SET_DRAFT":
      return { ...state, draft: action.draft };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_STREAMING":
      return { ...state, streamingMessageId: action.id };
    case "SET_CITATIONS":
      return {
        ...updateActive(state, (messages) =>
          messages.map((m) =>
            m.id === action.messageId
              ? { ...m, citations: action.citations }
              : m,
          ),
        ),
        activeCitations: action.citations,
      };
    case "CLEAR_CITATIONS":
      return { ...state, activeCitations: [] };
    case "ADD_USER":
      return updateActive(state, (messages) => [
        ...messages,
        {
          id: action.id,
          role: "user",
          content: action.content,
          createdAt: Date.now(),
        },
      ]);
    case "ADD_ASSISTANT":
      return updateActive(state, (messages) => [
        ...messages,
        {
          id: action.id,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);
    case "REMOVE_ASSISTANT":
      return updateActive(state, (messages) =>
        messages.filter((m) => m.id !== action.id),
      );
    case "APPEND":
      return updateActive(state, (messages) =>
        messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.delta } : m,
        ),
      );
    case "NEW_CONVERSATION": {
      const active = state.conversations.find((c) => c.id === state.activeId);
      if (active && active.messages.length === 0) {
        return {
          ...state,
          status: "idle",
          error: null,
          draft: "",
          activeCitations: [],
          streamingMessageId: null,
        };
      }
      const convo = newConversation();
      return {
        ...state,
        conversations: [...state.conversations, convo],
        activeId: convo.id,
        status: "idle",
        error: null,
        draft: "",
        activeCitations: [],
        streamingMessageId: null,
      };
    }
    case "SELECT": {
      const convo = state.conversations.find((c) => c.id === action.id);
      const lastAssistant = [...(convo?.messages ?? [])]
        .reverse()
        .find((m) => m.role === "assistant" && m.citations?.length);
      return {
        ...state,
        activeId: action.id,
        status: "idle",
        error: null,
        draft: "",
        activeCitations:
          state.mode === "rag" ? (lastAssistant?.citations ?? []) : [],
        streamingMessageId: null,
      };
    }
    case "DELETE": {
      const remaining = state.conversations.filter((c) => c.id !== action.id);
      if (remaining.length === 0) {
        const convo = newConversation();
        return {
          ...state,
          conversations: [convo],
          activeId: convo.id,
          status: "idle",
          error: null,
          activeCitations: [],
          streamingMessageId: null,
        };
      }
      const activeId =
        state.activeId === action.id
          ? remaining[remaining.length - 1].id
          : state.activeId;
      return {
        ...state,
        conversations: remaining,
        activeId,
        status: "idle",
        error: null,
        activeCitations: [],
        streamingMessageId: null,
      };
    }
    default:
      return state;
  }
}

/**
 * Multi-conversation chat with RAG (documents) or direct LLM modes.
 */
export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const modeRef = useRef<ChatMode>("rag");
  modeRef.current = state.mode;

  useEffect(() => {
    const { conversations, activeId, mode } = loadChat();
    dispatch({
      type: "HYDRATE",
      conversations,
      activeId,
      mode: mode ?? "rag",
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (state.status === "submitted" || state.status === "streaming") return;
    const id = window.setTimeout(() => {
      saveChat({
        conversations: state.conversations,
        activeId: state.activeId,
        mode: state.mode,
      });
    }, 500);
    return () => window.clearTimeout(id);
  }, [
    state.conversations,
    state.activeId,
    state.mode,
    state.hydrated,
    state.status,
  ]);

  const messages = useMemo(
    () =>
      state.conversations.find((c) => c.id === state.activeId)?.messages ?? [],
    [state.conversations, state.activeId],
  );

  const runStream = useCallback(async (question: string) => {
    const mode = modeRef.current;
    const assistantId = createId();
    dispatch({ type: "ADD_ASSISTANT", id: assistantId });
    dispatch({ type: "SET_STREAMING", id: assistantId });
    dispatch({ type: "SET_STATUS", status: "submitted" });

    if (mode === "direct") {
      dispatch({ type: "CLEAR_CITATIONS" });
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const citationsPromise =
      mode === "rag"
        ? fetchCitations({ question }).catch(() => [])
        : Promise.resolve([] as Citation[]);

    try {
      let started = false;
      let receivedContent = false;
      const stream =
        mode === "rag"
          ? streamQuery({ question }, controller.signal)
          : streamChat({ message: question }, controller.signal);

      for await (const delta of stream) {
        if (!delta) continue;
        receivedContent = true;
        if (!started) {
          started = true;
          dispatch({ type: "SET_STATUS", status: "streaming" });
        }
        dispatch({ type: "APPEND", id: assistantId, delta });
      }

      if (!receivedContent && !controller.signal.aborted) {
        throw new Error(
          "The server returned an empty response. Check GOOGLE_API_KEY in backend/.env.",
        );
      }

      if (mode === "rag") {
        const citations = await citationsPromise;
        dispatch({
          type: "SET_CITATIONS",
          messageId: assistantId,
          citations,
        });
      }

      dispatch({ type: "SET_STATUS", status: "idle" });
    } catch (err) {
      if (controller.signal.aborted) {
        dispatch({ type: "SET_STATUS", status: "idle" });
        return;
      }
      const message = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to get a response";
      dispatch({ type: "REMOVE_ASSISTANT", id: assistantId });
      dispatch({ type: "SET_ERROR", error: message });
      dispatch({ type: "SET_STATUS", status: "error" });
    } finally {
      dispatch({ type: "SET_STREAMING", id: null });
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      dispatch({ type: "SET_ERROR", error: null });
      dispatch({ type: "ADD_USER", content: trimmed, id: createId() });
      await runStream(trimmed);
    },
    [runStream],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "SET_STREAMING", id: null });
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "NEW_CONVERSATION" });
  }, []);

  const selectConversation = useCallback((id: string) => {
    abortRef.current?.abort();
    dispatch({ type: "SELECT", id });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    abortRef.current?.abort();
    dispatch({ type: "DELETE", id });
  }, []);

  const setDraft = useCallback((draft: string) => {
    dispatch({ type: "SET_DRAFT", draft });
  }, []);

  const setMode = useCallback((mode: ChatMode) => {
    abortRef.current?.abort();
    dispatch({ type: "SET_MODE", mode });
    saveChatMode(mode);
  }, []);

  return {
    conversations: state.conversations,
    activeId: state.activeId,
    mode: state.mode,
    messages,
    status: state.status,
    error: state.error,
    draft: state.draft,
    activeCitations: state.activeCitations,
    streamingMessageId: state.streamingMessageId,
    hydrated: state.hydrated,
    isLoading: state.status === "submitted" || state.status === "streaming",
    setDraft,
    setMode,
    send,
    stop,
    newChat,
    selectConversation,
    deleteConversation,
  };
}
