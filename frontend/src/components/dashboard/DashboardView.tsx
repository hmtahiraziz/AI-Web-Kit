"use client";

import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Settings as SettingsIcon,
  Layers,
  Activity,
} from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { useHealth } from "@/hooks/use-health";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    icon: SettingsIcon,
  },
];

function isBackendOnline(status: string | undefined) {
  return status === "healthy" || status === "ok";
}

export function DashboardView({ firstName }: { firstName?: string | null }) {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome{firstName ? `, ${firstName}` : ""}. Here&apos;s what&apos;s
          happening in your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Documents"
          value={docsLoading ? "—" : docCount}
          icon={FileText}
        />
        <StatCard
          label="Total chunks"
          value={docsLoading ? "—" : chunkCount}
          icon={Layers}
        />
        <StatCard label="Backend" value={backendLabel} icon={Activity} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent documents
          </h2>
          {docCount > 0 && (
            <Link
              href="/documents"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {docsLoading && (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        )}

        {!docsLoading && recentDocs.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No documents yet.{" "}
              <Link href="/documents" className="text-primary hover:underline">
                Upload your first file
              </Link>{" "}
              to get started.
            </CardContent>
          </Card>
        )}

        {!docsLoading && recentDocs.length > 0 && (
          <div className="grid gap-3">
            {recentDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      className="h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunks} chunks
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">{doc.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
