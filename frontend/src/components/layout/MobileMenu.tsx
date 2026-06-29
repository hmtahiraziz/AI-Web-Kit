"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Sparkles, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-border bg-card p-4 shadow-lg focus:outline-none lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              {APP_NAME}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close navigation menu"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Application navigation
          </Dialog.Description>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
