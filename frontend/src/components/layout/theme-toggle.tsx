"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-btn text-ink-secondary transition-colors hover:bg-gray-50",
        className,
      )}
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" strokeWidth={1.75} />
      <Moon className="h-[18px] w-[18px] dark:hidden" strokeWidth={1.75} />
    </button>
  );
}
