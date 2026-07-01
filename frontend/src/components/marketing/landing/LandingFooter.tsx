import Link from "next/link";
import { Globe, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Integrations", href: "#" },
      { label: "Enterprise", href: "#" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "API reference", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Discord", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Github", href: "#" },
      { label: "Privacy policy", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer
      id="docs"
      className="border-t border-ink-border bg-[#F5F3FF] py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-[15px] font-semibold text-ink-primary">
                {APP_NAME}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-secondary">
              The leading RAG platform for document-based artificial
              intelligence.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[13px] font-semibold text-ink-primary">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-ink-secondary transition-colors hover:text-ink-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-border/60 pt-8 sm:flex-row">
          <p className="text-[12px] text-ink-muted">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-muted hover:bg-white/60"
              aria-label="Language"
            >
              <Globe className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <ThemeToggle className="hover:bg-white/60" />
          </div>
        </div>
      </div>
    </footer>
  );
}
