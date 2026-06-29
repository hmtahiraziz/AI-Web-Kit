"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, MessageSquare, WifiOff } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useHealth } from "@/hooks/use-health";
import { useChatStore } from "@/lib/stores/chat-store";
import { Card, CardContent } from "@/components/ui/card";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { CitationCard } from "@/components/chat/CitationCard";
import { PromptChip } from "@/components/chat/PromptChip";
import { UploadDocumentButton } from "@/components/chat/UploadDocumentButton";

const EXAMPLE_PROMPTS = [
  "Summarize my latest uploaded document",
  "What are the key points in my knowledge base?",
  "Find information about policies or procedures",
];

function isBackendOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function ChatWindow() {
  const { messages, status, error, activeCitations, isLoading, send, stop } =
    useChat();
  const draft = useChatStore((state) => state.draft);
  const setDraft = useChatStore((state) => state.setDraft);
  const { data: health, isError: healthError, isLoading: healthLoading } =
    useHealth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const backendOffline =
    !healthLoading && (healthError || !isBackendOnline(health?.status));

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function handleSubmit() {
    const question = draft;
    setDraft("");
    void send(question);
  }

  function handlePromptSelect(text: string) {
    setDraft(text);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex h-[calc(100vh-9rem)] flex-col">
        <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          {backendOffline && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              <WifiOff className="h-4 w-4 shrink-0" />
              Backend is offline. Start the API server to chat with your
              documents.
            </div>
          )}

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto pr-1"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">Ask about your documents</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Responses stream in real time with citations from your
                    sources.
                  </p>
                </div>
                <div className="flex max-w-md flex-wrap justify-center gap-2">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <PromptChip
                      key={prompt}
                      text={prompt}
                      onSelect={handlePromptSelect}
                    />
                  ))}
                </div>
                <UploadDocumentButton />
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isLoading}
              />
            ))}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isLoading}
            disabled={backendOffline}
          />
        </CardContent>
      </Card>

      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Citations</h2>
          <UploadDocumentButton variant="ghost" label="Upload" />
        </div>
        {activeCitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sources for the latest answer will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {activeCitations.map((citation, index) => (
              <CitationCard
                key={`${citation.source}-${citation.page ?? index}`}
                citation={citation}
                index={index}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
