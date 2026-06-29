import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: Feature) {
  return (
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
