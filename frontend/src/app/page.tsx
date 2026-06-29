import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  Quote,
  FileText,
  Upload,
  MessageSquare,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Hero, FeatureCard, StepCard, Footer } from "@/components/marketing";
import type { Feature, Step } from "@/components/marketing";

const FEATURES: Feature[] = [
  {
    title: "Secure by default",
    icon: ShieldCheck,
    description:
      "Sign in with email or Google. Your documents stay private to your account.",
  },
  {
    title: "Works everywhere",
    icon: Smartphone,
    description:
      "A fast, accessible interface that looks great on any device, light or dark.",
  },
  {
    title: "Answers you can trust",
    icon: Quote,
    description:
      "Get instant answers with citations that link back to the exact source.",
  },
  {
    title: "Built on your content",
    icon: FileText,
    description:
      "Upload PDFs, docs, and notes — get grounded answers from your own knowledge.",
  },
];

const STEPS: Step[] = [
  {
    icon: Upload,
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

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="flex-1">
      <Section className="pt-20 sm:pt-28">
        <Hero
          eyebrow="Retrieval-Augmented Generation"
          eyebrowIcon={Sparkles}
          title="Chat with your documents"
          subtitle="Upload your files and get instant, cited answers from your own knowledge base. No more digging through PDFs."
          actions={
            userId ? (
              <Link href="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg">Get started</Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </>
            )
          }
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From upload to answer in seconds.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <StepCard key={step.title} step={index + 1} {...step} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-card p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Create an account and start chatting with your documents today.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={userId ? "/dashboard" : "/sign-up"}>
              <Button size="lg">
                {userId ? "Open app" : "Get started free"}
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}
