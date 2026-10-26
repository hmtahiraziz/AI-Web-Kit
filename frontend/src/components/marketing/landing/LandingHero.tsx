import Link from "next/link";
import { Sparkles } from "lucide-react";
import { HeroMockup } from "@/components/marketing/landing/HeroMockup";

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(199,210,254,0.55) 0%, rgba(165,180,252,0.25) 40%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-pill border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
          Retrieval-augmented generation
        </p>

        <h1 className="mx-auto mt-6 max-w-3xl text-[40px] font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-[52px]">
          Chat with your documents
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-secondary">
          Upload your files and get instant, cited answers from your own
          knowledge base. No more digging through PDFs.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={signedIn ? "/dashboard" : "/sign-up"}
            className="rounded-btn bg-accent px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Get started for free
          </Link>
          <Link
            href={signedIn ? "/chat" : "/sign-up"}
            className="rounded-btn border border-ink-border bg-surface px-6 py-3 text-[14px] font-medium text-ink-primary transition-colors hover:bg-gray-50"
          >
            View demo
          </Link>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}
