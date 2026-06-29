"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const showTyping = !isUser && isStreaming && message.content.length === 0;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <Avatar name="AI" />}
      <div className="flex max-w-[85%] flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {showTyping ? <TypingIndicator /> : message.content}
        </div>
        {!isUser && message.content && !showTyping && (
          <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      {isUser && <Avatar name="You" />}
    </div>
  );
}
