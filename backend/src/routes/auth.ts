import { Router } from "express";
import { register } from "../controllers/authController.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema } from "../schemas/authSchemas.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);

export default router;
