import { FileText } from "lucide-react";
import type { Citation } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CitationCard({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const location = [
    citation.page != null ? `Page ${citation.page}` : null,
    citation.section,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      className={cn(
        "cursor-default p-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="shrink-0">
          <FileText className="h-3 w-3" aria-hidden="true" />
          {index + 1}
        </Badge>
        <p className="truncate text-sm font-medium" title={citation.source}>
          {citation.source}
        </p>
      </div>
      {location && (
        <p className="mt-2 text-xs text-muted-foreground">{location}</p>
      )}
    </Card>
  );
}
