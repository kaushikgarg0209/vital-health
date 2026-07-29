import type { DocumentType, ProcessingStatus } from "./document.js";

export type BiomarkerStatus = "normal" | "borderline" | "concerning" | "critical";

export type PaymentStatus = "pending" | "paid" | "disputed" | "payment_plan" | "written_off";

export type ClaimStatus =
  | "approved"
  | "partially_approved"
  | "denied"
  | "pending"
  | "appealed";

export type LabReportRow = {
  id: string;
  document_id: string;
  user_id: string;
  report_date: string | null;
  lab_name: string | null;
  ordering_doctor: string | null;
  created_at: string;
};

export type BiomarkerReadingRow = {
  id: string;
  user_id: string;
  lab_report_id: string | null;
  biomarker_key: string;
  biomarker_name: string;
  value: number | string;
  unit: string;
  reference_range_low: number | string | null;
  reference_range_high: number | string | null;
  reference_range_text: string | null;
  status: BiomarkerStatus | null;
  reading_date: string;
  source: "lab_report" | "manual";
  notes: string | null;
  created_at: string;
};

export type PrescriptionRow = {
  id: string;
  document_id: string | null;
  user_id: string;
  medication_name: string;
  generic_name: string | null;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  prescribing_doctor: string | null;
  prescribed_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

export type MedicalBillRow = {
  id: string;
  document_id: string;
  user_id: string;
  provider_name: string | null;
  service_date: string | null;
  total_billed: number | string | null;
  insurance_paid: number | string | null;
  amount_due: number | string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  has_discrepancy: boolean;
  discrepancy_note: string | null;
  created_at: string;
};

export type BillLineItemRow = {
  id: string;
  bill_id: string;
  user_id: string;
  procedure_code: string | null;
  description: string | null;
  service_date: string | null;
  billed_amount: number | string | null;
  plain_language_description: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
};

export type EobRecordRow = {
  id: string;
  document_id: string;
  user_id: string;
  policy_id: string | null;
  claim_number: string | null;
  service_date: string | null;
  provider_name: string | null;
  billed_amount: number | string | null;
  insurance_paid: number | string | null;
  patient_responsibility: number | string | null;
  denial_reason: string | null;
  denial_code: string | null;
  claim_status: ClaimStatus | null;
  plain_language_explanation: string | null;
  created_at: string;
};

export type LabReportResponse = {
  id: string;
  reportDate: string | null;
  labName: string | null;
  orderingDoctor: string | null;
};

export type BiomarkerReadingResponse = {
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

export type PrescriptionResponse = {
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

export type MedicalBillResponse = {
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

export type BillLineItemResponse = {
  id: string;
  procedureCode: string | null;
  description: string | null;
  serviceDate: string | null;
  billedAmount: number | null;
};

export type EobRecordResponse = {
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
  labReport: LabReportResponse;
  readings: BiomarkerReadingResponse[];
};

export type PrescriptionExtractedData = {
  type: "prescription";
  medications: PrescriptionResponse[];
};

export type MedicalBillExtractedData = {
  type: "medical_bill";
  bill: MedicalBillResponse;
  lineItems: BillLineItemResponse[];
};

export type InsuranceEobExtractedData = {
  type: "insurance_eob";
  eob: EobRecordResponse;
};

export type DocumentExtractedData =
  | LabReportExtractedData
  | PrescriptionExtractedData
  | MedicalBillExtractedData
  | InsuranceEobExtractedData;

const STRUCTURED_DOCUMENT_TYPES = new Set<DocumentType>([
  "lab_report",
  "prescription",
  "medical_bill",
  "insurance_eob",
]);

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapLabReport(row: LabReportRow): LabReportResponse {
  return {
    id: row.id,
    reportDate: row.report_date,
    labName: row.lab_name,
    orderingDoctor: row.ordering_doctor,
  };
}

export function mapBiomarkerReading(row: BiomarkerReadingRow): BiomarkerReadingResponse {
  return {
    id: row.id,
    biomarkerKey: row.biomarker_key,
    biomarkerName: row.biomarker_name,
    value: toNumber(row.value) ?? 0,
    unit: row.unit,
    referenceRangeLow: toNumber(row.reference_range_low),
    referenceRangeHigh: toNumber(row.reference_range_high),
    referenceRangeText: row.reference_range_text,
    status: row.status,
    readingDate: row.reading_date,
  };
}

export function mapPrescription(row: PrescriptionRow): PrescriptionResponse {
  return {
    id: row.id,
    medicationName: row.medication_name,
    genericName: row.generic_name,
    dosage: row.dosage,
    frequency: row.frequency,
    route: row.route,
    prescribingDoctor: row.prescribing_doctor,
    prescribedDate: row.prescribed_date,
    isActive: row.is_active,
    notes: row.notes,
  };
}

export function mapMedicalBill(row: MedicalBillRow): MedicalBillResponse {
  return {
    id: row.id,
    providerName: row.provider_name,
    serviceDate: row.service_date,
    totalBilled: toNumber(row.total_billed),
    insurancePaid: toNumber(row.insurance_paid),
    amountDue: toNumber(row.amount_due),
    dueDate: row.due_date,
    paymentStatus: row.payment_status,
    hasDiscrepancy: row.has_discrepancy,
  };
}

export function mapBillLineItem(row: BillLineItemRow): BillLineItemResponse {
  return {
    id: row.id,
    procedureCode: row.procedure_code,
    description: row.description,
    serviceDate: row.service_date,
    billedAmount: toNumber(row.billed_amount),
  };
}

export function mapEobRecord(row: EobRecordRow): EobRecordResponse {
  return {
    id: row.id,
    claimNumber: row.claim_number,
    serviceDate: row.service_date,
    providerName: row.provider_name,
    billedAmount: toNumber(row.billed_amount),
    insurancePaid: toNumber(row.insurance_paid),
    patientResponsibility: toNumber(row.patient_responsibility),
    denialReason: row.denial_reason,
    denialCode: row.denial_code,
    claimStatus: row.claim_status,
    plainLanguageExplanation: row.plain_language_explanation,
  };
}

export function isStructuredDocumentType(
  documentType: DocumentType | null,
): documentType is Extract<
  DocumentType,
  "lab_report" | "prescription" | "medical_bill" | "insurance_eob"
> {
  return documentType != null && STRUCTURED_DOCUMENT_TYPES.has(documentType);
}

export function shouldFetchExtractedData(
  processingStatus: ProcessingStatus,
  documentType: DocumentType | null,
): boolean {
  return processingStatus === "completed" && isStructuredDocumentType(documentType);
}
