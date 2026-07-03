"use client";

import { UserButton } from "@clerk/nextjs";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BackendStatus } from "@/components/layout/backend-status";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <MobileMenu />
      </div>
      <div className="flex items-center gap-2">
        <BackendStatus />
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
