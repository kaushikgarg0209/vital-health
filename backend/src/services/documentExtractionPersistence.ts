import { supabaseAdmin } from "../config/supabase.js";
import type { DocumentClassification } from "../schemas/ai/documentClassificationSchema.js";
import { addTrendJob } from "../queues/producers.js";
import {
  DocumentError,
  type DocumentExtractionMetadata,
  updateDocumentAfterExtraction,
} from "./documentService.js";
import type { Document } from "../types/document.js";
import type { DocumentExtractionResult } from "../types/aiExtraction.js";
import { resolveBiomarkerKey } from "../utils/biomarkerKey.js";
import {
  mapBiomarkerStatus,
  parseExtractionDate,
  parseExtractionNumber,
  toIsoDateOnly,
} from "../utils/extractionValues.js";

function fallbackReadingDate(document: Document): string {
  return toIsoDateOnly(new Date(document.created_at));
}

export function buildExtractionMetadata(
  classification: DocumentClassification,
  extraction: DocumentExtractionResult,
): DocumentExtractionMetadata {
  const base: DocumentExtractionMetadata = {
    documentType: classification.type,
    extractionConfidence: classification.confidence,
  };

  switch (extraction.documentType) {
    case "lab_report":
      return {
        ...base,
        documentDate: parseExtractionDate(extraction.data.reportDate),
        institutionName: extraction.data.labName ?? null,
        doctorName: extraction.data.orderingDoctor ?? null,
      };

    case "prescription":
      return {
        ...base,
        documentDate: parseExtractionDate(extraction.data.prescribedDate),
        institutionName: extraction.data.pharmacyName ?? null,
        doctorName: extraction.data.prescribingDoctor ?? null,
      };

    case "medical_bill":
      return {
        ...base,
        documentDate: parseExtractionDate(extraction.data.serviceDate),
        institutionName: extraction.data.providerName ?? null,
      };

    case "insurance_eob":
      return {
        ...base,
        documentDate: parseExtractionDate(extraction.data.serviceDate),
        institutionName: extraction.data.providerName ?? null,
      };

    default:
      return {
        ...base,
        documentDate: parseExtractionDate(extraction.data.documentDate),
        institutionName: extraction.data.institutionName ?? null,
        doctorName: extraction.data.doctorName ?? null,
        notes: extraction.data.summary ?? null,
      };
  }
}

async function persistLabReport(
  document: Document,
  extraction: Extract<DocumentExtractionResult, { documentType: "lab_report" }>,
): Promise<void> {
  const readingDate =
    parseExtractionDate(extraction.data.reportDate) ?? fallbackReadingDate(document);

  const { data: labReport, error: labReportError } = await supabaseAdmin
    .from("lab_reports")
    .upsert(
      {
        document_id: document.id,
        user_id: document.user_id,
        report_date: parseExtractionDate(extraction.data.reportDate),
        lab_name: extraction.data.labName ?? null,
        ordering_doctor: extraction.data.orderingDoctor ?? null,
      },
      { onConflict: "document_id" },
    )
    .select("id")
    .single();

  if (labReportError || !labReport) {
    throw new DocumentError(
      labReportError?.message ?? "Failed to upsert lab report",
      500,
      "INTERNAL_ERROR",
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("biomarker_readings")
    .delete()
    .eq("lab_report_id", labReport.id);

  if (deleteError) {
    throw new DocumentError(deleteError.message, 500, "INTERNAL_ERROR");
  }

  const readings = extraction.data.tests.flatMap((test) => {
    const value = parseExtractionNumber(test.value);

    if (value === null) {
      return [];
    }

    return [
      {
        user_id: document.user_id,
        lab_report_id: labReport.id,
        biomarker_key: resolveBiomarkerKey(test.testName, test.biomarkerKey),
        biomarker_name: test.testName,
        value,
        unit: test.unit?.trim() || "unknown",
        reference_range_low: test.referenceRangeLow ?? null,
        reference_range_high: test.referenceRangeHigh ?? null,
        reference_range_text: null,
        status: mapBiomarkerStatus(test.status),
        reading_date: readingDate,
        source: "lab_report" as const,
      },
    ];
  });

  if (readings.length === 0) {
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("biomarker_readings")
    .insert(readings);

  if (insertError) {
    throw new DocumentError(insertError.message, 500, "INTERNAL_ERROR");
  }

  const uniqueKeys = [...new Set(readings.map((reading) => reading.biomarker_key))];

  for (const biomarkerKey of uniqueKeys) {
    try {
      await addTrendJob({
        userId: document.user_id,
        biomarkerKey,
      });
    } catch (queueError) {
      console.error(
        `Failed to enqueue trend job for ${biomarkerKey} (document ${document.id}):`,
        queueError,
      );
    }
  }
}

async function persistPrescription(
  document: Document,
  extraction: Extract<DocumentExtractionResult, { documentType: "prescription" }>,
): Promise<void> {
  const { error: deleteError } = await supabaseAdmin
    .from("prescriptions")
    .delete()
    .eq("document_id", document.id);

  if (deleteError) {
    throw new DocumentError(deleteError.message, 500, "INTERNAL_ERROR");
  }

  if (extraction.data.medications.length === 0) {
    return;
  }

  const rows = extraction.data.medications.map((medication) => ({
    document_id: document.id,
    user_id: document.user_id,
    medication_name: medication.medicationName,
    generic_name: medication.genericName ?? null,
    dosage: medication.dosage ?? null,
    frequency: medication.frequency ?? null,
    route: medication.route ?? null,
    prescribing_doctor:
      medication.prescribingDoctor ?? extraction.data.prescribingDoctor ?? null,
    prescribed_date:
      parseExtractionDate(medication.prescribedDate) ??
      parseExtractionDate(extraction.data.prescribedDate),
    notes: medication.notes ?? null,
  }));

  const { error: insertError } = await supabaseAdmin.from("prescriptions").insert(rows);

  if (insertError) {
    throw new DocumentError(insertError.message, 500, "INTERNAL_ERROR");
  }
}

async function persistMedicalBill(
  document: Document,
  extraction: Extract<DocumentExtractionResult, { documentType: "medical_bill" }>,
): Promise<void> {
  const { data: bill, error: billError } = await supabaseAdmin
    .from("medical_bills")
    .upsert(
      {
        document_id: document.id,
        user_id: document.user_id,
        provider_name: extraction.data.providerName ?? null,
        service_date: parseExtractionDate(extraction.data.serviceDate),
        total_billed: extraction.data.totalBilled ?? null,
        insurance_paid: extraction.data.insurancePaid ?? null,
        amount_due: extraction.data.amountDue ?? null,
        due_date: parseExtractionDate(extraction.data.dueDate),
      },
      { onConflict: "document_id" },
    )
    .select("id")
    .single();

  if (billError || !bill) {
    throw new DocumentError(
      billError?.message ?? "Failed to upsert medical bill",
      500,
      "INTERNAL_ERROR",
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("bill_line_items")
    .delete()
    .eq("bill_id", bill.id);

  if (deleteError) {
    throw new DocumentError(deleteError.message, 500, "INTERNAL_ERROR");
  }

  if (extraction.data.lineItems.length === 0) {
    return;
  }

  const rows = extraction.data.lineItems.map((item) => ({
    bill_id: bill.id,
    user_id: document.user_id,
    procedure_code: item.procedureCode ?? null,
    description: item.description ?? null,
    service_date: parseExtractionDate(item.serviceDate),
    billed_amount: item.billedAmount ?? null,
  }));

  const { error: insertError } = await supabaseAdmin.from("bill_line_items").insert(rows);

  if (insertError) {
    throw new DocumentError(insertError.message, 500, "INTERNAL_ERROR");
  }
}

async function persistInsuranceEob(
  document: Document,
  extraction: Extract<DocumentExtractionResult, { documentType: "insurance_eob" }>,
): Promise<void> {
  const { error } = await supabaseAdmin.from("eob_records").upsert(
    {
      document_id: document.id,
      user_id: document.user_id,
      claim_number: extraction.data.claimNumber ?? null,
      service_date: parseExtractionDate(extraction.data.serviceDate),
      provider_name: extraction.data.providerName ?? null,
      billed_amount: extraction.data.billedAmount ?? null,
      insurance_paid: extraction.data.insurancePaid ?? null,
      patient_responsibility: extraction.data.patientResponsibility ?? null,
      denial_reason: extraction.data.denialReason ?? null,
      denial_code: extraction.data.denialCode ?? null,
      claim_status: extraction.data.claimStatus ?? null,
      plain_language_explanation: extraction.data.plainLanguageExplanation ?? null,
    },
    { onConflict: "document_id" },
  );

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }
}

async function persistStructuredData(
  document: Document,
  extraction: DocumentExtractionResult,
): Promise<void> {
  switch (extraction.documentType) {
    case "lab_report":
      await persistLabReport(document, extraction);
      return;

    case "prescription":
      await persistPrescription(document, extraction);
      return;

    case "medical_bill":
      await persistMedicalBill(document, extraction);
      return;

    case "insurance_eob":
      await persistInsuranceEob(document, extraction);
      return;

    default:
      return;
  }
}

export async function persistExtraction(
  document: Document,
  classification: DocumentClassification,
  extraction: DocumentExtractionResult,
): Promise<void> {
  await persistStructuredData(document, extraction);

  const metadata = buildExtractionMetadata(classification, extraction);
  await updateDocumentAfterExtraction(document.id, metadata);
}
