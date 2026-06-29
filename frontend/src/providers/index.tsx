"use client";

import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <ToastProvider />
      </QueryProvider>
    </ThemeProvider>
  );
}
