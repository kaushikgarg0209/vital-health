"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  formatCountryLabel,
  getCountryName,
  listCountriesForSelect,
} from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

type CountrySelectProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

export function CountrySelect({ id, value, onChange, disabled = false }: CountrySelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { popular, remaining } = useMemo(() => listCountriesForSelect(search), [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setSearch("");
  }

  const selectedLabel = value ? formatCountryLabel(value) : "Select country";

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 text-left text-sm shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60",
          !value && "text-neutral-400",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <Globe className="size-4 shrink-0 text-neutral-400" />
          {selectedLabel}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-neutral-400 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search countries..."
                className="rounded-lg pl-9"
                autoFocus
              />
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {popular.length > 0 ? (
              <>
                <li className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Popular
                </li>
                {popular.map((country) => (
                  <CountryOption
                    key={`popular-${country.code}`}
                    code={country.code}
                    name={country.name}
                    selected={value === country.code}
                    onSelect={handleSelect}
                  />
                ))}
                {remaining.length > 0 ? (
                  <li className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    All countries
                  </li>
                ) : null}
              </>
            ) : null}

            {remaining.map((country) => (
              <CountryOption
                key={country.code}
                code={country.code}
                name={country.name}
                selected={value === country.code}
                onSelect={handleSelect}
              />
            ))}

            {popular.length === 0 && remaining.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-neutral-500">No countries found</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {value && !getCountryName(value) ? (
        <p className="mt-1 text-xs text-red-600">Select a valid country from the list.</p>
      ) : null}
    </div>
  );
}

function CountryOption({
  code,
  name,
  selected,
  onSelect,
}: {
  code: string;
  name: string;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => onSelect(code)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50",
          selected && "bg-primary-50 text-primary-700",
        )}
      >
        <span>{name}</span>
        <span className="text-xs text-neutral-400">{code}</span>
      </button>
    </li>
  );
}
