import type {
  Document,
  DocumentDetail,
  DocumentSearchResult,
  ListDocumentsQuery,
  PaginatedMeta,
  UploadDocumentResponse,
} from "@/types/document";
import { apiFetch, apiUpload } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

type ApiPaginatedResponse<T> = {
  data: T;
  meta: PaginatedMeta;
};

function buildQueryString(query: ListDocumentsQuery): string {
  const params = new URLSearchParams();

  if (query.page != null) {
    params.set("page", String(query.page));
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit));
  }
  if (query.type) {
    params.set("type", query.type);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.tag) {
    params.set("tag", query.tag);
  }
  if (query.from) {
    params.set("from", query.from);
  }
  if (query.to) {
    params.set("to", query.to);
  }
  if (query.sort) {
    params.set("sort", query.sort);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiUpload<ApiDataResponse<UploadDocumentResponse>>(
    "/api/v1/documents/upload",
    formData,
  );

  return response.data;
}

export async function listDocuments(
  query: ListDocumentsQuery = {},
): Promise<{ documents: Document[]; meta: PaginatedMeta }> {
  const response = await apiFetch<ApiPaginatedResponse<Document[]>>(
    `/api/v1/documents${buildQueryString(query)}`,
  );

  return {
    documents: response.data,
    meta: response.meta,
  };
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await apiFetch<ApiDataResponse<DocumentDetail>>(
    `/api/v1/documents/${documentId}`,
  );

  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiFetch<ApiDataResponse<{ message: string }>>(
    `/api/v1/documents/${documentId}`,
    { method: "DELETE" },
  );
}

export async function searchDocuments(
  q: string,
  options: { type?: string; limit?: number } = {},
): Promise<DocumentSearchResult[]> {
  const params = new URLSearchParams({ q });

  if (options.type) {
    params.set("type", options.type);
  }
  if (options.limit != null) {
    params.set("limit", String(options.limit));
  }

  const response = await apiFetch<ApiDataResponse<DocumentSearchResult[]>>(
    `/api/v1/documents/search?${params.toString()}`,
  );

  return response.data;
}
