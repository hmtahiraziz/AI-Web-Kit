"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { useUploadDocument } from "@/hooks/use-documents";
import { cn } from "@/lib/utils";

type UploadDocumentButtonProps = {
  variant?: "default" | "outline" | "ghost" | "soft" | "link";
  label?: string;
  accept?: string;
};

export function UploadDocumentButton({
  variant = "outline",
  label = "Upload document",
  accept = ".txt,.md,.pdf,.json,.csv",
}: UploadDocumentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUploadDocument();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) mutate(file);
    event.target.value = "";
  }

  const className = cn(
    "inline-flex items-center gap-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variant === "default" &&
      "rounded-pill bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark",
    variant === "outline" &&
      "rounded-pill border border-ink-border px-4 py-2 text-ink-secondary hover:bg-gray-50",
    variant === "ghost" &&
      "rounded-btn border border-ink-border px-3 py-1.5 text-ink-secondary hover:bg-gray-50",
    variant === "soft" &&
      "rounded-pill bg-accent-light px-4 py-2 font-medium text-accent hover:bg-accent-light/80",
    variant === "link" &&
      "font-medium text-accent hover:text-accent-dark",
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {!isPending && variant !== "link" && (
          <Upload className="h-4 w-4" strokeWidth={1.75} />
        )}
        {isPending ? "Uploading…" : label}
      </button>
    </>
  );
}
