"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark" | "system") ?? "system"}
    />
  );
}
