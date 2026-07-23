import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProcessingStatus } from "@/types/document";

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    variant: "outline",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    variant: "outline",
  },
  completed: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    variant: "outline",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    variant: "destructive",
  },
};

type ProcessingStatusBadgeProps = {
  status: ProcessingStatus;
  className?: string;
};

export function ProcessingStatusBadge({ status, className }: ProcessingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn("rounded-lg border px-2 py-0.5 text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
