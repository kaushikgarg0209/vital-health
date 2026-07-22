import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/profileSchemas.js";

const router = Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, validateBody(updateProfileSchema), updateProfile);

export default router;
