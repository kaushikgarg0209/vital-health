"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { DocumentViewer } from "@/components/health/document-viewer";
import { ProcessingStatusBadge } from "@/components/health/processing-status-badge";
import { useDocument } from "@/hooks/useDocument";
import { deleteDocument } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/types/document";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPE_LABELS = {
  lab_report: "Lab report",
  prescription: "Prescription",
  discharge_summary: "Discharge summary",
  imaging_report: "Imaging report",
  medical_bill: "Medical bill",
  insurance_eob: "Insurance EOB",
  insurance_policy: "Insurance policy",
  vaccination_record: "Vaccination record",
  other: "Other",
} as const;

type DocumentDetailViewProps = {
  documentId: string;
};

function formatDocumentDate(date: string | null): string {
  if (!date) {
    return "Unknown";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DocumentDetailView({ documentId }: DocumentDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: document, isLoading, isError, error } = useDocument(documentId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteDocument(documentId);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push("/records");
      router.refresh();
    } catch (deleteErr) {
      if (deleteErr instanceof ApiError) {
        setDeleteError(deleteErr.message);
      } else {
        setDeleteError("Failed to delete document.");
      }
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Records", href: "/records" },
            { label: "Document" },
          ]}
        />
        <Card className="border-red-100 shadow-none">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Document not found."}
            </p>
            <Link
              href="/records"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 rounded-xl")}
            >
              Back to records
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeLabel = document.documentType
    ? DOCUMENT_TYPE_LABELS[document.documentType]
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Records", href: "/records" },
            { label: document.fileName },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-neutral-800">{document.fileName}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Uploaded {new Date(document.createdAt).toLocaleDateString()} ·{" "}
              {formatFileSize(document.fileSizeBytes)}
            </p>
          </div>
          <ProcessingStatusBadge status={document.processingStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DocumentViewer document={document} />

        <div className="space-y-4">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-neutral-800">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Type</p>
                <p className="mt-1 text-neutral-700">
                  {typeLabel ? (
                    <Badge variant="secondary" className="rounded-lg bg-neutral-100 text-neutral-600">
                      {typeLabel}
                    </Badge>
                  ) : (
                    "Not classified yet"
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Document date
                </p>
                <p className="mt-1 text-neutral-700">{formatDocumentDate(document.documentDate)}</p>
              </div>

              {document.institutionName ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Institution
                  </p>
                  <p className="mt-1 text-neutral-700">{document.institutionName}</p>
                </div>
              ) : null}

              {document.doctorName ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Doctor
                  </p>
                  <p className="mt-1 text-neutral-700">{document.doctorName}</p>
                </div>
              ) : null}

              {document.tags.length > 0 ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-lg">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {document.notes ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Notes</p>
                  <p className="mt-1 text-neutral-700">{document.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-none">
            <CardContent className="space-y-3 py-4">
              {deleteError ? (
                <p className="text-sm text-red-600">{deleteError}</p>
              ) : null}

              {showConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">
                    Delete this document permanently? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      disabled={isDeleting}
                      onClick={() => void handleDelete()}
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={isDeleting}
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={() => setShowConfirm(true)}
                >
                  <Trash2 className="size-4" />
                  Delete document
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
