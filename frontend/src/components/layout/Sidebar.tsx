import Link from "next/link";
import { Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <Link href="/dashboard" className="font-semibold tracking-tight">
          {APP_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
    </aside>
  );
}
