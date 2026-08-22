import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FitnessEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionPending?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  error?: string | null;
  footer?: React.ReactNode;
};

export function FitnessEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionPending = false,
  secondaryActionLabel,
  onSecondaryAction,
  error,
  footer,
}: FitnessEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-800">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-500">{description}</p>

      {error ? (
        <p className="mt-4 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled || actionPending}
          className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-xl")}
        >
          {actionPending ? "Please wait..." : actionLabel}
        </button>
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <button
          type="button"
          onClick={onSecondaryAction}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-xl")}
        >
          {secondaryActionLabel}
        </button>
      ) : null}

      {footer ? <div className="mt-4 max-w-lg text-xs text-neutral-400">{footer}</div> : null}
    </div>
  );
}
