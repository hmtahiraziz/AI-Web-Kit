import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
        <CardHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="flex items-center gap-2 text-base">
            {title}
            <ArrowRight
              className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
