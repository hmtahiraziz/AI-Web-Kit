"use client";

type PillButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function PillButton({ label, onClick, disabled }: PillButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-pill border border-gray-200 px-4 py-2 text-[13px] text-ink-secondary transition-all duration-150 hover:border-accent hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
