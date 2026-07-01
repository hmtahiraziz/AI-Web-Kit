"use client";

import { MobileMenu } from "@/components/layout/MobileMenu";
import { BackendStatus } from "@/components/layout/backend-status";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/UserMenu";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-ink-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileMenu />
      </div>
      <div className="flex items-center gap-2">
        <BackendStatus />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
