"use client";

import { useRef } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoading && value.trim()) onSubmit();
      }}
      className="flex items-end gap-2"
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your documents…"
        rows={1}
        disabled={disabled}
        aria-label="Chat message"
        className="max-h-40 min-h-11 resize-none"
      />
      {isLoading && onStop ? (
        <Button type="button" variant="outline" size="icon" onClick={onStop}>
          <Square className="h-4 w-4" />
          <span className="sr-only">Stop</span>
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isLoading || !value.trim()}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      )}
    </form>
  );
}
