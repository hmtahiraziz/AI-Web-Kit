import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, MessageSquare, FileText, Settings } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const APP_NAME = "SA AI Web Kit";
