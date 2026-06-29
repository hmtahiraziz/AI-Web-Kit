"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useRegisterAuthToken } from "@/services/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  useRegisterAuthToken();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
