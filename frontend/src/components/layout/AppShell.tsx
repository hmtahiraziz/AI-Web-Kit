"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useRegisterAuthToken } from "@/services/auth";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  useRegisterAuthToken();
  const pathname = usePathname();
  const isChat =
    pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
        <Topbar />
        <main
          className={cn(
            "flex-1",
            isChat ? "overflow-hidden" : "overflow-auto p-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
