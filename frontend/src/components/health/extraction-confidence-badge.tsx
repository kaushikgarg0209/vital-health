import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ExtractionConfidenceBadgeProps = {
  confidence: number;
  className?: string;
};

export function ExtractionConfidenceBadge({
  confidence,
  className,
}: ExtractionConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-lg border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700",
        className,
      )}
    >
      AI confidence: {percent}%
    </Badge>
  );
}
