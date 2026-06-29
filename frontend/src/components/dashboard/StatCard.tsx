import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
