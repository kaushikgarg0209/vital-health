import type { DocumentType } from "@/types/document";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lab_report: "Lab report",
  prescription: "Prescription",
  discharge_summary: "Discharge summary",
  imaging_report: "Imaging report",
  medical_bill: "Medical bill",
  insurance_eob: "Insurance EOB",
  insurance_policy: "Insurance policy",
  vaccination_record: "Vaccination record",
  other: "Other",
};

export function formatDocumentDate(date: string | null): string {
  if (!date) {
    return "Date unknown";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDocumentTypeLabel(documentType: DocumentType | null): string | null {
  if (!documentType) {
    return null;
  }

  return DOCUMENT_TYPE_LABELS[documentType];
}
