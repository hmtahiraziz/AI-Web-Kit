"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Search, Trash2, Upload } from "lucide-react";
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from "@/hooks/use-documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-utils";
import type { UploadedDocument } from "@/types/document";

function statusVariant(status: UploadedDocument["status"]) {
  if (status === "ready") return "success" as const;
  if (status === "failed") return "destructive" as const;
  return "warning" as const;
}

export function DocumentsView() {
  const { data, isLoading, isError } = useDocuments();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UploadedDocument | null>(
    null,
  );

  const filtered =
    data?.filter((doc) =>
      doc.filename.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const uploadFile = useCallback(
    (file: File) => {
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleDeleteConfirm() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadFile(file);
          event.target.value = "";
        }}
      />

      {data && data.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents…"
            className="rounded-btn border-ink-border pl-9 text-[14px]"
            aria-label="Search documents"
          />
        </div>
      )}

      {uploadMutation.isPending && (
        <div className="flex items-center gap-3 rounded-card border border-ink-border bg-surface p-4 shadow-card">
          <Loader className="h-5 w-5" />
          <div>
            <p className="text-[14px] font-medium text-ink-primary">
              Processing upload…
            </p>
            <p className="text-[12px] text-ink-muted">
              Extracting text and generating embeddings.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      )}

      {isError && (
        <div className="rounded-card border border-ink-border p-8 text-center">
          <p className="text-[14px] font-medium text-ink-primary">
            Could not reach the backend
          </p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Documents will appear here once the RAG service is connected.
          </p>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-card border-[1.5px] border-dashed p-16 text-center transition-all",
            isDragging
              ? "border-accent bg-accent-light/30"
              : "border-gray-300 hover:border-accent hover:bg-accent-light/30",
          )}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-light">
            <Upload className="h-6 w-6 text-accent" strokeWidth={1.75} />
          </div>
          <p className="text-[16px] font-medium text-ink-primary">
            Drop a file here or click to upload
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Supports PDF, TXT, and Markdown files.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink-muted">
              No documents match &ldquo;{search}&rdquo;.
            </p>
          )}
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-card border border-ink-border bg-surface px-4 py-3 shadow-card"
            >
              <FileText
                className="h-[18px] w-[18px] shrink-0 text-accent"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink-primary">
                  {doc.filename}
                </p>
                <p className="text-[12px] text-ink-muted">
                  {formatFileSize(doc.size)}
                  {doc.chunks ? ` · ${doc.chunks} chunks` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                <button
                  type="button"
                  aria-label={`Delete ${doc.filename}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => setPendingDelete(doc)}
                  className="rounded-btn p-1.5 text-ink-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete document?"
        description={
          pendingDelete
            ? `"${pendingDelete.filename}" will be removed from your knowledge base along with all its embeddings.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
