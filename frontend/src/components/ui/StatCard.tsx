import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
};

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-card border border-ink-border bg-surface p-5 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-icon bg-accent-light">
        {icon}
      </div>
      <p className="mt-3 text-[28px] font-semibold text-ink-primary">{value}</p>
      <p className="text-[13px] text-ink-secondary">{label}</p>
    </div>
  );
}
