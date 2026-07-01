"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { SidebarLogo, SidebarNav, SidebarUserFooter } from "@/components/layout/sidebar-nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-secondary hover:bg-gray-50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-ink-border bg-surface shadow-card focus:outline-none lg:hidden">
          <div className="flex items-center justify-between border-b border-ink-border px-4 py-4">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <SidebarLogo />
            <Dialog.Close
              aria-label="Close navigation menu"
              className="rounded-btn p-1 text-ink-muted hover:bg-gray-50 hover:text-ink-primary"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Application navigation
          </Dialog.Description>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <SidebarUserFooter />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
