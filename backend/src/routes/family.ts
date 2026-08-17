import { Router } from "express";
import {
  acceptInvitationHandler,
  createGroupHandler,
  createInvitationHandler,
  declineInvitationHandler,
  deleteGroupHandler,
  getCaregiverSummaryHandler,
  getEmergencyBriefHandler,
  getGroupHandler,
  listGroupsHandler,
  listNotificationsHandler,
  markNotificationReadHandler,
  revokeMembershipHandler,
} from "../controllers/familyController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireFamilyAccess } from "../middleware/familyAccess.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  createGroupSchema,
  createInvitationSchema,
  groupIdParamSchema,
  groupMemberParamSchema,
  invitationTokenSchema,
  membershipIdParamSchema,
  notificationIdParamSchema,
} from "../schemas/familySchemas.js";

const router = Router();

router.get("/groups", requireAuth, listGroupsHandler);
router.post("/groups", requireAuth, validateBody(createGroupSchema), createGroupHandler);

router.get(
  "/groups/:groupId",
  requireAuth,
  validateParams(groupIdParamSchema),
  getGroupHandler,
);

router.delete(
  "/groups/:groupId",
  requireAuth,
  validateParams(groupIdParamSchema),
  deleteGroupHandler,
);

router.post(
  "/groups/:groupId/invitations",
  requireAuth,
  validateParams(groupIdParamSchema),
  validateBody(createInvitationSchema),
  createInvitationHandler,
);

router.post(
  "/invitations/accept",
  requireAuth,
  validateBody(invitationTokenSchema),
  acceptInvitationHandler,
);

router.post(
  "/invitations/decline",
  requireAuth,
  validateBody(invitationTokenSchema),
  declineInvitationHandler,
);

router.delete(
  "/memberships/:membershipId",
  requireAuth,
  validateParams(membershipIdParamSchema),
  revokeMembershipHandler,
);

router.get(
  "/groups/:groupId/members/:userId/summary",
  requireAuth,
  validateParams(groupMemberParamSchema),
  requireFamilyAccess("monitor"),
  getCaregiverSummaryHandler,
);

router.get(
  "/groups/:groupId/members/:userId/emergency-brief",
  requireAuth,
  validateParams(groupMemberParamSchema),
  requireFamilyAccess("emergency"),
  getEmergencyBriefHandler,
);

router.get("/notifications", requireAuth, listNotificationsHandler);

router.patch(
  "/notifications/:id/read",
  requireAuth,
  validateParams(notificationIdParamSchema),
  markNotificationReadHandler,
);

export default router;
