"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { PermissionLevelBadge } from "@/components/family/PermissionLevelBadge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useRevokeMembership } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";
import type { FamilyMembershipDetail } from "@/types/family";

type FamilyMemberRowProps = {
  membership: FamilyMembershipDetail;
  groupId: string;
  variant: "outgoing" | "incoming";
  memberUserId?: string;
  memberName: string;
  canRevoke: boolean;
};

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const localPart = name.split("@")[0] ?? name;
  return localPart.slice(0, 2).toUpperCase();
}

function statusLabel(status: FamilyMembershipDetail["status"]): string {
  switch (status) {
    case "pending":
      return "Invitation sent";
    case "accepted":
      return "Active";
    case "declined":
      return "Declined";
    case "revoked":
      return "Revoked";
    default:
      return status;
  }
}

function statusClass(status: FamilyMembershipDetail["status"]): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "declined":
    case "revoked":
      return "bg-neutral-100 text-neutral-600";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function borderAccent(status: FamilyMembershipDetail["status"]): string {
  switch (status) {
    case "pending":
      return "border-l-4 border-l-amber-400";
    case "accepted":
      return "border-l-4 border-l-emerald-400";
    default:
      return "";
  }
}

export function FamilyMemberRow({
  membership,
  groupId,
  variant,
  memberUserId,
  memberName,
  canRevoke,
}: FamilyMemberRowProps) {
  const revoke = useRevokeMembership(groupId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const subtitle =
    variant === "outgoing"
      ? membership.inviteeEmail ?? membership.viewerName ?? "Unknown"
      : membership.subjectName;

  async function handleRevoke() {
    await revoke.mutateAsync(membership.id);
    setConfirmOpen(false);
  }

  const viewHref =
    variant === "incoming" && memberUserId && membership.status === "accepted"
      ? `/family/${groupId}/member/${memberUserId}`
      : null;

  const revokeLabel =
    variant === "outgoing" ? (membership.inviteeEmail ?? "this person") : memberName;

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm",
          borderAccent(membership.status),
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-primary-50 text-sm font-medium text-primary-700">
              {getInitials(memberName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-neutral-800">{memberName}</p>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  statusClass(membership.status),
                )}
              >
                {statusLabel(membership.status)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
            <div className="mt-2">
              <PermissionLevelBadge level={membership.permissionLevel} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {viewHref ? (
            <Link
              href={viewHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
            >
              <ExternalLink className="size-3.5" />
              View health
            </Link>
          ) : null}

          {canRevoke && membership.status !== "revoked" ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={revoke.isPending}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700",
              )}
              aria-label={`Revoke access for ${memberName}`}
            >
              <Trash2 className="size-3.5" />
              Revoke
            </button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Revoke access?"
        description={`Revoke access for ${revokeLabel}? They will no longer be able to view this health data.`}
        confirmLabel="Revoke access"
        variant="destructive"
        isLoading={revoke.isPending}
        onConfirm={handleRevoke}
      />
    </>
  );
}
