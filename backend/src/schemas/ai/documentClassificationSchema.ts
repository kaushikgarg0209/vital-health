import { z } from "zod";

export const documentTypeSchema = z.enum([
  "lab_report",
  "prescription",
  "discharge_summary",
  "imaging_report",
  "medical_bill",
  "insurance_eob",
  "insurance_policy",
  "vaccination_record",
  "other",
]);

export const documentClassificationSchema = z.object({
  type: documentTypeSchema,
  confidence: z.number().min(0).max(1),
});

export type DocumentClassification = z.infer<typeof documentClassificationSchema>;
