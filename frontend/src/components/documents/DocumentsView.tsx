"use client";

import { useCallback, useRef, useState } from "react";
import { Inbox, Search, Trash2, Upload } from "lucide-react";
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from "@/hooks/use-documents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  getFileTypeColor,
  getFileTypeIcon,
} from "@/lib/file-utils";
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
    <div className="space-y-4">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents…"
            className="pl-9"
            aria-label="Search documents"
          />
        </div>
      )}

      {uploadMutation.isPending && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Loader className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Processing upload…</p>
              <p className="text-xs text-muted-foreground">
                Extracting text and generating embeddings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Inbox}
          title="Could not reach the backend"
          description="Documents will appear here once the RAG service is connected."
        />
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
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-14 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Drop a file here or click to upload</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports PDF, TXT, and Markdown files.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No documents match &ldquo;{search}&rdquo;.
            </p>
          )}
          {filtered.map((doc) => {
            const Icon = getFileTypeIcon(doc.filename);
            const iconColor = getFileTypeColor(doc.filename);
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={cn("h-5 w-5 shrink-0", iconColor)}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)}
                        {doc.chunks ? ` · ${doc.chunks} chunks` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={statusVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${doc.filename}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => setPendingDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
