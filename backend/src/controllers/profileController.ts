import type { Request, Response } from "express";
import type { UpdateProfileInput } from "../schemas/profileSchemas.js";
import {
  ProfileError,
  getProfileByUserId,
  upsertProfile,
} from "../services/profileService.js";
import { toProfileResponse } from "../types/profile.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";

function handleProfileError(res: Response, error: unknown, context: string): void {
  if (error instanceof ProfileError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await getProfileByUserId(req.user!.id);

    if (!profile) {
      sendError(res, 404, "Profile not found", "PROFILE_NOT_FOUND");
      return;
    }

    sendSuccess(res, 200, toProfileResponse(profile));
  } catch (error) {
    handleProfileError(res, error, "Get profile");
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await upsertProfile(req.user!.id, req.body as UpdateProfileInput);

    sendSuccess(res, 200, {
      message: "Profile updated.",
      profile: toProfileResponse(profile),
    });
  } catch (error) {
    handleProfileError(res, error, "Update profile");
  }
}
