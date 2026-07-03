import { DocumentsView } from "@/components/documents/DocumentsView";
import { PageHeader } from "@/components/layout/PageHeader";
import { UploadDocumentButton } from "@/components/chat/UploadDocumentButton";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload and manage the files that power your knowledge base."
        action={<UploadDocumentButton variant="default" />}
      />
      <DocumentsView />
    </div>
  );
}
