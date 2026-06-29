import { ChatWindow } from "@/components/chat/ChatWindow";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        description="Ask questions and get cited answers from your documents."
      />
      <ChatWindow />
    </div>
  );
}
