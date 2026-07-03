import Link from "next/link";
import { Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-border/60 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold text-ink-primary">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={signedIn ? "/dashboard" : "/sign-in"}
            className="hidden text-[14px] text-ink-secondary transition-colors hover:text-ink-primary sm:inline"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
          <Link
            href={signedIn ? "/dashboard" : "/sign-up"}
            className="rounded-btn bg-accent px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
