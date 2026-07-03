"use client";

import { useRef } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showAttachment?: boolean;
  onAttach?: () => void;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
  placeholder = "Type a question about your documents…",
  showAttachment = true,
  onAttach,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!isLoading && value.trim()) onSubmit();
        }}
        className="flex items-center gap-2 rounded-pill border border-gray-200 bg-surface px-4 py-2 shadow-sm"
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          aria-label="Chat message"
          className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-ink-primary outline-none placeholder:text-ink-muted"
        />
        {showAttachment && (
          <button
            type="button"
            disabled={disabled || isLoading}
            onClick={onAttach}
            aria-label="Attach document"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-gray-50 hover:text-ink-secondary disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-border text-ink-secondary hover:bg-gray-50"
            aria-label="Stop"
          >
            <Square className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || isLoading || !value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </form>
      <p className="mt-2 text-center text-[11px] text-ink-muted">
        AI can make mistakes. Verify important info.
      </p>
    </div>
  );
}
