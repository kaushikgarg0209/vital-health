"use client";

import { cn } from "@/lib/utils";

type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  disabled?: boolean;
  className?: string;
};

export function FormSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className,
}: FormSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={cn(
        "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
