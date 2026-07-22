import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Invalid date")
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
    message: "Date of birth cannot be in the future",
  });

const stringArraySchema = z.array(z.string().trim().min(1, "Items cannot be empty"));

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  dateOfBirth: dateStringSchema.nullable().optional(),
  biologicalSex: z.enum(["male", "female", "other"]).nullable().optional(),
  heightCm: z.number().min(50, "Height must be at least 50 cm").max(300).nullable().optional(),
  weightKg: z.number().min(20, "Weight must be at least 20 kg").max(500).nullable().optional(),
  bloodType: z
    .string()
    .trim()
    .regex(/^(A|B|AB|O)[+-]$/i, "Blood type must be like A+, O-, AB+")
    .nullable()
    .optional(),
  knownConditions: stringArraySchema.optional(),
  allergies: stringArraySchema.optional(),
  currentMedications: stringArraySchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
