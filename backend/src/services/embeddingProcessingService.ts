import { generateEmbeddings, hashContent, storeChunks, chunkText } from "./ai/embeddingService.js";
import { getDocumentForProcessing } from "./documentService.js";
import { buildDocumentSearchText } from "./documentTextService.js";

export class EmbeddingProcessingError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "EmbeddingProcessingError";
  }
}

export async function processDocumentEmbeddings(
  documentId: string,
  userId: string,
): Promise<void> {
  const document = await getDocumentForProcessing(documentId);

  if (!document) {
    throw new EmbeddingProcessingError(`Document ${documentId} not found`, false);
  }

  if (document.user_id !== userId) {
    throw new EmbeddingProcessingError(
      `Document ${documentId} does not belong to user ${userId}`,
      false,
    );
  }

  if (document.processing_status !== "completed") {
    console.log(`Document ${documentId} not completed — skipping embeddings`);
    return;
  }

  const searchText = await buildDocumentSearchText(
    userId,
    documentId,
    document.document_type,
    document.processing_status,
  );

  if (!searchText) {
    console.log(`Document ${documentId} has no searchable text — skipping embeddings`);
    return;
  }

  const chunks = chunkText(searchText);

  if (chunks.length === 0) {
    console.log(`Document ${documentId} produced no chunks — skipping embeddings`);
    return;
  }

  const embeddings = await generateEmbeddings(chunks, "RETRIEVAL_DOCUMENT");

  const chunksWithEmbeddings = chunks.map((content, index) => ({
    content,
    contentHash: hashContent(content),
    embedding: embeddings[index]!,
  }));

  await storeChunks(documentId, userId, chunksWithEmbeddings);

  console.log(`Document ${documentId} embedded into ${chunksWithEmbeddings.length} chunk(s)`);
}
