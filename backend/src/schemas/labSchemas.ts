import { z } from "zod";

export const biomarkerKeyParamSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Invalid biomarker key"),
});

export const alertIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createManualReadingSchema = z.object({
  biomarkerKey: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Invalid biomarker key"),
  biomarkerName: z.string().min(1).max(200),
  value: z.number().finite(),
  unit: z.string().min(1).max(50),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateManualReadingInput = z.infer<typeof createManualReadingSchema>;
