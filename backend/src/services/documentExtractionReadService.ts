import { supabaseAdmin } from "../config/supabase.js";
import { DocumentError } from "./documentService.js";
import type { DocumentType, ProcessingStatus } from "../types/document.js";
import {
  mapBiomarkerReading,
  mapBillLineItem,
  mapEobRecord,
  mapLabReport,
  mapMedicalBill,
  mapPrescription,
  shouldFetchExtractedData,
  type BiomarkerReadingRow,
  type BillLineItemRow,
  type DocumentExtractedData,
  type EobRecordRow,
  type LabReportRow,
  type MedicalBillRow,
  type PrescriptionRow,
} from "../types/documentExtraction.js";

async function fetchLabReportData(
  userId: string,
  documentId: string,
): Promise<DocumentExtractedData | null> {
  const { data: labReport, error: labReportError } = await supabaseAdmin
    .from("lab_reports")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (labReportError) {
    throw new DocumentError(labReportError.message, 500, "INTERNAL_ERROR");
  }

  if (!labReport) {
    return null;
  }

  const labReportRow = labReport as LabReportRow;

  const { data: readings, error: readingsError } = await supabaseAdmin
    .from("biomarker_readings")
    .select("*")
    .eq("lab_report_id", labReportRow.id)
    .eq("user_id", userId)
    .order("biomarker_name", { ascending: true });

  if (readingsError) {
    throw new DocumentError(readingsError.message, 500, "INTERNAL_ERROR");
  }

  return {
    type: "lab_report",
    labReport: mapLabReport(labReportRow),
    readings: (readings ?? []).map((row) => mapBiomarkerReading(row as BiomarkerReadingRow)),
  };
}

async function fetchPrescriptionData(
  userId: string,
  documentId: string,
): Promise<DocumentExtractedData | null> {
  const { data: medications, error } = await supabaseAdmin
    .from("prescriptions")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .order("medication_name", { ascending: true });

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!medications || medications.length === 0) {
    return null;
  }

  return {
    type: "prescription",
    medications: medications.map((row) => mapPrescription(row as PrescriptionRow)),
  };
}

async function fetchMedicalBillData(
  userId: string,
  documentId: string,
): Promise<DocumentExtractedData | null> {
  const { data: bill, error: billError } = await supabaseAdmin
    .from("medical_bills")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (billError) {
    throw new DocumentError(billError.message, 500, "INTERNAL_ERROR");
  }

  if (!bill) {
    return null;
  }

  const billRow = bill as MedicalBillRow;

  const { data: lineItems, error: lineItemsError } = await supabaseAdmin
    .from("bill_line_items")
    .select("*")
    .eq("bill_id", billRow.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (lineItemsError) {
    throw new DocumentError(lineItemsError.message, 500, "INTERNAL_ERROR");
  }

  return {
    type: "medical_bill",
    bill: mapMedicalBill(billRow),
    lineItems: (lineItems ?? []).map((row) => mapBillLineItem(row as BillLineItemRow)),
  };
}

async function fetchEobData(
  userId: string,
  documentId: string,
): Promise<DocumentExtractedData | null> {
  const { data: eob, error } = await supabaseAdmin
    .from("eob_records")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!eob) {
    return null;
  }

  return {
    type: "insurance_eob",
    eob: mapEobRecord(eob as EobRecordRow),
  };
}

export async function getExtractedDataForDocument(
  userId: string,
  documentId: string,
  documentType: DocumentType | null,
  processingStatus: ProcessingStatus,
): Promise<DocumentExtractedData | null> {
  if (!shouldFetchExtractedData(processingStatus, documentType)) {
    return null;
  }

  switch (documentType) {
    case "lab_report":
      return fetchLabReportData(userId, documentId);

    case "prescription":
      return fetchPrescriptionData(userId, documentId);

    case "medical_bill":
      return fetchMedicalBillData(userId, documentId);

    case "insurance_eob":
      return fetchEobData(userId, documentId);

    default:
      return null;
  }
}
