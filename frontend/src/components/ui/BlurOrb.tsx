import { Sparkles } from "lucide-react";

export function BlurOrb() {
  return (
    <div className="relative mx-auto mb-8 flex h-[120px] w-[120px] items-center justify-center">
      <div
        className="absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(circle, #C7D2FE 0%, #A5B4FC 45%, #818CF8 100%)",
          filter: "blur(28px)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-center">
        <Sparkles
          className="h-8 w-8 text-accent-dark"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
