import { z } from "zod";

export const billLineItemSchema = z.object({
  procedureCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  serviceDate: z.string().nullable().optional(),
  billedAmount: z.number().nullable().optional(),
});

export const medicalBillExtractionSchema = z.object({
  providerName: z.string().nullable().optional(),
  serviceDate: z.string().nullable().optional(),
  totalBilled: z.number().nullable().optional(),
  insurancePaid: z.number().nullable().optional(),
  amountDue: z.number().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  lineItems: z.array(billLineItemSchema),
});

export type MedicalBillExtraction = z.infer<typeof medicalBillExtractionSchema>;
