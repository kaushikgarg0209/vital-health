import type { BiomarkerStatus } from "@/types/health";

export type PaymentStatus = "pending" | "paid" | "disputed" | "payment_plan" | "written_off";

export type ClaimStatus =
  | "approved"
  | "partially_approved"
  | "denied"
  | "pending"
  | "appealed";

export type LabReportSummary = {
  id: string;
  reportDate: string | null;
  labName: string | null;
  orderingDoctor: string | null;
};

export type BiomarkerReadingDetail = {
  id: string;
  biomarkerKey: string;
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  referenceRangeText: string | null;
  status: BiomarkerStatus | null;
  readingDate: string;
};

export type PrescriptionMedication = {
  id: string;
  medicationName: string;
  genericName: string | null;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  prescribingDoctor: string | null;
  prescribedDate: string | null;
  isActive: boolean;
  notes: string | null;
};

export type MedicalBillSummary = {
  id: string;
  providerName: string | null;
  serviceDate: string | null;
  totalBilled: number | null;
  insurancePaid: number | null;
  amountDue: number | null;
  dueDate: string | null;
  paymentStatus: PaymentStatus;
  hasDiscrepancy: boolean;
};

export type BillLineItem = {
  id: string;
  procedureCode: string | null;
  description: string | null;
  serviceDate: string | null;
  billedAmount: number | null;
};

export type EobSummary = {
  id: string;
  claimNumber: string | null;
  serviceDate: string | null;
  providerName: string | null;
  billedAmount: number | null;
  insurancePaid: number | null;
  patientResponsibility: number | null;
  denialReason: string | null;
  denialCode: string | null;
  claimStatus: ClaimStatus | null;
  plainLanguageExplanation: string | null;
};

export type LabReportExtractedData = {
  type: "lab_report";
  labReport: LabReportSummary;
  readings: BiomarkerReadingDetail[];
};

export type PrescriptionExtractedData = {
  type: "prescription";
  medications: PrescriptionMedication[];
};

export type MedicalBillExtractedData = {
  type: "medical_bill";
  bill: MedicalBillSummary;
  lineItems: BillLineItem[];
};

export type InsuranceEobExtractedData = {
  type: "insurance_eob";
  eob: EobSummary;
};

export type DocumentExtractedData =
  | LabReportExtractedData
  | PrescriptionExtractedData
  | MedicalBillExtractedData
  | InsuranceEobExtractedData;
