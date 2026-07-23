"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useDocument } from "@/hooks/useDocument";
import { useUploadDocument } from "@/hooks/useUploadDocument";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isProcessingStatus, validateUploadFile } from "@/types/document";
import { cn } from "@/lib/utils";

type DocumentUploaderProps = {
  variant?: "compact" | "large";
  className?: string;
};

export function DocumentUploader({ variant = "compact", className }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successDocumentId, setSuccessDocumentId] = useState<string | null>(null);

  const uploadMutation = useUploadDocument();
  const { data: uploadedDocument } = useDocument(successDocumentId ?? "");

  useEffect(() => {
    if (uploadedDocument?.processingStatus !== "completed") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessDocumentId(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [uploadedDocument?.processingStatus, successDocumentId]);

  const handleFile = useCallback(
    async (file: File) => {
      setValidationError(null);
      setSuccessDocumentId(null);

      const validationMessage = validateUploadFile(file);
      if (validationMessage) {
        setValidationError(validationMessage);
        return;
      }

      try {
        const result = await uploadMutation.mutateAsync(file);
        setSuccessDocumentId(result.documentId);
      } catch (error) {
        if (error instanceof ApiError) {
          setValidationError(error.message);
          return;
        }

        setValidationError("Upload failed. Please try again.");
      }
    },
    [uploadMutation],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }

      event.target.value = "";
    },
    [handleFile],
  );

  const isLarge = variant === "large";
  const isUploading = uploadMutation.isPending;
  const uploadStatus = uploadedDocument?.processingStatus ?? "pending";
  const isUploadProcessing = isProcessingStatus(uploadStatus);

  return (
    <div className={cn("space-y-3", className)}>
      <Card
        className={cn(
          "border-dashed border-neutral-200 bg-neutral-50/50 shadow-none transition-colors",
          isDragging && "border-primary-400 bg-primary-50/60",
          isUploading && "pointer-events-none opacity-80",
        )}
      >
        <CardContent
          className={cn(
            "flex flex-col items-center justify-center text-center",
            isLarge ? "px-6 py-12" : "px-4 py-6",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={onDrop}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white text-primary-600 ring-1 ring-neutral-200",
              isLarge ? "size-16" : "size-12",
            )}
          >
            {isUploading ? (
              <Loader2 className={cn("animate-spin", isLarge ? "size-7" : "size-5")} />
            ) : (
              <UploadCloud className={cn(isLarge ? "size-7" : "size-5")} />
            )}
          </div>

          <div className="mt-4 space-y-1">
            <p className="font-medium text-neutral-800">
              {isUploading ? "Uploading…" : "Drop a health document here"}
            </p>
            <p className="text-sm text-neutral-500">
              PDF, JPG, or PNG up to 20 MB
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl border-neutral-200 bg-white"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={onFileChange}
          />
        </CardContent>
      </Card>

      {validationError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      ) : null}

      {successDocumentId ? (
        uploadStatus === "failed" ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Processing failed</p>
              <p className="mt-1 text-red-700">
                We couldn&apos;t process this document. Try uploading again.
              </p>
              <Link
                href={`/records/${successDocumentId}`}
                className="mt-2 inline-flex font-medium text-red-700 underline-offset-4 hover:underline"
              >
                View details
              </Link>
            </div>
          </div>
        ) : uploadStatus === "completed" ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Document ready</p>
              <Link
                href={`/records/${successDocumentId}`}
                className="mt-1 inline-flex font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                View document
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {isUploadProcessing ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">Uploaded — processing…</p>
              <Link
                href={`/records/${successDocumentId}`}
                className="mt-1 inline-flex font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                View document
              </Link>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
