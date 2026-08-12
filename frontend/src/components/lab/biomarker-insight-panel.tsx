"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isLabApiError, toUserFacingLabError } from "@/lib/api/lab";
import { useBiomarkerInsight } from "@/hooks/useLab";
import { cn } from "@/lib/utils";

type BiomarkerInsightPanelProps = {
  biomarkerKey: string;
  className?: string;
};

function InsightSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-full rounded bg-neutral-100" />
      <div className="h-3 w-11/12 rounded bg-neutral-100" />
      <div className="h-3 w-4/5 rounded bg-neutral-100" />
      <div className="h-3 w-full rounded bg-neutral-100" />
    </div>
  );
}

export function BiomarkerInsightPanel({ biomarkerKey, className }: BiomarkerInsightPanelProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useBiomarkerInsight(
    biomarkerKey,
  );

  const rateLimited =
    isError &&
    isLabApiError(error) &&
    (error.status === 429 || error.code === "RATE_LIMIT_EXCEEDED");

  const errorMessage =
    isError && isLabApiError(error)
      ? toUserFacingLabError(error.status, error.code, error.message)
      : "Unable to load insight.";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-neutral-100 bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-800">AI insight</h3>
            <p className="text-xs text-neutral-400">Educational summary, not medical advice</p>
          </div>
        </div>
        {data?.cached ? (
          <Badge variant="secondary" className="text-xs">
            Cached
          </Badge>
        ) : null}
      </div>

      {isLoading ? <InsightSkeleton /> : null}

      {rateLimited ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-lg")}
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Try again
          </button>
        </div>
      ) : null}

      {isError && !rateLimited ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {data && !isLoading ? (
        <div className="prose prose-sm max-w-none flex-1 text-neutral-600 prose-p:leading-relaxed prose-headings:text-neutral-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.insight}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
