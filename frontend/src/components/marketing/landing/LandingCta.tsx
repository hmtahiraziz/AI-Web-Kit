import Link from "next/link";

export function LandingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[20px] bg-ink-primary px-8 py-14 text-center sm:px-14 sm:py-16">
          <h2 className="text-[32px] font-semibold tracking-tight text-white sm:text-[36px]">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-300">
            Create an account and start chatting with your documents today. Join
            10,000+ professionals using SA AI Web Kit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="rounded-btn bg-accent px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-accent-dark"
            >
              Get started free
            </Link>
            <Link
              href="/sign-up"
              className="rounded-btn border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Schedule a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
