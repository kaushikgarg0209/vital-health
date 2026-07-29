"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { SearchResultItem } from "@/components/health/search-result-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearchDocuments } from "@/hooks/useSearchDocuments";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  variant?: "default" | "compact";
  className?: string;
  placeholder?: string;
};

function SearchResultsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-3 py-3">
          <div className="size-9 animate-pulse rounded-lg bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchDropdown({
  query,
  debouncedQuery,
  isOpen,
  listboxId,
  onClose,
}: {
  query: string;
  debouncedQuery: string;
  isOpen: boolean;
  listboxId: string;
  onClose: () => void;
}) {
  const { data, isPending, isFetching, isError, error, refetch } = useSearchDocuments(
    debouncedQuery,
    { limit: 8 },
  );

  if (!isOpen) {
    return null;
  }

  const isQuerySyncing = query.trim() !== debouncedQuery.trim();
  const showLoading = isQuerySyncing || isPending || isFetching;

  return (
    <div
      id={listboxId}
      role="listbox"
      className="absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
    >
      {showLoading ? <SearchResultsSkeleton /> : null}

      {!showLoading && isError ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Search failed."}
          </p>
          <Button variant="outline" className="mt-3 rounded-xl" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {!showLoading && !isError && (data?.length ?? 0) === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-neutral-500">No results. Try different keywords.</p>
        </div>
      ) : null}

      {!showLoading && !isError && (data?.length ?? 0) > 0 ? (
        <div className="max-h-80 overflow-y-auto p-1">
          {data?.map((result) => (
            <SearchResultItem
              key={result.documentId}
              result={result}
              query={debouncedQuery}
              onSelect={onClose}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SearchBar({
  variant = "default",
  className,
  placeholder = "Search your health records…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const debouncedQuery = useDebouncedValue(query, 500);

  const isCompact = variant === "compact";
  const showInput = !isCompact || isExpanded;
  const isOpen = showInput && isFocused && query.trim().length >= 1;

  useEffect(() => {
    if (!isOpen && !isExpanded) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
        setIsExpanded(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFocused(false);
        setIsExpanded(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isExpanded]);

  function handleClose() {
    setIsFocused(false);
    setIsExpanded(false);
  }

  function handleExpand() {
    setIsExpanded(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {isCompact && !isExpanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
          aria-label="Open search"
        >
          <Search className="size-4" />
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              window.setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  setIsFocused(false);
                }
              }, 150);
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className={cn(
              "h-10 rounded-xl border-neutral-200 bg-white pr-10 pl-10 text-sm shadow-none",
              isCompact && isExpanded && "w-[min(18rem,calc(100vw-5rem))]",
            )}
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : isFetchingIndicator(query, debouncedQuery) ? (
            <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
          ) : null}
        </div>
      )}

      {isCompact && isExpanded ? (
        <SearchDropdown
          query={query}
          debouncedQuery={debouncedQuery}
          isOpen={isOpen}
          listboxId={listboxId}
          onClose={handleClose}
        />
      ) : !isCompact ? (
        <SearchDropdown
          query={query}
          debouncedQuery={debouncedQuery}
          isOpen={isOpen}
          listboxId={listboxId}
          onClose={handleClose}
        />
      ) : null}
    </div>
  );
}

function isFetchingIndicator(query: string, debouncedQuery: string): boolean {
  return query.trim().length >= 1 && query.trim() !== debouncedQuery.trim();
}
