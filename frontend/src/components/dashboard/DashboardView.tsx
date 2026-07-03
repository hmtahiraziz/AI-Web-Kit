"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  Layers,
  MessageSquare,
  Settings,
  File,
} from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { useHealth } from "@/hooks/use-health";
import { StatCard } from "@/components/ui/StatCard";
import { ActionCard } from "@/components/ui/ActionCard";
import { Loader } from "@/components/ui/loader";

const QUICK_ACTIONS = [
  {
    href: "/chat",
    title: "Open chat",
    description: "Ask questions and get cited answers from your documents.",
    icon: MessageSquare,
  },
  {
    href: "/documents",
    title: "Manage documents",
    description: "Upload PDFs, text files, and notes to your knowledge base.",
    icon: FileText,
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Manage your account, theme, and workspace preferences.",
    icon: Settings,
  },
];

function isBackendOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function DashboardView({ firstName }: { firstName?: string | null }) {
  const router = useRouter();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: health, isLoading: healthLoading, isError: healthError } =
    useHealth();

  const docCount = documents?.length ?? 0;
  const chunkCount =
    documents?.reduce((sum, doc) => sum + (doc.chunks ?? 0), 0) ?? 0;
  const backendLabel = healthLoading
    ? "Checking…"
    : healthError
      ? "Offline"
      : isBackendOnline(health?.status)
        ? "Online"
        : "Degraded";
  const recentDocs = documents?.slice(0, 3) ?? [];

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-ink-primary">Dashboard</h1>
      <p className="mt-1 text-[14px] text-ink-secondary">
        Welcome{firstName ? `, ${firstName}` : ""}. Here&apos;s what&apos;s
        happening in your workspace.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<File className="h-[22px] w-[22px] text-accent" strokeWidth={1.75} />}
          value={docsLoading ? "—" : docCount}
          label="Documents"
        />
        <StatCard
          icon={<Layers className="h-[22px] w-[22px] text-accent" strokeWidth={1.75} />}
          value={docsLoading ? "—" : chunkCount}
          label="Total chunks"
        />
        <StatCard
          icon={<Activity className="h-[22px] w-[22px] text-accent" strokeWidth={1.75} />}
          value={backendLabel}
          label="Backend"
        />
      </div>

      <p className="mb-4 mt-8 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
        Quick actions
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <ActionCard
              key={action.href}
              icon={<Icon className="h-[22px] w-[22px] text-accent" strokeWidth={1.75} />}
              title={action.title}
              description={action.description}
              onClick={() => router.push(action.href)}
            />
          );
        })}
      </div>

      <p className="mb-4 mt-8 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
        Recent documents
      </p>

      {docsLoading && (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      )}

      {!docsLoading && recentDocs.length === 0 && (
        <div className="rounded-card border border-ink-border p-8 text-center">
          <p className="text-[14px] text-ink-secondary">
            No documents yet.{" "}
            <Link href="/documents" className="text-accent hover:underline">
              Upload your first file
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}

      {!docsLoading && recentDocs.length > 0 && (
        <div className="space-y-2">
          {recentDocs.map((doc) => (
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
                <p className="text-[12px] text-ink-muted">{doc.chunks} chunks</p>
              </div>
            </div>
          ))}
          {docCount > 3 && (
            <Link
              href="/documents"
              className="inline-block text-[13px] text-accent hover:underline"
            >
              View all documents
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
