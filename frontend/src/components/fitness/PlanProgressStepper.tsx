import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanProgressStepperProps = {
  currentWeek: number;
  completedWeeks: number[];
  className?: string;
};

export function PlanProgressStepper({
  currentWeek,
  completedWeeks,
  className,
}: PlanProgressStepperProps) {
  const completedSet = new Set(completedWeeks);

  return (
    <div className={cn("rounded-xl border border-neutral-100 bg-white p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-800">4-week progress</span>
        <span className="text-neutral-500">Week {Math.min(currentWeek, 4)} of 4</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((week) => {
          const isCompleted = completedSet.has(week) || week < currentWeek;
          const isCurrent = week === currentWeek && currentWeek <= 4;

          return (
            <div key={week} className="space-y-2">
              <div
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg border text-sm font-medium",
                  isCompleted && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  isCurrent && !isCompleted && "border-primary-200 bg-primary-50 text-primary-700",
                  !isCompleted && !isCurrent && "border-neutral-200 bg-neutral-50 text-neutral-400",
                )}
              >
                {isCompleted ? <CheckCircle2 className="size-4" /> : `W${week}`}
              </div>
              <p className="text-center text-xs text-neutral-500">
                {isCompleted ? "Done" : isCurrent ? "Current" : "Upcoming"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
