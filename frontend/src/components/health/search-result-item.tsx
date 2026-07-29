import Link from "next/link";
import { FileText } from "lucide-react";
import { HighlightExcerpt } from "@/components/health/highlight-excerpt";
import { ProcessingStatusBadge } from "@/components/health/processing-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDocumentDate, getDocumentTypeLabel } from "@/lib/document-labels";
import type { DocumentSearchResult } from "@/types/document";
import { isProcessingStatus } from "@/types/document";
import { cn } from "@/lib/utils";

type SearchResultItemProps = {
  result: DocumentSearchResult;
  query: string;
  onSelect?: () => void;
  className?: string;
};

export function SearchResultItem({ result, query, onSelect, className }: SearchResultItemProps) {
  const typeLabel = getDocumentTypeLabel(result.documentType);
  const matchTypeLabel = result.matchType === "semantic" ? "Semantic" : "Keyword";

  return (
    <Link
      href={`/records/${result.documentId}`}
      onClick={onSelect}
      role="option"
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary-50/60",
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
        <FileText className="size-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-800">{result.fileName}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {formatDocumentDate(result.documentDate)}
            </p>
          </div>

          {isProcessingStatus(result.processingStatus) ? (
            <ProcessingStatusBadge status={result.processingStatus} />
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
          <HighlightExcerpt excerpt={result.excerpt} query={query} />
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {typeLabel ? (
            <Badge variant="secondary" className="rounded-lg bg-neutral-100 text-neutral-600">
              {typeLabel}
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-lg border-neutral-200 text-neutral-500">
            {matchTypeLabel}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
