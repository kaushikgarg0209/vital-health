import { z } from "zod";

export const genericDocumentExtractionSchema = z.object({
  documentDate: z.string().nullable().optional(),
  institutionName: z.string().nullable().optional(),
  doctorName: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export type GenericDocumentExtraction = z.infer<typeof genericDocumentExtractionSchema>;
