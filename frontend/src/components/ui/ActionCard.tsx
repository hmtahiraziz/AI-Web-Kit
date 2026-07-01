"use client";

import type { ReactNode } from "react";

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

export function ActionCard({
  icon,
  title,
  description,
  onClick,
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-card border border-ink-border bg-surface p-5 text-left shadow-card transition-all duration-150 hover:border-accent hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-icon bg-accent-light">
        {icon}
      </div>
      <p className="mt-3 text-[15px] font-medium text-ink-primary">{title}</p>
      <p className="mt-1 text-[13px] text-ink-secondary">{description}</p>
    </button>
  );
}
