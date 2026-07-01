import { FileText } from "lucide-react";
import type { Citation } from "@/types/chat";

export function CitationCard({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const location = [
    citation.page != null ? `Page ${citation.page}` : null,
    citation.section,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-card border border-ink-border bg-surface p-3 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-light text-[11px] font-medium text-accent-dark">
          {index + 1}
        </span>
        <FileText
          className="h-3.5 w-3.5 shrink-0 text-accent"
          strokeWidth={1.75}
          aria-hidden
        />
        <p
          className="truncate text-[13px] font-medium text-ink-primary"
          title={citation.source}
        >
          {citation.source}
        </p>
      </div>
      {location && (
        <p className="mt-1.5 text-[12px] text-ink-muted">{location}</p>
      )}
    </div>
  );
}
