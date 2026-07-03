"use client";

import dynamic from "next/dynamic";
import { Loader } from "@/components/ui/loader";

const UserProfile = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserProfile),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center p-8">
        <Loader />
      </div>
    ),
  },
);

export function ClerkUserProfile() {
  return <UserProfile routing="hash" />;
}
