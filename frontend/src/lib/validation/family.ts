import { z } from "zod";

export const inviteEmailSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type InviteEmailValues = z.infer<typeof inviteEmailSchema>;
