"use client";

import Link from "next/link";
import { ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import type { ChatSource } from "@/types/chat";
import { cn } from "@/lib/utils";

type SourceCitationsProps = {
  sources: ChatSource[];
  className?: string;
};

export function SourceCitations({ sources, className }: SourceCitationsProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-3 border-t border-neutral-100 pt-3", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
        Based on your records ({sources.length})
      </button>

      {open ? (
        <ul className="mt-2 space-y-2">
          {sources.map((source) => (
            <li key={`${source.documentId}-${source.chunkIndex}`}>
              <Link
                href={`/records/${source.documentId}`}
                className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2 transition-colors hover:border-primary-100 hover:bg-primary-50/50"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {source.fileName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {source.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
