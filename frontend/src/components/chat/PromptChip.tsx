import { Button } from "@/components/ui/button";

export function PromptChip({
  text,
  onSelect,
}: {
  text: string;
  onSelect: (text: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto whitespace-normal px-3 py-2 text-left font-normal"
      onClick={() => onSelect(text)}
    >
      {text}
    </Button>
  );
}
