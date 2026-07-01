import * as React from "react";
import type { LucideIcon } from "lucide-react";

export function Hero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center"
      >
        <div
          className="h-48 w-48 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, #C7D2FE 0%, #A5B4FC 50%, #818CF8 100%)",
            filter: "blur(32px)",
          }}
        />
      </div>
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        {EyebrowIcon && (
          <p className="inline-flex items-center gap-2 rounded-pill border border-ink-border bg-accent-light px-3 py-1 text-[12px] font-medium tracking-wide text-accent-dark">
            <EyebrowIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-ink-primary sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-ink-secondary">
          {subtitle}
        </p>
        {actions && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
