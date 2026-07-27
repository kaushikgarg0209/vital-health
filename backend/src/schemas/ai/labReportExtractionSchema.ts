import { z } from "zod";

const testStatusSchema = z.enum([
  "normal",
  "borderline",
  "concerning",
  "critical",
  "unknown",
]);

export const labTestSchema = z.object({
  testName: z.string().min(1),
  biomarkerKey: z.string().nullable().optional(),
  value: z.union([z.string(), z.number()]).nullable().optional(),
  unit: z.string().nullable().optional(),
  referenceRangeLow: z.number().nullable().optional(),
  referenceRangeHigh: z.number().nullable().optional(),
  status: testStatusSchema.optional(),
});

export const labReportExtractionSchema = z.object({
  reportDate: z.string().nullable().optional(),
  labName: z.string().nullable().optional(),
  orderingDoctor: z.string().nullable().optional(),
  tests: z.array(labTestSchema),
});

export type LabReportExtraction = z.infer<typeof labReportExtractionSchema>;
