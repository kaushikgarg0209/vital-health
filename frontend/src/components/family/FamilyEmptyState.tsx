import { Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FamilyEmptyStateProps = {
  onCreateGroup?: () => void;
};

export function FamilyEmptyState({ onCreateGroup }: FamilyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Users className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-800">No family groups yet</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
        Create a group to share your health data with trusted caregivers, or accept an invitation
        when someone invites you to view theirs.
      </p>
      {onCreateGroup ? (
        <button
          type="button"
          onClick={onCreateGroup}
          className={cn(buttonVariants(), "mt-6 rounded-xl")}
        >
          Create your first group
        </button>
      ) : null}
    </div>
  );
}
