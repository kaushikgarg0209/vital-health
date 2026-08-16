import { z } from "zod";

export const permissionLevelSchema = z.enum(["full", "monitor", "emergency"]);

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(100),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid(),
});

export const membershipIdParamSchema = z.object({
  membershipId: z.string().uuid(),
});

export const groupMemberParamSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const createInvitationSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  permissionLevel: permissionLevelSchema.default("monitor"),
});

export const invitationTokenSchema = z.object({
  token: z.string().uuid("Invalid invitation token"),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationTokenInput = z.infer<typeof invitationTokenSchema>;
