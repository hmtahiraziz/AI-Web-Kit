"use client";

import { useCallback, useRef } from "react";
import { streamQuery } from "@/services/api";
import { useChatStore } from "@/lib/stores/chat-store";
import { isApiError } from "@/services/api/client";

/**
 * Orchestrates a streaming RAG chat turn against the backend.
 * Server state (the stream) is transient and UI-bound, so it lives in the
 * Zustand chat-store rather than React Query.
 */
export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const {
    messages,
    status,
    error,
    activeCitations,
    addUserMessage,
    addAssistantMessage,
    appendToMessage,
    setStatus,
    setError,
    reset,
  } = useChatStore();

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      setError(null);
      addUserMessage(trimmed);
      const assistantId = addAssistantMessage();
      setStatus("submitted");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let started = false;
        for await (const delta of streamQuery(
          { question: trimmed },
          controller.signal,
        )) {
          if (!started) {
            started = true;
            setStatus("streaming");
          }
          appendToMessage(assistantId, delta);
        }
        setStatus("idle");
      } catch (err) {
        if (controller.signal.aborted) {
          setStatus("idle");
          return;
        }
        const message = isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to get a response";
        setError(message);
        setStatus("error");
      } finally {
        abortRef.current = null;
      }
    },
    [addUserMessage, addAssistantMessage, appendToMessage, setStatus, setError],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    status,
    error,
    activeCitations,
    isLoading: status === "submitted" || status === "streaming",
    send,
    stop,
    reset,
  };
}
