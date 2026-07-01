"use client";

import dynamic from "next/dynamic";

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-9 w-9 shrink-0 rounded-full bg-accent-light"
        aria-hidden
      />
    ),
  },
);

export function UserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "h-9 w-9",
        },
      }}
    />
  );
}
