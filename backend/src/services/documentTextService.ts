import { getDocumentForProcessing } from "./documentService.js";
import { getExtractedDataForDocument } from "./documentExtractionReadService.js";
import type { DocumentExtractedData } from "../types/documentExtraction.js";
import type { DocumentType, ProcessingStatus } from "../types/document.js";

function formatReferenceRange(
  low: number | null,
  high: number | null,
  text: string | null,
): string {
  if (text) {
    return text;
  }

  if (low != null && high != null) {
    return `${low}-${high}`;
  }

  if (low != null) {
    return `>= ${low}`;
  }

  if (high != null) {
    return `<= ${high}`;
  }

  return "";
}

function serializeExtractedData(extracted: DocumentExtractedData): string {
  switch (extracted.type) {
    case "lab_report": {
      const lines = [
        "Lab Report",
        extracted.labReport.labName ? `Lab: ${extracted.labReport.labName}` : null,
        extracted.labReport.reportDate ? `Report date: ${extracted.labReport.reportDate}` : null,
        extracted.labReport.orderingDoctor
          ? `Ordering doctor: ${extracted.labReport.orderingDoctor}`
          : null,
        "Test results:",
      ].filter(Boolean) as string[];

      for (const reading of extracted.readings) {
        const range = formatReferenceRange(
          reading.referenceRangeLow,
          reading.referenceRangeHigh,
          reading.referenceRangeText,
        );
        const rangePart = range ? ` (reference: ${range})` : "";
        const statusPart = reading.status ? ` [${reading.status}]` : "";
        lines.push(
          `- ${reading.biomarkerName}: ${reading.value} ${reading.unit}${rangePart}${statusPart}`,
        );
      }

      return lines.join("\n");
    }

    case "prescription": {
      const lines = ["Prescription", "Medications:"];

      for (const medication of extracted.medications) {
        const parts = [
          medication.medicationName,
          medication.genericName ? `(generic: ${medication.genericName})` : null,
          medication.dosage ? `dosage ${medication.dosage}` : null,
          medication.frequency ? `frequency ${medication.frequency}` : null,
          medication.route ? `route ${medication.route}` : null,
        ].filter(Boolean);

        lines.push(`- ${parts.join(", ")}`);
      }

      return lines.join("\n");
    }

    case "medical_bill": {
      const bill = extracted.bill;
      const lines = [
        "Medical Bill",
        bill.providerName ? `Provider: ${bill.providerName}` : null,
        bill.serviceDate ? `Service date: ${bill.serviceDate}` : null,
        bill.totalBilled != null ? `Total billed: ${bill.totalBilled}` : null,
        bill.insurancePaid != null ? `Insurance paid: ${bill.insurancePaid}` : null,
        bill.amountDue != null ? `Amount due: ${bill.amountDue}` : null,
        bill.paymentStatus ? `Payment status: ${bill.paymentStatus}` : null,
        "Line items:",
      ].filter(Boolean) as string[];

      for (const item of extracted.lineItems) {
        const amount = item.billedAmount != null ? `$${item.billedAmount}` : "unknown amount";
        lines.push(`- ${item.description ?? item.procedureCode ?? "Charge"}: ${amount}`);
      }

      return lines.join("\n");
    }

    case "insurance_eob": {
      const eob = extracted.eob;
      return [
        "Explanation of Benefits",
        eob.claimNumber ? `Claim number: ${eob.claimNumber}` : null,
        eob.providerName ? `Provider: ${eob.providerName}` : null,
        eob.serviceDate ? `Service date: ${eob.serviceDate}` : null,
        eob.billedAmount != null ? `Billed: ${eob.billedAmount}` : null,
        eob.insurancePaid != null ? `Insurance paid: ${eob.insurancePaid}` : null,
        eob.patientResponsibility != null
          ? `Patient responsibility: ${eob.patientResponsibility}`
          : null,
        eob.claimStatus ? `Claim status: ${eob.claimStatus}` : null,
        eob.denialReason ? `Denial reason: ${eob.denialReason}` : null,
        eob.plainLanguageExplanation ? `Summary: ${eob.plainLanguageExplanation}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }
}

export async function buildDocumentSearchText(
  userId: string,
  documentId: string,
  documentType: DocumentType | null,
  processingStatus: ProcessingStatus,
): Promise<string | null> {
  if (processingStatus !== "completed") {
    return null;
  }

  const document = await getDocumentForProcessing(documentId);

  if (!document || document.user_id !== userId) {
    return null;
  }

  const header = [
    `Document: ${document.file_name}`,
    document.document_type ? `Type: ${document.document_type}` : null,
    document.institution_name ? `Institution: ${document.institution_name}` : null,
    document.doctor_name ? `Doctor: ${document.doctor_name}` : null,
    document.document_date ? `Date: ${document.document_date}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const extracted = await getExtractedDataForDocument(
    userId,
    documentId,
    documentType,
    processingStatus,
  );

  if (extracted) {
    return `${header}\n\n${serializeExtractedData(extracted)}`.trim();
  }

  const fallbackParts = [header, document.notes].filter(Boolean);

  if (fallbackParts.length === 0) {
    return null;
  }

  return fallbackParts.join("\n\n").trim();
}
