"use client";

import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

function isOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function BackendStatus() {
  const { data, isLoading, isError } = useHealth();

  const online = !isError && !isLoading && isOnline(data?.status);

  const label = isError
    ? "API Offline"
    : isLoading
      ? "Checking…"
      : online
        ? "API Online"
        : "API Degraded";

  return (
    <span
      className={cn(
        "hidden items-center gap-2 text-[13px] sm:inline-flex",
        online
          ? "text-ink-secondary"
          : isError
            ? "text-red-600"
            : "text-amber-600",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-green-500" : isError ? "bg-red-500" : "bg-amber-500",
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
