import { z } from "zod";

const dateStringSchema = z
  .string()
  .min(1, "Date of birth is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
    message: "Date of birth cannot be in the future",
  });

const optionalNumberString = (min: number, max: number, label: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || (Number(value) >= min && Number(value) <= max),
      `${label} must be between ${min} and ${max}`,
    );

export const profileStep1Schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  dateOfBirth: dateStringSchema,
  biologicalSex: z.enum(["male", "female", "other"], {
    message: "Please select biological sex",
  }),
});

export const profileStep2Schema = z.object({
  heightCm: optionalNumberString(50, 300, "Height"),
  weightKg: optionalNumberString(20, 500, "Weight"),
  bloodType: z
    .string()
    .refine(
      (value) => value === "" || /^(A|B|AB|O)[+-]$/i.test(value),
      "Use a format like A+, O-, or AB+",
    ),
});

export const profileStep3Schema = z.object({
  knownConditions: z.array(z.string()),
  allergies: z.array(z.string()),
  currentMedications: z.array(z.string()),
});

export const profileFormSchema = profileStep1Schema
  .extend(profileStep2Schema.shape)
  .extend(profileStep3Schema.shape);

export type ProfileStep1Values = z.infer<typeof profileStep1Schema>;
export type ProfileStep2Values = z.infer<typeof profileStep2Schema>;
export type ProfileStep3Values = z.infer<typeof profileStep3Schema>;
export type ProfileFormSchemaValues = z.infer<typeof profileFormSchema>;
