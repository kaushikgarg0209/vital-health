"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { PermissionLevelBadge } from "@/components/family/PermissionLevelBadge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import { isFamilyApiError, toUserFacingFamilyError } from "@/lib/api/family";
import { useAcceptInvitation, useDeclineInvitation } from "@/hooks/useFamily";
import { permissionLevelTokens, type PermissionLevel } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type InvitationPanelState =
  | { kind: "missing_token" }
  | { kind: "pending" }
  | { kind: "accepting" }
  | { kind: "declining" }
  | { kind: "accepted"; groupId: string }
  | { kind: "declined" }
  | { kind: "error"; message: string; title: string };

type FamilyInvitationPanelProps = {
  token: string | null;
  /** Optional context from in-app notification metadata */
  hint?: {
    subjectName?: string;
    permissionLevel?: PermissionLevel;
  };
};

export function FamilyInvitationPanel({ token, hint }: FamilyInvitationPanelProps) {
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const [state, setState] = useState<InvitationPanelState>(() =>
    token ? { kind: "pending" } : { kind: "missing_token" },
  );
  const [declineConfirmOpen, setDeclineConfirmOpen] = useState(false);

  async function handleAccept() {
    if (!token) {
      return;
    }

    setState({ kind: "accepting" });

    try {
      const result = await acceptMutation.mutateAsync({ token });
      setState({ kind: "accepted", groupId: result.groupId });
    } catch (error) {
      if (isFamilyApiError(error)) {
        setState({
          kind: "error",
          title: error.code === "INVITATION_EXPIRED" ? "Invitation expired" : "Unable to accept",
          message: toUserFacingFamilyError(error.status, error.code, error.message),
        });
      } else {
        setState({
          kind: "error",
          title: "Unable to accept",
          message: "Something went wrong. Please try again.",
        });
      }
    }
  }

  async function handleDecline() {
    if (!token) {
      return;
    }

    setState({ kind: "declining" });
    setDeclineConfirmOpen(false);

    try {
      await declineMutation.mutateAsync({ token });
      setState({ kind: "declined" });
    } catch (error) {
      if (isFamilyApiError(error)) {
        setState({
          kind: "error",
          title: "Unable to decline",
          message: toUserFacingFamilyError(error.status, error.code, error.message),
        });
      } else {
        setState({
          kind: "error",
          title: "Unable to decline",
          message: "Something went wrong. Please try again.",
        });
      }
    }
  }

  if (state.kind === "missing_token") {
    return (
      <InvitationShell title="Invalid invitation link" description="This link is missing required information.">
        <ErrorBanner message="Ask the person who invited you to resend the invitation email." />
        <Link href="/family" className={cn(buttonVariants(), "mt-6 w-full rounded-xl")}>
          Go to Family
        </Link>
      </InvitationShell>
    );
  }

  if (state.kind === "accepted") {
    return (
      <InvitationShell
        title="You're connected"
        description="You now have access to this family health group."
      >
        <SuccessBanner message="Invitation accepted successfully. You can view shared health information from the group page." />
        <div className="mt-6 space-y-3">
          <Link
            href={`/family/${state.groupId}`}
            className={cn(buttonVariants({ size: "lg" }), "h-11 w-full rounded-xl bg-primary-600 hover:bg-primary-700")}
          >
            View family group
          </Link>
          <Link
            href="/family"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 w-full rounded-xl")}
          >
            All family groups
          </Link>
        </div>
      </InvitationShell>
    );
  }

  if (state.kind === "declined") {
    return (
      <InvitationShell
        title="Invitation declined"
        description="You chose not to join this family health group."
      >
        <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-neutral-500" />
          <p className="text-sm leading-relaxed text-neutral-600">
            No access was granted. If this was a mistake, ask the person to send a new invitation.
          </p>
        </div>
        <Link
          href="/family"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 w-full rounded-xl bg-primary-600 hover:bg-primary-700")}
        >
          Go to Family
        </Link>
      </InvitationShell>
    );
  }

  if (state.kind === "error") {
    return (
      <InvitationShell title={state.title} description="We couldn't complete this invitation.">
        <ErrorBanner message={state.message} />
        <div className="mt-6 space-y-3">
          <Link href="/family" className={cn(buttonVariants(), "h-11 w-full rounded-xl")}>
            Go to Family
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full rounded-xl")}
          >
            Back to dashboard
          </Link>
        </div>
      </InvitationShell>
    );
  }

  const isBusy = state.kind === "accepting" || state.kind === "declining";
  const inviterLabel = hint?.subjectName ?? "A family member";

  return (
    <InvitationShell
      title="Family health invitation"
      description={`${inviterLabel} invited you to view their health information.`}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-4">
          <UserPlus className="mt-0.5 size-5 shrink-0 text-primary-600" />
          <div className="text-sm leading-relaxed text-primary-900">
            <p>
              Accepting gives you caregiver access according to the permission level chosen by the
              person who invited you. You can revoke access at any time from your settings.
            </p>
          </div>
        </div>

        {hint?.permissionLevel ? (
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">Access level</p>
            <PermissionLevelBadge level={hint.permissionLevel} showDescription />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-800">Permission levels explained</p>
            {(["monitor", "emergency", "full"] as PermissionLevel[]).map((level) => (
              <div key={level} className="rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2">
                <PermissionLevelBadge level={level} />
                <p className="mt-1 text-xs text-neutral-500">
                  {permissionLevelTokens[level].description}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={isBusy}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 flex-1 rounded-xl bg-primary-600 hover:bg-primary-700",
            )}
          >
            {state.kind === "accepting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Accept invitation
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setDeclineConfirmOpen(true)}
            disabled={isBusy}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 flex-1 rounded-xl")}
          >
            {state.kind === "declining" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Declining...
              </>
            ) : (
              "Decline"
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={declineConfirmOpen}
        onOpenChange={setDeclineConfirmOpen}
        title="Decline invitation?"
        description="Decline this invitation? You will not be able to view this person's health data unless they invite you again."
        confirmLabel="Decline invitation"
        variant="destructive"
        isLoading={state.kind === "declining"}
        onConfirm={handleDecline}
      />
    </InvitationShell>
  );
}

function InvitationShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      <p className="text-sm leading-relaxed text-emerald-800">{message}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
      <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
      <p className="text-sm leading-relaxed text-red-700">{message}</p>
    </div>
  );
}
