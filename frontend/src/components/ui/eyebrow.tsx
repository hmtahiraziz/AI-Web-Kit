import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  icon: Icon,
  className,
  children,
}: {
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden="true" />}
      {children}
    </p>
  );
}
