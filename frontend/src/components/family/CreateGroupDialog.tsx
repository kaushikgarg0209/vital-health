"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFamilyApiError, toUserFacingFamilyError } from "@/lib/api/family";
import { useCreateGroup } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
};

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const prevOpenRef = useRef(open);
  const { reset, mutateAsync, isPending } = useCreateGroup();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setName("");
      setError(null);
      reset();
    }
    prevOpenRef.current = open;
  }, [open, reset]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Group name is required.");
      return;
    }

    try {
      const group = await mutateAsync({ name: trimmedName });
      onCreated?.(group.id);
      onOpenChange(false);
    } catch (err) {
      if (isFamilyApiError(err)) {
        setError(toUserFacingFamilyError(err.status, err.code, err.message));
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,24rem)] rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Create family group</h2>
              <p className="text-sm text-neutral-500">Give your group a name your caregivers will recognize.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Dad's care team"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create group"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
