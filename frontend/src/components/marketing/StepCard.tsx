import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: Step & { step: number }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {step}
          </span>
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
