import {
  BadgeCheck,
  FileText,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "Sign in with email or Google. Your documents stay private to your account and encrypted at rest.",
  },
  {
    icon: Smartphone,
    title: "Works everywhere",
    description:
      "A fast, accessible interface that looks great on any device, light or dark mode supported natively.",
  },
  {
    icon: BadgeCheck,
    title: "Answers you can trust",
    description:
      "Get instant answers with citations that link back to the exact paragraph and page in the source.",
  },
  {
    icon: FileText,
    title: "Built on your content",
    description:
      "Upload PDFs, docs, and notes — get grounded answers from your own custom knowledge base.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-ink-border bg-surface py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-icon bg-accent-light">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
              </div>
              <h3 className="text-[15px] font-semibold text-ink-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
