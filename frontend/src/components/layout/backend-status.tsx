"use client";

import { useHealth } from "@/hooks/use-health";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function isOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function BackendStatus() {
  const { data, isLoading, isError } = useHealth();

  const variant = isError
    ? "destructive"
    : isLoading
      ? "secondary"
      : isOnline(data?.status)
        ? "success"
        : "warning";

  const label = isError
    ? "API offline"
    : isLoading
      ? "Checking…"
      : isOnline(data?.status)
        ? "API online"
        : "API degraded";

  return (
    <Badge variant={variant} className="hidden sm:inline-flex">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isError
            ? "bg-destructive"
            : isOnline(data?.status)
              ? "bg-success"
              : "bg-warning",
        )}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
}
