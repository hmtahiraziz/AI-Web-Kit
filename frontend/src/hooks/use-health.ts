"use client";

import { useQuery } from "@tanstack/react-query";
import { healthCheck } from "@/services/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: healthCheck,
    retry: 0,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}
