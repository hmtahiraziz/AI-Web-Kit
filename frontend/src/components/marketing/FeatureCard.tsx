import type { LucideIcon } from "lucide-react";

export type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: Feature) {
  return (
    <div className="h-full rounded-card border border-ink-border bg-surface p-5 shadow-card transition-colors hover:border-accent">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-icon bg-accent-light">
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-[15px] font-medium text-ink-primary">{title}</p>
      <p className="mt-1 text-[13px] text-ink-secondary">{description}</p>
    </div>
  );
}
