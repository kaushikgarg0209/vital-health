export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export type DocumentType =
  | "lab_report"
  | "prescription"
  | "discharge_summary"
  | "imaging_report"
  | "medical_bill"
  | "insurance_eob"
  | "insurance_policy"
  | "vaccination_record"
  | "other";

/** Database row shape (snake_case). */
export type DocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_mime_type: string;
  storage_path: string;
  document_type: DocumentType | null;
  processing_status: ProcessingStatus;
  document_date: string | null;
  institution_name: string | null;
  doctor_name: string | null;
  tags: string[] | null;
  ai_suggested_tags: string[] | null;
  notes: string | null;
  file_size_bytes: number | null;
  extraction_confidence: number | string | null;
  created_at: string;
  updated_at: string;
};

/** Internal domain model (snake_case). */
export type Document = {
  id: string;
  user_id: string;
  file_name: string;
  file_mime_type: string;
  storage_path: string;
  document_type: DocumentType | null;
  processing_status: ProcessingStatus;
  document_date: string | null;
  institution_name: string | null;
  doctor_name: string | null;
  tags: string[];
  ai_suggested_tags: string[];
  notes: string | null;
  file_size_bytes: number | null;
  extraction_confidence: number | null;
  created_at: string;
  updated_at: string;
};

/** API response shape (camelCase). */
export type DocumentResponse = {
  id: string;
  fileName: string;
  fileMimeType: string;
  documentType: DocumentType | null;
  processingStatus: ProcessingStatus;
  documentDate: string | null;
  institutionName: string | null;
  doctorName: string | null;
  tags: string[];
  aiSuggestedTags: string[];
  notes: string | null;
  fileSizeBytes: number | null;
  extractionConfidence: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDetailResponse = DocumentResponse & {
  signedUrl?: string;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    user_id: row.user_id,
    file_name: row.file_name,
    file_mime_type: row.file_mime_type,
    storage_path: row.storage_path,
    document_type: row.document_type,
    processing_status: row.processing_status,
    document_date: row.document_date,
    institution_name: row.institution_name,
    doctor_name: row.doctor_name,
    tags: row.tags ?? [],
    ai_suggested_tags: row.ai_suggested_tags ?? [],
    notes: row.notes,
    file_size_bytes: row.file_size_bytes,
    extraction_confidence: toNumber(row.extraction_confidence),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toDocumentResponse(document: Document): DocumentResponse {
  return {
    id: document.id,
    fileName: document.file_name,
    fileMimeType: document.file_mime_type,
    documentType: document.document_type,
    processingStatus: document.processing_status,
    documentDate: document.document_date,
    institutionName: document.institution_name,
    doctorName: document.doctor_name,
    tags: document.tags,
    aiSuggestedTags: document.ai_suggested_tags,
    notes: document.notes,
    fileSizeBytes: document.file_size_bytes,
    extractionConfidence: document.extraction_confidence,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
  };
}
