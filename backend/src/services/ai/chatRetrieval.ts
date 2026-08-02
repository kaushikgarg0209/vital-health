import { supabaseAdmin } from "../../config/supabase.js";
import { CHAT_RETRIEVAL_LIMIT } from "../../config/gemini.js";
import type { RetrievedChunkContext } from "../../types/chat.js";
import { mapDocument, type DocumentRow } from "../../types/document.js";
import { generateEmbedding, searchSimilar } from "./embeddingService.js";
import { ChatError } from "../chatService.js";

export async function retrieveRelevantChunks(
  userId: string,
  userMessage: string,
  limit = CHAT_RETRIEVAL_LIMIT,
): Promise<RetrievedChunkContext[]> {
  const queryEmbedding = await generateEmbedding(userMessage, "RETRIEVAL_QUERY");
  const matches = await searchSimilar(userId, queryEmbedding, limit);

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
