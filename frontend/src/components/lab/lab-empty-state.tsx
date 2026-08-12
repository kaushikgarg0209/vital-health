import Link from "next/link";
import { FlaskConical, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LabEmptyStateProps = {
  onLogManual?: () => void;
};

export function LabEmptyState({ onLogManual }: LabEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <FlaskConical className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-800">No biomarkers tracked yet</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
        Upload a lab report and Vital will extract your results automatically. You can also log
        values manually from at-home tests or clinic visits.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/records/upload"
          className={cn(buttonVariants(), "rounded-xl")}
        >
          <Upload className="size-4" />
          Upload lab report
        </Link>
        {onLogManual ? (
          <button
            type="button"
            onClick={onLogManual}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Log manually
          </button>
        ) : null}
      </div>
    </div>
  );
}
