import { createHash } from "node:crypto";
import { supabaseAdmin } from "../../config/supabase.js";
import {
  EMBEDDING_CHUNK_OVERLAP,
  EMBEDDING_CHUNK_SIZE,
  EMBEDDING_MIN_SIMILARITY,
  EMBEDDING_MODEL,
  geminiClient,
} from "../../config/gemini.js";
import { DocumentError } from "../documentService.js";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export type ChunkWithEmbedding = {
  content: string;
  contentHash: string;
  embedding: number[];
};

export type SimilarChunkMatch = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

const EMBEDDING_DIMENSION = 768;
const EMBED_BATCH_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function chunkText(
  text: string,
  chunkSize = EMBEDDING_CHUNK_SIZE,
  overlap = EMBEDDING_CHUNK_OVERLAP,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      continue;
    }

    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;

    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (trimmed.length <= chunkSize) {
      current = trimmed;
      continue;
    }

    let start = 0;

    while (start < trimmed.length) {
      const end = Math.min(start + chunkSize, trimmed.length);
      chunks.push(trimmed.slice(start, end));
      start = end - overlap;

      if (start >= trimmed.length - overlap) {
        break;
      }
    }

    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  if (chunks.length <= 1) {
    return chunks;
  }

  const overlapped: string[] = [chunks[0]!];

  for (let index = 1; index < chunks.length; index += 1) {
    const previous = overlapped[overlapped.length - 1]!;
    const next = chunks[index]!;
    const tail = previous.slice(Math.max(0, previous.length - overlap));
    overlapped.push(`${tail}\n\n${next}`.trim());
  }

  return overlapped;
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  const response = await geminiClient.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length !== EMBEDDING_DIMENSION) {
    throw new DocumentError(
      `Expected ${EMBEDDING_DIMENSION}-dimension embedding, got ${values?.length ?? 0}`,
      500,
      "INTERNAL_ERROR",
    );
  }

  return values;
}

export async function generateEmbeddings(
  texts: string[],
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const [index, text] of texts.entries()) {
    embeddings.push(await generateEmbedding(text, taskType));

    if (index < texts.length - 1) {
      await sleep(EMBED_BATCH_DELAY_MS);
    }
  }

  return embeddings;
}

export async function storeChunks(
  documentId: string,
  userId: string,
  chunks: ChunkWithEmbedding[],
): Promise<void> {
  const { error: deleteError } = await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new DocumentError(deleteError.message, 500, "INTERNAL_ERROR");
  }

  if (chunks.length === 0) {
    return;
  }

  const rows = chunks.map((chunk, index) => ({
    document_id: documentId,
    user_id: userId,
    chunk_index: index,
    content: chunk.content,
    content_hash: chunk.contentHash,
    embedding: toVectorLiteral(chunk.embedding),
  }));

  const { error: insertError } = await supabaseAdmin.from("document_chunks").insert(rows);

  if (insertError) {
    throw new DocumentError(insertError.message, 500, "INTERNAL_ERROR");
  }
}

export async function searchSimilar(
  userId: string,
  queryEmbedding: number[],
  limit = 8,
  minSimilarity = EMBEDDING_MIN_SIMILARITY,
): Promise<SimilarChunkMatch[]> {
  const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_user_id: userId,
    match_count: limit,
    min_similarity: minSimilarity,
  });

  if (error) {
    throw new DocumentError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? []).map(
    (row: {
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      similarity: number;
    }) => ({
      id: row.id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      similarity: row.similarity,
    }),
  );
}
