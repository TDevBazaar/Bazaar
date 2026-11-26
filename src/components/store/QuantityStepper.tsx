"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantityStepperProps) {
  const btnCls =
    size === "sm"
      ? "h-7 w-7 text-xs"
      : "h-9 w-9 text-sm";

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 shadow-2xs">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Reducir cantidad"
        className={`inline-flex items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 ${btnCls}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        className={`min-w-7 text-center font-semibold tabular-nums text-zinc-950 ${
          size === "sm" ? "px-1 text-xs" : "px-2 text-sm"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
        className={`inline-flex items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 ${btnCls}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
