import Link from "next/link";
import { FileText } from "lucide-react";
import { ProcessingStatusBadge } from "@/components/health/processing-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@/types/document";
import { formatFileSize } from "@/types/document";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPE_LABELS: Record<NonNullable<Document["documentType"]>, string> = {
  lab_report: "Lab report",
  prescription: "Prescription",
  discharge_summary: "Discharge summary",
  imaging_report: "Imaging report",
  medical_bill: "Medical bill",
  insurance_eob: "Insurance EOB",
  insurance_policy: "Insurance policy",
  vaccination_record: "Vaccination record",
  other: "Other",
};

function formatDocumentDate(date: string | null): string {
  if (!date) {
    return "Date unknown";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type DocumentCardProps = {
  document: Document;
  className?: string;
};

export function DocumentCard({ document, className }: DocumentCardProps) {
  const typeLabel = document.documentType
    ? DOCUMENT_TYPE_LABELS[document.documentType]
    : null;

  return (
    <Link href={`/records/${document.id}`} className={cn("block", className)}>
      <Card className="border-neutral-100 shadow-none transition-colors hover:border-primary-200 hover:bg-primary-50/30">
        <CardContent className="flex items-start gap-4 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <FileText className="size-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-800">{document.fileName}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {formatDocumentDate(document.documentDate)} · {formatFileSize(document.fileSizeBytes)}
                </p>
              </div>
              <ProcessingStatusBadge status={document.processingStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {typeLabel ? (
                <Badge variant="secondary" className="rounded-lg bg-neutral-100 text-neutral-600">
                  {typeLabel}
                </Badge>
              ) : null}
              {document.institutionName ? (
                <span className="truncate text-xs text-neutral-500">{document.institutionName}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
