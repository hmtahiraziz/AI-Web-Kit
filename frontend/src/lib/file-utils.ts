import type { LucideIcon } from "lucide-react";
import { FileText, FileType, FileCode } from "lucide-react";

export function getFileTypeIcon(filename: string): LucideIcon {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileType;
  if (ext === "md" || ext === "markdown") return FileCode;
  return FileText;
}

export function getFileTypeColor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "text-red-500";
  if (ext === "md" || ext === "markdown") return "text-blue-500";
  return "text-primary";
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}
