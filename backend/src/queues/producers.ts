import {
  DOCUMENT_PROCESS_JOB,
  documentQueue,
  type DocumentJobPayload,
} from "./documentQueue.js";

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
