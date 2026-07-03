import { Check, FileText } from "lucide-react";

const CHECKLIST = [
  "Automatic OCR for scanned PDFs",
  "Multi-document context awareness",
  "High-precision vector retrieval",
];

const DOCUMENTS = [
  { name: "Marketing_Strategy_v2.pdf", active: false },
  { name: "Compliance_Guidelines.pdf", active: true },
  { name: "Q3_Review_Meeting_Notes.txt", active: false },
];

export function LandingCitationSection() {
  return (
    <section className="border-y border-ink-border bg-[#F9FAFB] py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-primary">
            Never lose a citation again
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">
            Our AI doesn&apos;t just guess. It scans your documents to find the
            exact phrasing and data you need, providing clickable links back to
            the original text. Manage hundreds of documents in a clean,
            high-performance dashboard.
          </p>
          <ul className="mt-8 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-ink-primary">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-light">
                  <Check className="h-3 w-3 text-accent" strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-card border border-ink-border bg-surface p-5 shadow-card">
            <p className="text-[13px] font-semibold text-ink-primary">
              Recent documents
            </p>
            <ul className="mt-4 space-y-2">
              {DOCUMENTS.map((doc) => (
                <li
                  key={doc.name}
                  className={
                    doc.active
                      ? "flex items-center gap-3 rounded-btn border border-accent/30 bg-accent-light px-3 py-2.5"
                      : "flex items-center gap-3 rounded-btn px-3 py-2.5 hover:bg-gray-50"
                  }
                >
                  <FileText
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={1.75}
                  />
                  <span className="truncate text-[13px] text-ink-primary">
                    {doc.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute -bottom-4 -right-2 w-[220px] rounded-card border border-ink-border bg-surface p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:-right-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-dark">
              Citation found
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">
              &ldquo;All employees must complete annual compliance training by
              Q4...&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
