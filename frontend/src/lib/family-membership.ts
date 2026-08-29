import type { FamilyGroupDetail, FamilyMembershipDetail } from "@/types/family";

export function isIncomingPendingInvite(
  membership: FamilyMembershipDetail,
  currentUserId: string,
  currentUserEmail: string,
): boolean {
  if (membership.status !== "pending") {
    return false;
  }

  if (membership.viewerUserId === currentUserId) {
    return true;
  }

  const email = currentUserEmail.trim().toLowerCase();
  if (!email) {
    return false;
  }

  return membership.inviteeEmail?.toLowerCase() === email;
}

export function isOutgoingPendingInvite(
  membership: FamilyMembershipDetail,
  currentUserId: string,
): boolean {
  return membership.status === "pending" && membership.subjectUserId === currentUserId;
}

export function buildGroupCardSubtitle(
  detail: FamilyGroupDetail,
  currentUserId: string,
  currentUserEmail: string,
): string {
  const isOwner = detail.createdBy === currentUserId;

  if (isOwner) {
    const activeCaregivers = detail.memberships.filter(
      (membership) =>
        membership.status === "accepted" && membership.subjectUserId === currentUserId,
    ).length;
    const pendingInvites = detail.memberships.filter((membership) =>
      isOutgoingPendingInvite(membership, currentUserId),
    ).length;

    const parts: string[] = [];

    parts.push(
      `${activeCaregivers} active ${activeCaregivers === 1 ? "caregiver" : "caregivers"}`,
    );

    if (pendingInvites > 0) {
      parts.push(`${pendingInvites} invite${pendingInvites === 1 ? "" : "s"} pending`);
    }

    parts.push("Owner");
    return parts.join(" · ");
  }

  const caregiverMembership = detail.memberships.find(
    (membership) =>
      membership.viewerUserId === currentUserId && membership.status === "accepted",
  );

  if (caregiverMembership) {
    return `Caregiver for ${caregiverMembership.subjectName}`;
  }

  const pendingInvite = detail.memberships.find((membership) =>
    isIncomingPendingInvite(membership, currentUserId, currentUserEmail),
  );

  if (pendingInvite) {
    return `Invitation pending from ${pendingInvite.subjectName}`;
  }

  return "Member";
}
