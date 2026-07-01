import { BadgeCheck, FileText, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: "Upload",
    description: "Add your PDFs, text files, and notes in seconds.",
  },
  {
    icon: MessageSquare,
    title: "Ask",
    description: "Ask anything in plain language, just like chatting.",
  },
  {
    icon: BadgeCheck,
    title: "Get cited answers",
    description: "Receive grounded answers with links to the source.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-[32px] font-semibold tracking-tight text-ink-primary">
            How it works
          </h2>
          <p className="mt-3 text-[16px] text-ink-secondary">
            From upload to answer in seconds.
          </p>
        </div>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          <div
            aria-hidden
            className="absolute left-[16.67%] right-[16.67%] top-5 hidden border-t border-dashed border-gray-300 sm:block"
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-white">
                  {index + 1}
                </div>
                <div className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-icon bg-accent-light">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink-primary">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[220px] text-[13px] leading-relaxed text-ink-secondary">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
