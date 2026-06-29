import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";

export function Hero({
  eyebrow,
  eyebrowIcon,
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
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.primary/0.14),transparent)]"
      />
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
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
