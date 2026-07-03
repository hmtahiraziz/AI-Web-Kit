"use client";

import type { ChatMode } from "@/types/chat";
import { cn } from "@/lib/utils";

type ChatModeToggleProps = {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
};

const TABS: { id: ChatMode; label: string }[] = [
  { id: "rag", label: "Documents (RAG)" },
  { id: "direct", label: "General AI" },
];

export function ChatModeToggle({
  mode,
  onChange,
  disabled,
}: ChatModeToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label="Chat mode"
    >
      {TABS.map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-pill px-5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-accent text-white shadow-sm"
                : "bg-gray-100 text-ink-secondary hover:bg-gray-200/80 hover:text-ink-primary",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
