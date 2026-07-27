import type { DocumentType } from "../types/document.js";
import type { DocumentClassification } from "../schemas/ai/documentClassificationSchema.js";
import type { GenericDocumentExtraction } from "../schemas/ai/genericDocumentExtractionSchema.js";
import type { InsuranceEobExtraction } from "../schemas/ai/insuranceEobExtractionSchema.js";
import type { LabReportExtraction } from "../schemas/ai/labReportExtractionSchema.js";
import type { MedicalBillExtraction } from "../schemas/ai/medicalBillExtractionSchema.js";
import type { PrescriptionExtraction } from "../schemas/ai/prescriptionExtractionSchema.js";

export type { DocumentClassification };
export type { LabReportExtraction };
export type { PrescriptionExtraction };
export type { MedicalBillExtraction };
export type { InsuranceEobExtraction };
export type { GenericDocumentExtraction };

export type LabReportExtractionResult = {
  documentType: "lab_report";
  data: LabReportExtraction;
};

export type PrescriptionExtractionResult = {
  documentType: "prescription";
  data: PrescriptionExtraction;
};

export type MedicalBillExtractionResult = {
  documentType: "medical_bill";
  data: MedicalBillExtraction;
};

export type InsuranceEobExtractionResult = {
  documentType: "insurance_eob";
  data: InsuranceEobExtraction;
};

export type GenericExtractionResult = {
  documentType: Exclude<
    DocumentType,
    "lab_report" | "prescription" | "medical_bill" | "insurance_eob"
  >;
  data: GenericDocumentExtraction;
};

export type DocumentExtractionResult =
  | LabReportExtractionResult
  | PrescriptionExtractionResult
  | MedicalBillExtractionResult
  | InsuranceEobExtractionResult
  | GenericExtractionResult;
