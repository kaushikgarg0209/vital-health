import { z } from "zod";

export const prescriptionMedicationSchema = z.object({
  medicationName: z.string().min(1),
  genericName: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  prescribingDoctor: z.string().nullable().optional(),
  prescribedDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const prescriptionExtractionSchema = z.object({
  prescribedDate: z.string().nullable().optional(),
  prescribingDoctor: z.string().nullable().optional(),
  pharmacyName: z.string().nullable().optional(),
  medications: z.array(prescriptionMedicationSchema),
});

export type PrescriptionExtraction = z.infer<typeof prescriptionExtractionSchema>;
