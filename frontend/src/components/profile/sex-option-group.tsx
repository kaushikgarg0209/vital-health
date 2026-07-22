"use client";

import { cn } from "@/lib/utils";
import type { BiologicalSex } from "@/types/profile";

const OPTIONS: Array<{
  value: BiologicalSex;
  label: string;
  description: string;
}> = [
  {
    value: "female",
    label: "Female",
    description: "Used for reference ranges and health context",
  },
  {
    value: "male",
    label: "Male",
    description: "Used for reference ranges and health context",
  },
  {
    value: "other",
    label: "Other / prefer not to say",
    description: "We will use general reference ranges where applicable",
  },
];

type SexOptionGroupProps = {
  value: BiologicalSex | "";
  error?: string;
  onChange: (value: BiologicalSex) => void;
  onBlur?: () => void;
};

export function SexOptionGroup({ value, error, onChange, onBlur }: SexOptionGroupProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-700">Biological sex</p>
        <p className="text-sm text-neutral-400">
          Helps Vital interpret lab results with the right reference ranges.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Biological sex">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(option.value);
                onBlur?.();
              }}
              className={cn(
                "rounded-xl border px-4 py-3.5 text-left transition-all",
                selected
                  ? "border-primary-500 bg-primary-50 shadow-sm shadow-primary-100"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
                error && !selected && "border-red-300",
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-primary-800" : "text-neutral-700",
                )}
              >
                {option.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
