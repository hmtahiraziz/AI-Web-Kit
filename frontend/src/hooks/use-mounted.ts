"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR and the first client render, true afterwards —
 * without calling setState in an effect. Useful for hydration-safe UI that
 * depends on client-only values (e.g. resolved theme).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
