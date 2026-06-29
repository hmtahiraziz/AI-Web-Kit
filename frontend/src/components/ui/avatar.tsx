import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name?: string;
  src?: string;
  className?: string;
};

export function Avatar({ name = "AI", src, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("h-9 w-9 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
    >
      {initials}
    </div>
  );
}
