"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  History,
  Lightbulb,
  Plus,
  Shield,
  WifiOff,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useHealth } from "@/hooks/use-health";
import { useUploadDocument } from "@/hooks/use-documents";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatModeToggle } from "@/components/chat/ChatModeToggle";
import { CitationsPanel } from "@/components/chat/CitationsPanel";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { PromptSuggestion } from "@/components/chat/PromptSuggestion";
import { UploadDocumentButton } from "@/components/chat/UploadDocumentButton";
import { BlurOrb } from "@/components/ui/BlurOrb";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/ui/modal";

const RAG_PROMPTS = [
  {
    label: "Summarize my latest uploaded document",
    icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    label: "What are the key points in my knowledge base?",
    icon: <Lightbulb className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    label: "Find information about policies or procedures",
    icon: <Shield className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const DIRECT_PROMPTS = [
  {
    label: "Explain quantum computing in simple terms",
    icon: <Lightbulb className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    label: "Write a short poem about the ocean",
    icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    label: "What are three tips for learning a new language?",
    icon: <Shield className="h-4 w-4" strokeWidth={1.75} />,
  },
];

function isBackendOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function ChatWindow() {
  const {
    conversations,
    activeId,
    mode,
    messages,
    status,
    error,
    draft,
    activeCitations,
    streamingMessageId,
    hydrated,
    isLoading,
    setDraft,
    setMode,
    send,
    stop,
    newChat,
    selectConversation,
    deleteConversation,
  } = useChat();
  const [historyOpen, setHistoryOpen] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadDocument } = useUploadDocument();
  const { data: health, isError: healthError, isLoading: healthLoading } =
    useHealth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const backendOffline =
    !healthLoading && (healthError || !isBackendOnline(health?.status));
  const isRag = mode === "rag";
  const examplePrompts = isRag ? RAG_PROMPTS : DIRECT_PROMPTS;

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

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-surface">
      {/* Chat history column */}
      <div className="hidden w-[260px] shrink-0 flex-col border-r border-ink-border bg-surface px-4 py-5 lg:flex">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newChat}
          onDelete={deleteConversation}
        />
      </div>

      {/* Main chat workspace */}
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="relative flex items-center justify-center px-4 pt-5 pb-2">
          <ChatModeToggle mode={mode} onChange={setMode} disabled={isLoading} />
          <div className="absolute right-4 flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-btn border border-ink-border text-ink-secondary hover:bg-gray-50"
              aria-label="Chat history"
            >
              <History className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={newChat}
              className="flex h-9 w-9 items-center justify-center rounded-btn border border-ink-border text-ink-secondary hover:bg-gray-50"
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <Modal open={historyOpen} onOpenChange={setHistoryOpen} title="Chats">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              selectConversation(id);
              setHistoryOpen(false);
            }}
            onNew={() => {
              newChat();
              setHistoryOpen(false);
            }}
            onDelete={deleteConversation}
          />
        </Modal>

        {backendOffline && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-btn border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
            <WifiOff className="h-4 w-4" strokeWidth={1.75} />
            Backend is offline. Start the API server to chat.
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-8 pt-4 text-center">
              <BlurOrb />
              <h2 className="mb-2 text-[22px] font-semibold tracking-tight text-ink-primary">
                {isRag ? "Ask about your documents" : "Chat with AI"}
              </h2>
              <p className="mb-8 max-w-md text-[14px] leading-relaxed text-ink-secondary">
                {isRag
                  ? "Responses stream in real time with citations from your uploaded sources."
                  : "General AI chat with no document context. Answers stream token by token."}
              </p>
              <div className="flex w-full max-w-lg flex-col gap-2.5">
                {examplePrompts.map((prompt) => (
                  <PromptSuggestion
                    key={prompt.label}
                    icon={prompt.icon}
                    label={prompt.label}
                    onClick={() => handlePromptSelect(prompt.label)}
                  />
                ))}
              </div>
              {isRag && (
                <div className="mt-5">
                  <UploadDocumentButton variant="soft" />
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    message.id === streamingMessageId && isLoading
                  }
                />
              ))}
            </div>
          )}

          {error && (
            <div className="mx-auto mt-4 flex max-w-2xl items-center gap-2 rounded-btn border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".txt,.md,.pdf,.json,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadDocument(file);
              event.target.value = "";
            }}
          />
          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isLoading}
            disabled={backendOffline}
            showAttachment={isRag}
            onAttach={() => uploadInputRef.current?.click()}
            placeholder={
              isRag
                ? "Type a question about your documents…"
                : "Ask anything…"
            }
          />
        </div>
      </div>

      {/* Citations column */}
      {isRag && (
        <div className="hidden w-[280px] shrink-0 border-l border-ink-border xl:flex xl:flex-col">
          <CitationsPanel citations={activeCitations} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
