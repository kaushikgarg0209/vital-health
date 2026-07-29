import { parseDocument } from "./ai/documentParser.js";
import { addEmbeddingJob } from "../queues/producers.js";
import {
  DocumentError,
  getDocumentForProcessing,
  updateDocumentProcessingStatus,
} from "./documentService.js";
import { persistExtraction } from "./documentExtractionPersistence.js";
import { downloadFile } from "../utils/supabaseStorage.js";

export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "DocumentProcessingError";
  }
}

export async function processDocument(documentId: string, userId: string): Promise<void> {
  const document = await getDocumentForProcessing(documentId);

  if (!document) {
    throw new DocumentProcessingError(`Document ${documentId} not found`, false);
  }

  if (document.user_id !== userId) {
    throw new DocumentProcessingError(
      `Document ${documentId} does not belong to user ${userId}`,
      false,
    );
  }

  if (document.processing_status === "completed") {
    console.log(`Document ${documentId} already completed — skipping`);
    return;
  }

  await updateDocumentProcessingStatus(documentId, "processing");

  try {
    const buffer = await downloadFile(document.storage_path);
    const { classification, extraction } = await parseDocument(buffer, document.file_mime_type);

    await persistExtraction(document, classification, extraction);
    await updateDocumentProcessingStatus(documentId, "completed");

    try {
      await addEmbeddingJob({ documentId, userId });
    } catch (queueError) {
      console.error(`Failed to enqueue embedding job for document ${documentId}:`, queueError);
    }

    console.log(
      `Document ${documentId} processed as ${classification.type} (confidence ${classification.confidence})`,
    );
  } catch (error) {
    if (error instanceof DocumentError) {
      throw new DocumentProcessingError(error.message);
    }

    throw error;
  }
}
