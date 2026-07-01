import { SettingsView } from "@/components/settings/SettingsView";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, appearance, and workspace preferences."
      />
      <SettingsView />
    </div>
  );
}
