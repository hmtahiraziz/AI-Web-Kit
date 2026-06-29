"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadDocument } from "@/hooks/use-documents";

type UploadDocumentButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost";
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant={variant}
        isLoading={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {!isPending && <Upload className="h-4 w-4" />}
        {label}
      </Button>
    </>
  );
}
