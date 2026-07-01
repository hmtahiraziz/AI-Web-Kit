"use client";

import { ClerkUserProfile } from "@/components/settings/ClerkUserProfile";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const sidebarCollapsed = useAuthStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAuthStore(
    (state) => state.setSidebarCollapsed,
  );

  return (
    <div>
      <div className="mt-8">
        <p className="font-semibold text-ink-primary">Account</p>
        <p className="mt-0.5 text-[13px] text-ink-secondary">
          Manage your profile, security, and connected accounts.
        </p>
        <div className="mt-4 overflow-hidden rounded-card border border-ink-border bg-surface">
          <ClerkUserProfile />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink-border bg-surface p-5 shadow-card">
          <p className="text-[15px] font-semibold text-ink-primary">
            Appearance
          </p>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Choose your preferred theme.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {THEMES.map((option) => {
              const Icon = option.icon;
              const active = mounted && theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-btn px-4 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-accent font-medium text-white"
                      : "border border-ink-border text-ink-secondary hover:bg-gray-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-ink-border bg-surface p-5 shadow-card">
          <p className="text-[15px] font-semibold text-ink-primary">
            Workspace
          </p>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Local UI preferences for this browser.
          </p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-ink-primary">
                Collapse sidebar by default
              </p>
              <p className="text-[12px] text-ink-muted">
                Start with the navigation sidebar collapsed.
              </p>
            </div>
            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={setSidebarCollapsed}
              aria-label="Collapse sidebar by default"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
