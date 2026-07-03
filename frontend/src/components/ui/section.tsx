import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export function Section({
  className,
  containerClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { containerClassName?: string }) {
  return (
    <section className={cn("py-16 sm:py-24", className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
