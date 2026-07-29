import type { SearchDocumentsQuery } from "../schemas/documentSchemas.js";
import { generateEmbedding, searchSimilar } from "./ai/embeddingService.js";
import { EMBEDDING_MIN_SIMILARITY } from "../config/gemini.js";
import { DocumentError } from "./documentService.js";
import { supabaseAdmin } from "../config/supabase.js";
import { mapDocument, type DocumentRow } from "../types/document.js";
import type { DocumentType, ProcessingStatus } from "../types/document.js";

export type DocumentSearchResult = {
  documentId: string;
  fileName: string;
  documentType: DocumentType | null;
  processingStatus: ProcessingStatus;
  documentDate: string | null;
  excerpt: string;
  score: number | null;
  matchType: "semantic" | "keyword";
};

function truncateExcerpt(text: string, maxLength = 200): string {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

async function keywordSearch(
  userId: string,
  query: SearchDocumentsQuery,
): Promise<DocumentSearchResult[]> {
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

  return (data ?? []).map((row) => {
    const document = mapDocument(row as DocumentRow);

    return {
      documentId: document.id,
      fileName: document.file_name,
      documentType: document.document_type,
      processingStatus: document.processing_status,
      documentDate: document.document_date,
      excerpt: truncateExcerpt(document.notes ?? document.file_name),
      score: null,
      matchType: "keyword" as const,
    };
  });
}

async function semanticSearch(
  userId: string,
  query: SearchDocumentsQuery,
): Promise<DocumentSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query.q, "RETRIEVAL_QUERY");
  const matches = await searchSimilar(userId, queryEmbedding, query.limit);

  if (matches.length === 0) {
    return [];
  }

  const documentIds = [...new Set(matches.map((match) => match.documentId))];

  let builder = supabaseAdmin.from("documents").select("*").eq("user_id", userId).in("id", documentIds);

  if (query.type) {
    builder = builder.eq("document_type", query.type);
  }

  const { data, error } = await builder;

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  const documentsById = new Map(
    (data ?? []).map((row) => [row.id as string, mapDocument(row as DocumentRow)]),
  );

  const results: DocumentSearchResult[] = [];

  for (const match of matches) {
    if (match.similarity < EMBEDDING_MIN_SIMILARITY) {
      continue;
    }

    const document = documentsById.get(match.documentId);

    if (!document) {
      continue;
    }

    results.push({
      documentId: document.id,
      fileName: document.file_name,
      documentType: document.document_type,
      processingStatus: document.processing_status,
      documentDate: document.document_date,
      excerpt: truncateExcerpt(match.content),
      score: match.similarity,
      matchType: "semantic",
    });
  }

  return results;
}

function mergeSearchResults(
  semanticResults: DocumentSearchResult[],
  keywordResults: DocumentSearchResult[],
  limit: number,
): DocumentSearchResult[] {
  const merged = new Map<string, DocumentSearchResult>();

  for (const result of semanticResults) {
    merged.set(result.documentId, result);
  }

  for (const result of keywordResults) {
    const existing = merged.get(result.documentId);

    if (!existing) {
      merged.set(result.documentId, result);
      continue;
    }

    if (existing.matchType === "keyword" && result.matchType === "semantic") {
      merged.set(result.documentId, result);
    }
  }

  return [...merged.values()]
    .sort((left, right) => {
      const leftScore = left.score ?? -1;
      const rightScore = right.score ?? -1;

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (left.matchType !== right.matchType) {
        return left.matchType === "semantic" ? -1 : 1;
      }

      return left.fileName.localeCompare(right.fileName);
    })
    .slice(0, limit);
}

export async function searchDocumentsHybrid(
  userId: string,
  query: SearchDocumentsQuery,
): Promise<DocumentSearchResult[]> {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(userId, query).catch((error) => {
      console.error("Semantic search failed, falling back to keyword only:", error);
      return [] as DocumentSearchResult[];
    }),
    keywordSearch(userId, query),
  ]);

  return mergeSearchResults(semanticResults, keywordResults, query.limit);
}
