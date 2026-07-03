"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

function relativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationSidebarProps) {
  const items = [...conversations]
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="text-[15px] font-semibold text-ink-primary">Chats</span>
        <button
          type="button"
          onClick={onNew}
          aria-label="New chat"
          className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-secondary transition-colors hover:bg-gray-100 hover:text-ink-primary"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="px-1 text-[13px] leading-relaxed text-ink-muted">
          No conversations yet. Start a new chat with the + button.
        </p>
      ) : (
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {items.map((convo) => (
            <li key={convo.id}>
              <div
                className={cn(
                  "group flex items-center rounded-btn",
                  convo.id === activeId && "bg-accent-light",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(convo.id)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <span
                    className={cn(
                      "block truncate text-[13px] font-medium",
                      convo.id === activeId
                        ? "text-accent-dark"
                        : "text-ink-primary",
                    )}
                  >
                    {convo.title || "New chat"}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {relativeTime(convo.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => onDelete(convo.id)}
                  className="mr-1 rounded-btn p-1.5 text-ink-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
