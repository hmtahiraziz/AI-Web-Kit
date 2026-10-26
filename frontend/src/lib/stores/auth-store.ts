import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side user preferences / cached flags.
 * Clerk remains the source of truth for the actual session — this store only
 * holds UI-facing preferences that should persist across reloads.
 */
type AuthState = {
  sidebarCollapsed: boolean;
  preferredModelLabel: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setPreferredModelLabel: (label: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      preferredModelLabel: "default",
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPreferredModelLabel: (label) => set({ preferredModelLabel: label }),
    }),
    { name: "sa-ai-web-kit-auth" },
  ),
);
