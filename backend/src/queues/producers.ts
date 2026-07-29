import {
  DOCUMENT_PROCESS_JOB,
  documentQueue,
  type DocumentJobPayload,
} from "./documentQueue.js";
import {
  GENERATE_EMBEDDINGS_JOB,
  embeddingQueue,
  type EmbeddingJobPayload,
} from "./embeddingQueue.js";

export async function addDocumentJob(payload: DocumentJobPayload): Promise<string> {
  const job = await documentQueue.add(DOCUMENT_PROCESS_JOB, payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  });

  if (!job.id) {
    throw new Error("Failed to enqueue document processing job");
  }

  return String(job.id);
}

export async function addEmbeddingJob(payload: EmbeddingJobPayload): Promise<string> {
  const job = await embeddingQueue.add(GENERATE_EMBEDDINGS_JOB, payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  });

  if (!job.id) {
    throw new Error("Failed to enqueue embedding job");
  }

  return String(job.id);
}
