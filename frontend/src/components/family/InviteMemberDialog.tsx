"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { PermissionLevelBadge } from "@/components/family/PermissionLevelBadge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFamilyApiError, toUserFacingFamilyError } from "@/lib/api/family";
import { useCreateInvitation } from "@/hooks/useFamily";
import { permissionLevelTokens, type PermissionLevel } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const PERMISSION_LEVELS: PermissionLevel[] = ["monitor", "emergency", "full"];

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
};

export function InviteMemberDialog({ open, onOpenChange, groupId }: InviteMemberDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const prevOpenRef = useRef(open);
  const { reset, mutateAsync, isPending } = useCreateInvitation(groupId);

  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("monitor");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setEmail("");
      setPermissionLevel("monitor");
      setError(null);
      setSuccessMessage(null);
      reset();
    }
    prevOpenRef.current = open;
  }, [open, reset]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      await mutateAsync({ email: trimmedEmail, permissionLevel });
      setSuccessMessage(`Invitation sent to ${trimmedEmail}.`);
      setEmail("");
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
      className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,28rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Invite a caregiver</h2>
              <p className="text-sm text-neutral-500">
                Send someone access to view your health information.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="caregiver@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-neutral-800">Permission level</legend>
            {PERMISSION_LEVELS.map((level) => {
              const token = permissionLevelTokens[level];
              const selected = permissionLevel === level;

              return (
                <label
                  key={level}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                    selected
                      ? "border-primary-300 bg-primary-50/50"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <input
                    type="radio"
                    name="permissionLevel"
                    value={level}
                    checked={selected}
                    onChange={() => setPermissionLevel(level)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <PermissionLevelBadge level={level} />
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                      {token.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </fieldset>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            {successMessage ? "Done" : "Cancel"}
          </button>
          {!successMessage ? (
            <button
              type="submit"
              disabled={isPending}
              className={cn(buttonVariants(), "rounded-xl")}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send invitation"
              )}
            </button>
          ) : null}
        </div>
      </form>
    </dialog>
  );
}
