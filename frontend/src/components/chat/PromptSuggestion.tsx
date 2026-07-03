"use client";

import type { ReactNode } from "react";

type PromptSuggestionProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function PromptSuggestion({
  icon,
  label,
  onClick,
  disabled,
}: PromptSuggestionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full max-w-lg items-center gap-3 rounded-pill border border-gray-200 bg-surface px-4 py-3 text-left text-[13px] text-ink-secondary transition-colors hover:border-accent/30 hover:bg-accent-light/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </button>
  );
}
