"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Zap } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-btn px-3 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-accent-light text-accent-dark"
                : "text-ink-secondary hover:bg-gray-50 hover:text-ink-primary",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarUserFooter() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="border-t border-ink-border p-3">
        <div className="flex items-center gap-3 rounded-btn px-3 py-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-accent-light" aria-hidden />
          <div className="h-3.5 w-24 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-ink-border p-3">
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-btn px-3 py-2 text-[14px] font-medium text-ink-secondary transition-colors hover:bg-gray-50 hover:text-ink-primary"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-border bg-surface">
          <User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </div>
        User Profile
      </Link>
    </div>
  );
}

export function SidebarLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
        <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight text-ink-primary">
          SA AI Web Kit
        </p>
        <p className="text-[11px] text-ink-muted">AI SaaS Platform</p>
      </div>
    </Link>
  );
}
