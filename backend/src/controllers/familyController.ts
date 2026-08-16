import type { Request, Response } from "express";
import type { CreateGroupInput, CreateInvitationInput, InvitationTokenInput } from "../schemas/familySchemas.js";
import { buildCaregiverSummary } from "../services/family/caregiverSummaryService.js";
import { buildEmergencyBrief } from "../services/family/emergencyBriefService.js";
import {
  FamilyError,
  createGroup,
  getGroupDetail,
  listGroupsForUser,
  revokeMembership,
  userCanAccessGroup,
} from "../services/family/familyService.js";
import {
  acceptInvitation,
  createInvitation,
  declineInvitation,
} from "../services/family/invitationService.js";
import {
  NotificationError,
  listUnreadNotifications,
  markNotificationRead,
} from "../services/notificationService.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function handleFamilyError(res: Response, error: unknown, context: string): void {
  if (error instanceof FamilyError || error instanceof NotificationError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function listGroupsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await listGroupsForUser(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "List family groups");
  }
}

export async function createGroupHandler(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body as CreateGroupInput;
    const data = await createGroup(req.user!.id, name);
    sendSuccess(res, 201, data);
  } catch (error) {
    handleFamilyError(res, error, "Create family group");
  }
}

export async function getGroupHandler(req: Request, res: Response): Promise<void> {
  try {
    const groupId = getRouteParam(req.params.groupId);
    const data = await getGroupDetail(groupId, req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "Get family group");
  }
}

export async function createInvitationHandler(req: Request, res: Response): Promise<void> {
  try {
    const groupId = getRouteParam(req.params.groupId);
    const { email, permissionLevel } = req.body as CreateInvitationInput;
    const subjectUserId = req.user!.id;

    const canAccess = await userCanAccessGroup(groupId, subjectUserId);

    if (!canAccess) {
      sendError(res, 404, "Group not found or access denied", "GROUP_NOT_FOUND");
      return;
    }

    const data = await createInvitation({
      groupId,
      subjectUserId,
      inviteeEmail: email,
      permissionLevel,
    });

    sendSuccess(res, 201, data);
  } catch (error) {
    handleFamilyError(res, error, "Create family invitation");
  }
}

export async function acceptInvitationHandler(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body as InvitationTokenInput;
    const data = await acceptInvitation(token, req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "Accept family invitation");
  }
}

export async function declineInvitationHandler(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body as InvitationTokenInput;
    await declineInvitation(token, req.user!.id);
    sendSuccess(res, 200, { accepted: false });
  } catch (error) {
    handleFamilyError(res, error, "Decline family invitation");
  }
}

export async function revokeMembershipHandler(req: Request, res: Response): Promise<void> {
  try {
    const membershipId = getRouteParam(req.params.membershipId);
    await revokeMembership(membershipId, req.user!.id);
    sendSuccess(res, 200, { revoked: true });
  } catch (error) {
    handleFamilyError(res, error, "Revoke family membership");
  }
}

export async function getCaregiverSummaryHandler(req: Request, res: Response): Promise<void> {
  try {
    const subjectUserId = getRouteParam(req.params.userId);
    const permissionLevel = req.familyPermission!;

    const data = await buildCaregiverSummary(subjectUserId, permissionLevel);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "Get caregiver summary");
  }
}

export async function getEmergencyBriefHandler(req: Request, res: Response): Promise<void> {
  try {
    const subjectUserId = getRouteParam(req.params.userId);
    const data = await buildEmergencyBrief(subjectUserId);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "Get emergency brief");
  }
}

export async function listNotificationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await listUnreadNotifications(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleFamilyError(res, error, "List notifications");
  }
}

export async function markNotificationReadHandler(req: Request, res: Response): Promise<void> {
  try {
    const notificationId = getRouteParam(req.params.id);
    await markNotificationRead(notificationId, req.user!.id);
    sendSuccess(res, 200, { read: true });
  } catch (error) {
    handleFamilyError(res, error, "Mark notification read");
  }
}
