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

export type Document = {
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

export type DocumentDetail = Document & {
  signedUrl: string;
};

export type UploadDocumentResponse = {
  documentId: string;
  jobId: string;
  status: ProcessingStatus;
  estimatedProcessingSeconds: number;
};

export type ListDocumentsQuery = {
  page?: number;
  limit?: number;
  type?: DocumentType;
  status?: ProcessingStatus;
  tag?: string;
  from?: string;
  to?: string;
  sort?: "date_desc" | "date_asc";
};

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type DocumentSearchResult = {
  documentId: string;
  fileName: string;
  documentType: DocumentType | null;
  processingStatus: ProcessingStatus;
  documentDate: string | null;
  excerpt: string;
};

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function isProcessingStatus(status: ProcessingStatus): boolean {
  return status === "pending" || status === "processing";
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    return "Only PDF, JPG, and PNG files are supported.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "File must be 20 MB or smaller.";
  }

  return null;
}
