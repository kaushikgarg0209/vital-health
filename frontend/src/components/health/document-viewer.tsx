"use client";

import { Loader2 } from "lucide-react";
import type { DocumentDetail } from "@/types/document";

type DocumentViewerProps = {
  document: DocumentDetail;
};

export function DocumentViewer({ document }: DocumentViewerProps) {
  const { signedUrl, fileMimeType, processingStatus } = document;

  if (processingStatus === "pending" || processingStatus === "processing") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
        <Loader2 className="size-8 animate-spin text-primary-600" />
        <p className="mt-4 font-medium text-neutral-800">Processing your document…</p>
        <p className="mt-2 max-w-md text-sm text-neutral-500">
          This usually takes a few seconds. The preview will appear here when processing is
          complete.
        </p>
      </div>
    );
  }

  if (processingStatus === "failed") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="font-medium text-red-800">Processing failed</p>
        <p className="mt-2 max-w-md text-sm text-red-700">
          We couldn&apos;t process this document. Try uploading it again or contact support if the
          problem continues.
        </p>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center text-sm text-neutral-500">
        Preview unavailable.
      </div>
    );
  }

  if (fileMimeType.startsWith("image/")) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt={document.fileName}
          className="mx-auto max-h-[70vh] w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
      <iframe
        src={signedUrl}
        title={document.fileName}
        className="h-[70vh] w-full bg-white"
      />
    </div>
  );
}
