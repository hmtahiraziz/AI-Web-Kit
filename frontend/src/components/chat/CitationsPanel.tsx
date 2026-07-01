"use client";

import { BookOpen, FileText } from "lucide-react";
import { CitationCard } from "@/components/chat/CitationCard";
import { UploadDocumentButton } from "@/components/chat/UploadDocumentButton";
import { useDocuments } from "@/hooks/use-documents";
import type { Citation } from "@/types/chat";

type CitationsPanelProps = {
  citations: Citation[];
  isLoading?: boolean;
};

export function CitationsPanel({ citations, isLoading }: CitationsPanelProps) {
  const { data: documents = [] } = useDocuments();
  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  return (
    <aside className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-ink-border px-5 py-4">
        <span className="text-[15px] font-semibold text-ink-primary">
          Citations
        </span>
        <UploadDocumentButton variant="link" label="Upload" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        {citations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-light">
              <BookOpen
                className="h-6 w-6 text-accent"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="max-w-[200px] text-[13px] italic leading-relaxed text-ink-muted">
              {isLoading
                ? "Finding sources while the answer streams…"
                : "Sources for the latest answer will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <CitationCard
                key={`${citation.source}-${citation.page ?? index}`}
                citation={citation}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-ink-border px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Connected sources
        </p>
        {readyDocuments.length === 0 ? (
          <p className="text-[12px] text-ink-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {readyDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2 text-[13px] text-ink-secondary"
              >
                <FileText
                  className="h-4 w-4 shrink-0 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="truncate" title={doc.filename}>
                  {doc.filename}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
