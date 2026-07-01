import { FileText, Send } from "lucide-react";

export function HeroMockup() {
  return (
    <div className="mx-auto mt-14 w-full max-w-3xl rounded-[20px] border border-ink-border bg-surface p-5 shadow-[0_20px_60px_rgba(99,102,241,0.12)] sm:p-6">
      <div className="flex items-center gap-3 border-b border-ink-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
          <FileText className="h-5 w-5 text-accent" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[14px] font-medium text-ink-primary">
            Annual_Report_2023.pdf
          </p>
          <p className="text-[12px] text-ink-muted">Processed · 156 pages</p>
        </div>
      </div>

      <div className="space-y-5 py-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-ink-secondary">
            JD
          </div>
          <p className="pt-1 text-[14px] leading-relaxed text-ink-primary">
            What was the net revenue growth in Q3 compared to last year?
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
            AI
          </div>
          <div className="min-w-0 flex-1">
            <div className="rounded-[16px] rounded-tl-sm bg-accent-light px-4 py-3 text-[14px] leading-relaxed text-ink-primary">
              Net revenue in Q3 2023 grew by{" "}
              <strong className="font-semibold">14.2% YoY</strong>, reaching
              $4.2B. This was primarily driven by the cloud services segment.{" "}
              <span className="text-accent-dark">[1]</span>
            </div>
            <p className="mt-2 text-[12px] text-ink-muted">
              Source: Page 42, Financial Summary
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-pill border border-ink-border bg-canvas px-4 py-2.5">
        <input
          readOnly
          value="Ask anything about this document..."
          className="flex-1 bg-transparent text-[13px] text-ink-muted outline-none"
          aria-hidden
        />
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white"
          aria-hidden
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
