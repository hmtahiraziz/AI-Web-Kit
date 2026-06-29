import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const LINKS = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Create account", href: "/sign-up" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          {APP_NAME}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <ThemeToggle />
        </div>
      </Container>
    </footer>
  );
}
