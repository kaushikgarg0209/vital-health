import { Worker } from "bullmq";
import { redisConnection } from "../src/config/redis.js";
import {
  DOCUMENT_PROCESS_JOB,
  DOCUMENT_QUEUE_NAME,
  type DocumentJobPayload,
} from "../src/queues/documentQueue.js";
import { processDocument } from "../src/services/documentProcessingService.js";
import { updateDocumentProcessingStatus } from "../src/services/documentService.js";

export function createDocumentWorker(): Worker<DocumentJobPayload> {
  const worker = new Worker<DocumentJobPayload>(
    DOCUMENT_QUEUE_NAME,
    async (job) => {
      const { documentId, userId } = job.data;

      console.log(`Processing document ${documentId} (job ${job.id})`);

      await processDocument(documentId, userId);
    },
    {
      connection: redisConnection,
    },
  );

  worker.on("failed", async (job, error) => {
    console.error(`Document job ${job?.id} failed:`, error);

    if (!job?.data.documentId) {
      return;
    }

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade < maxAttempts) {
      console.log(
        `Document ${job.data.documentId} will retry (${job.attemptsMade}/${maxAttempts})`,
      );
      return;
    }

    try {
      await updateDocumentProcessingStatus(job.data.documentId, "failed");
    } catch (updateError) {
      console.error("Failed to mark document as failed:", updateError);
    }
  });

  return worker;
}

export function startDocumentWorker(): Worker<DocumentJobPayload> {
  const worker = createDocumentWorker();

  worker.on("ready", () => {
    console.log(`Document worker listening on queue "${DOCUMENT_QUEUE_NAME}" (${DOCUMENT_PROCESS_JOB})`);
  });

  return worker;
}
