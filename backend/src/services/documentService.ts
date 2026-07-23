import { supabaseAdmin } from "../config/supabase.js";
import type {
  ListDocumentsQuery,
  SearchDocumentsQuery,
  UpdateDocumentInput,
} from "../schemas/documentSchemas.js";
import {
  mapDocument,
  type Document,
  type DocumentRow,
  type ProcessingStatus,
} from "../types/document.js";

export class DocumentError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

export type CreateDocumentInput = {
  id: string;
  userId: string;
  fileName: string;
  fileMimeType: string;
  storagePath: string;
  fileSizeBytes: number;
};

export type DocumentListResult = {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
};

function mapUpdateInput(input: UpdateDocumentInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.documentType !== undefined) {
    payload.document_type = input.documentType;
  }
  if (input.documentDate !== undefined) {
    payload.document_date = input.documentDate;
  }
  if (input.institutionName !== undefined) {
    payload.institution_name = input.institutionName;
  }
  if (input.doctorName !== undefined) {
    payload.doctor_name = input.doctorName;
  }
  if (input.tags !== undefined) {
    payload.tags = input.tags;
  }
  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  return payload;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .insert({
      id: input.id,
      user_id: input.userId,
      file_name: input.fileName,
      file_mime_type: input.fileMimeType,
      storage_path: input.storagePath,
      file_size_bytes: input.fileSizeBytes,
      processing_status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  return mapDocument(data as DocumentRow);
}

export async function getDocumentById(
  userId: string,
  documentId: string,
): Promise<Document | null> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return mapDocument(data as DocumentRow);
}

export async function listDocuments(
  userId: string,
  query: ListDocumentsQuery,
): Promise<DocumentListResult> {
  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;

  let builder = supabaseAdmin
    .from("documents")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (query.type) {
    builder = builder.eq("document_type", query.type);
  }

  if (query.status) {
    builder = builder.eq("processing_status", query.status);
  }

  if (query.tag) {
    builder = builder.contains("tags", [query.tag]);
  }

  if (query.from) {
    builder = builder.gte("document_date", query.from);
  }

  if (query.to) {
    builder = builder.lte("document_date", query.to);
  }

  const ascending = query.sort === "date_asc";
  builder = builder.order("document_date", { ascending, nullsFirst: false });
  builder = builder.order("created_at", { ascending, nullsFirst: false });

  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  return {
    documents: (data ?? []).map((row) => mapDocument(row as DocumentRow)),
    total: count ?? 0,
    page: query.page,
    limit: query.limit,
  };
}

export async function searchDocuments(
  userId: string,
  query: SearchDocumentsQuery,
): Promise<Document[]> {
  const sanitizedQuery = query.q.replace(/,/g, " ").trim();

  let builder = supabaseAdmin
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .or(`file_name.ilike.%${sanitizedQuery}%,notes.ilike.%${sanitizedQuery}%`)
    .limit(query.limit);

  if (query.type) {
    builder = builder.eq("document_type", query.type);
  }

  const { data, error } = await builder.order("created_at", { ascending: false });

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? []).map((row) => mapDocument(row as DocumentRow));
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<Document> {
  const updates = mapUpdateInput(input);

  if (Object.keys(updates).length === 0) {
    throw new DocumentError("No document fields provided to update", 400, "VALIDATION_ERROR");
  }

  const { data, error } = await supabaseAdmin
    .from("documents")
    .update(updates)
    .eq("id", documentId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    throw new DocumentError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  return mapDocument(data as DocumentRow);
}

export async function updateDocumentProcessingStatus(
  documentId: string,
  status: ProcessingStatus,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("documents")
    .update({ processing_status: status })
    .eq("id", documentId);

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }
}

export async function deleteDocument(userId: string, documentId: string): Promise<Document> {
  const existing = await getDocumentById(userId, documentId);

  if (!existing) {
    throw new DocumentError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  const { error } = await supabaseAdmin
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  return existing;
}
