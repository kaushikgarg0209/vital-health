import Link from "next/link";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { DocumentUploader } from "@/components/health/document-uploader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RecordsUploadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Records", href: "/records" },
            { label: "Upload" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Upload a document</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Add a PDF or image from your device. We&apos;ll process it and add it to your records
            timeline.
          </p>
        </div>
      </div>

      <DocumentUploader variant="large" />

      <p className="text-center text-sm text-neutral-500">
        <Link
          href="/records"
          className={cn(buttonVariants({ variant: "link" }), "text-primary-600")}
        >
          Back to records
        </Link>
      </p>
    </div>
  );
}
