import type { NextFunction, Request, Response } from "express";
import type { PermissionLevel } from "../types/family.js";
import { requireFamilyAccessLevel } from "../services/family/familyAccessService.js";
import { sendError } from "../utils/responseHelpers.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function requireFamilyAccess(minLevel: PermissionLevel) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const groupId = getRouteParam(req.params.groupId);
    const subjectUserId = getRouteParam(req.params.userId);
    const viewerUserId = req.user!.id;

    if (!groupId || !subjectUserId) {
      sendError(res, 400, "Group and member user ID are required", "VALIDATION_ERROR");
      return;
    }

    try {
      const access = await requireFamilyAccessLevel(
        groupId,
        subjectUserId,
        viewerUserId,
        minLevel,
      );

      req.familyPermission = access.permissionLevel;
      req.familyContext = { groupId, subjectUserId };
      next();
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        const familyError = error as Error & { statusCode: number; code: string };
        sendError(res, familyError.statusCode, familyError.message, familyError.code);
        return;
      }

      console.error("Family access check error:", error);
      sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
    }
  };
}
