import { supabaseAdmin } from "../../config/supabase.js";
import {
  CHAT_RETRIEVAL_LIMIT,
  CHAT_RETRIEVAL_MIN_SIMILARITY,
} from "../../config/gemini.js";
import type { Message, RetrievedChunkContext } from "../../types/chat.js";
import { mapDocument, type DocumentRow } from "../../types/document.js";
import { generateEmbedding, searchSimilar, type SimilarChunkMatch } from "./embeddingService.js";
import { expandRetrievalQueries } from "./chatQueryExpansion.js";
import { ChatError } from "../chatService.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "his",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "she",
  "that",
  "the",
  "their",
  "them",
  "there",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
  "about",
  "can",
  "could",
  "did",
  "do",
  "does",
  "done",
  "get",
  "got",
  "into",
  "just",
  "last",
  "like",
  "make",
  "many",
  "much",
  "recent",
  "should",
  "show",
  "tell",
  "than",
  "then",
  "these",
  "those",
  "too",
  "up",
  "us",
  "very",
  "would",
]);

const RRF_K = 60;

type RankedChunk = RetrievedChunkContext & {
  chunkKey: string;
};

function chunkKey(documentId: string, chunkIndex: number): string {
  return `${documentId}:${chunkIndex}`;
}

function extractSearchTokens(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  return [...new Set(tokens)].slice(0, 5);
}

function reciprocalRankFusion(lists: RankedChunk[][], limit: number): RankedChunk[] {
  const scores = new Map<string, { chunk: RankedChunk; score: number }>();

  for (const list of lists) {
    list.forEach((chunk, rank) => {
      const key = chunk.chunkKey;
      const rrfScore = 1 / (RRF_K + rank + 1);
      const existing = scores.get(key);

      if (existing) {
        existing.score += rrfScore;

        if (chunk.similarity > existing.chunk.similarity) {
          existing.chunk = chunk;
        }
      } else {
        scores.set(key, { chunk, score: rrfScore });
      }
    });
  }

  return [...scores.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);
}

async function enrichMatchesWithFileNames(
  userId: string,
  matches: SimilarChunkMatch[],
): Promise<RetrievedChunkContext[]> {
  if (matches.length === 0) {
    return [];
  }

  const documentIds = [...new Set(matches.map((match) => match.documentId))];

  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id, file_name")
    .eq("user_id", userId)
    .in("id", documentIds);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  const fileNamesById = new Map(
    (data ?? []).map((row) => {
      const document = mapDocument(row as DocumentRow);
      return [document.id, document.file_name] as const;
    }),
  );

  return matches
    .map((match) => {
      const fileName = fileNamesById.get(match.documentId);

      if (!fileName) {
        return null;
      }

      return {
        documentId: match.documentId,
        fileName,
        chunkIndex: match.chunkIndex,
        content: match.content,
        similarity: match.similarity,
      };
    })
    .filter((chunk): chunk is RetrievedChunkContext => chunk != null);
}

async function semanticSearchChunks(
  userId: string,
  query: string,
  limit: number,
): Promise<RankedChunk[]> {
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");
  const matches = await searchSimilar(
    userId,
    queryEmbedding,
    limit,
    CHAT_RETRIEVAL_MIN_SIMILARITY,
  );
  const enriched = await enrichMatchesWithFileNames(userId, matches);

  return enriched.map((chunk) => ({
    ...chunk,
    chunkKey: chunkKey(chunk.documentId, chunk.chunkIndex),
  }));
}

async function keywordSearchChunks(
  userId: string,
  query: string,
  limit: number,
): Promise<RankedChunk[]> {
  const tokens = extractSearchTokens(query);

  if (tokens.length === 0) {
    return [];
  }

  const filters = tokens.map((token) => `content.ilike.%${token}%`).join(",");

  const { data, error } = await supabaseAdmin
    .from("document_chunks")
    .select("document_id, chunk_index, content")
    .eq("user_id", userId)
    .or(filters)
    .limit(limit * 2);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data || data.length === 0) {
    return [];
  }

  const documentIds = [...new Set(data.map((row) => row.document_id as string))];

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("documents")
    .select("id, file_name")
    .eq("user_id", userId)
    .in("id", documentIds);

  if (documentsError) {
    throw new ChatError(documentsError.message, 500, "INTERNAL_ERROR");
  }

  const fileNamesById = new Map(
    (documents ?? []).map((row) => {
      const document = mapDocument(row as DocumentRow);
      return [document.id, document.file_name] as const;
    }),
  );

  return data
    .map((row, index) => {
      const documentId = row.document_id as string;
      const fileName = fileNamesById.get(documentId);

      if (!fileName) {
        return null;
      }

      const tokenHits = tokens.filter((token) =>
        (row.content as string).toLowerCase().includes(token),
      ).length;

      return {
        documentId,
        fileName,
        chunkIndex: row.chunk_index as number,
        content: row.content as string,
        similarity: Math.min(0.99, 0.55 + tokenHits * 0.08),
        chunkKey: chunkKey(documentId, row.chunk_index as number),
        rankBoost: index,
      };
    })
    .filter((chunk): chunk is RankedChunk & { rankBoost: number } => chunk != null)
    .sort((left, right) => {
      if (right.similarity !== left.similarity) {
        return right.similarity - left.similarity;
      }

      return left.rankBoost - right.rankBoost;
    })
    .slice(0, limit)
    .map(({ rankBoost: _rankBoost, ...chunk }) => chunk);
}

export async function retrieveForChat(
  userId: string,
  userMessage: string,
  history: Message[] = [],
  limit = CHAT_RETRIEVAL_LIMIT,
  precomputedQueries?: string[],
): Promise<RetrievedChunkContext[]> {
  const searchQueries = precomputedQueries ?? (await expandRetrievalQueries(userMessage, history));
  const perQueryLimit = Math.max(limit, 8);

  const semanticLists = await Promise.all(
    searchQueries.map((query) => semanticSearchChunks(userId, query, perQueryLimit)),
  );

  const keywordList = await keywordSearchChunks(userId, userMessage, perQueryLimit);

  const merged = reciprocalRankFusion([...semanticLists, keywordList], limit);

  return merged.map(({ chunkKey: _chunkKey, ...chunk }) => chunk);
}

/** @deprecated Use retrieveForChat — kept for compatibility */
export async function retrieveRelevantChunks(
  userId: string,
  userMessage: string,
  limit = CHAT_RETRIEVAL_LIMIT,
): Promise<RetrievedChunkContext[]> {
  return retrieveForChat(userId, userMessage, [], limit);
}
