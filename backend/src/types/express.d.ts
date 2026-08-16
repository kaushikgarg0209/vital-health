import type { AuthUser } from "./auth.js";
import type { PermissionLevel } from "./family.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validatedQuery?: unknown;
      familyPermission?: PermissionLevel;
      familyContext?: { groupId: string; subjectUserId: string };
    }
  }
}

export {};
