"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
