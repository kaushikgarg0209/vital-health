import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { DocumentTimeline } from "@/components/health/document-timeline";
import { DocumentUploader } from "@/components/health/document-uploader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RecordsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Records" },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Health records</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Upload lab reports, prescriptions, and medical bills. Vital will organize them into
              your health timeline.
            </p>
          </div>

          <Link
            href="/records/upload"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden shrink-0 rounded-xl border-neutral-200 bg-white sm:inline-flex",
            )}
          >
            Upload page
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700">Quick upload</h2>
        <DocumentUploader variant="compact" />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-700">Timeline</h2>
        <DocumentTimeline />
      </section>
    </div>
  );
}
