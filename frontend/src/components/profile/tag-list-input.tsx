"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TagListInputProps = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
};

export function TagListInput({
  id,
  label,
  description,
  placeholder = "Type and press Enter",
  values,
  onChange,
  suggestions = [],
}: TagListInputProps) {
  const [draft, setDraft] = useState("");

  function addValue(raw: string) {
    const trimmed = raw.trim();

    if (!trimmed || values.some((value) => value.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }

    onChange([...values, trimmed]);
    setDraft("");
  }

  function removeValue(index: number) {
    onChange(values.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addValue(draft);
    }

    if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  const unusedSuggestions = suggestions.filter(
    (suggestion) => !values.some((value) => value.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </Label>
        {description ? <p className="text-sm text-neutral-400">{description}</p> : null}
      </div>

      <div
        className={cn(
          "rounded-xl border border-neutral-200 bg-white px-3 py-2.5 transition-colors focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100",
        )}
      >
        {values.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {values.map((value, index) => (
              <Badge
                key={`${value}-${index}`}
                variant="secondary"
                className="gap-1 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-1 text-sm font-normal text-primary-800"
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(index)}
                  className="rounded-sm text-primary-500 hover:text-primary-700"
                  aria-label={`Remove ${value}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              addValue(draft);
            }
          }}
          placeholder={placeholder}
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {unusedSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unusedSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addValue(suggestion)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
