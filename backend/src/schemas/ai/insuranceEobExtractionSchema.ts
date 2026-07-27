import { z } from "zod";

const claimStatusSchema = z.enum([
  "approved",
  "partially_approved",
  "denied",
  "pending",
  "appealed",
]);

export const insuranceEobExtractionSchema = z.object({
  claimNumber: z.string().nullable().optional(),
  serviceDate: z.string().nullable().optional(),
  providerName: z.string().nullable().optional(),
  billedAmount: z.number().nullable().optional(),
  insurancePaid: z.number().nullable().optional(),
  patientResponsibility: z.number().nullable().optional(),
  denialReason: z.string().nullable().optional(),
  denialCode: z.string().nullable().optional(),
  claimStatus: claimStatusSchema.nullable().optional(),
  plainLanguageExplanation: z.string().nullable().optional(),
});

export type InsuranceEobExtraction = z.infer<typeof insuranceEobExtractionSchema>;
