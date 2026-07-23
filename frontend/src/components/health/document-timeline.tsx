"use client";

import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { DocumentCard } from "@/components/health/document-card";
import { useDocuments } from "@/hooks/useDocuments";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ListDocumentsQuery } from "@/types/document";
import { cn } from "@/lib/utils";

type DocumentTimelineProps = {
  query?: ListDocumentsQuery;
};

function DocumentTimelineSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border-neutral-100 shadow-none">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="size-10 animate-pulse rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DocumentTimeline({ query }: DocumentTimelineProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useDocuments(query);

  if (isLoading) {
    return <DocumentTimelineSkeleton />;
  }

  if (isError) {
    return (
      <Card className="border-red-100 shadow-none">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load documents."}
          </p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => void refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const documents = data?.documents ?? [];

  if (documents.length === 0) {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <FileText className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-medium text-neutral-800">No records yet</h3>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            Upload your first lab report, prescription, or medical bill to start building your
            health timeline.
          </p>
          <Link
            href="/records/upload"
            className={cn(buttonVariants(), "mt-5 rounded-xl")}
          >
            Upload your first document
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching ? (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Loader2 className="size-3 animate-spin" />
          Refreshing…
        </div>
      ) : null}

      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
