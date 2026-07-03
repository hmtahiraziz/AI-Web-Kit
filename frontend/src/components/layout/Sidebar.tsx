import {
  SidebarLogo,
  SidebarNav,
  SidebarUserFooter,
} from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col border-r border-ink-border bg-surface lg:flex">
      <div className="border-b border-ink-border px-5 py-4">
        <SidebarLogo />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
      <SidebarUserFooter />
    </aside>
  );
}
