import { z } from "zod";

const documentTypeSchema = z.enum([
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

const processingStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: documentTypeSchema.optional(),
  status: processingStatusSchema.optional(),
  tag: z.string().trim().min(1).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  sort: z.enum(["date_desc", "date_asc"]).default("date_desc"),
});

export const searchDocumentsQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required"),
  type: documentTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const updateDocumentSchema = z.object({
  documentType: documentTypeSchema.optional(),
  documentDate: dateStringSchema.nullable().optional(),
  institutionName: z.string().trim().min(1).optional(),
  doctorName: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  notes: z.string().trim().optional(),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type SearchDocumentsQuery = z.infer<typeof searchDocumentsQuerySchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
