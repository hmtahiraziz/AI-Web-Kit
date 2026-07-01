import type { LucideIcon } from "lucide-react";

export type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: Step & { step: number }) {
  return (
    <div className="h-full rounded-card border border-ink-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
          {step}
        </span>
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-[15px] font-medium text-ink-primary">{title}</p>
      <p className="mt-1 text-[13px] text-ink-secondary">{description}</p>
    </div>
  );
}
