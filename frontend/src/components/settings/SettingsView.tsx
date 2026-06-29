"use client";

import { UserProfile } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/settings/SettingsRow";
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
  const setSidebarCollapsed = useAuthStore((state) => state.setSidebarCollapsed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Manage your profile, security, and connected accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border border-border">
          <UserProfile routing="hash" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose your preferred theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="inline-flex rounded-lg border border-border p-1">
              {THEMES.map((option) => {
                const Icon = option.icon;
                const active = mounted && theme === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "gap-2 rounded-md",
                      !active && "hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>Local UI preferences for this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsRow
              title="Collapse sidebar by default"
              description="Start with the navigation sidebar collapsed."
              control={
                <Switch
                  checked={sidebarCollapsed}
                  onCheckedChange={setSidebarCollapsed}
                  aria-label="Collapse sidebar by default"
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
