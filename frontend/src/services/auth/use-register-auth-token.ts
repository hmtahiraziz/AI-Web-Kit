"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { registerTokenGetter } from "@/services/auth/token";

/**
 * Registers Clerk's `getToken` with the API token bridge so the Axios
 * client and streaming fetch can attach `Authorization: Bearer <jwt>`.
 * Mount once high in the protected tree (e.g. in AppShell).
 */
export function useRegisterAuthToken() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    registerTokenGetter(() => getToken());
    return () => registerTokenGetter(null);
  }, [getToken, isLoaded]);
}
