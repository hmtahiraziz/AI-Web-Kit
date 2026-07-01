"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { StreamingCursor } from "@/components/chat/StreamingCursor";

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const showTyping = !isUser && isStreaming && message.content.length === 0;
  const showCursor = !isUser && isStreaming && message.content.length > 0;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="group max-w-[75%]">
        <div
          className={cn(
            "rounded-[16px] px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-accent text-white"
              : "rounded-tl-sm bg-accent-light text-ink-primary",
          )}
        >
          {showTyping ? <TypingIndicator /> : message.content}
          {showCursor && <StreamingCursor />}
        </div>
        {!isUser && message.content && !showTyping && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="mt-1 flex items-center gap-1 px-1 text-[12px] text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink-secondary"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" strokeWidth={1.75} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" strokeWidth={1.75} />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
