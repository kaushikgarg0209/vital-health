import { Worker } from "bullmq";
import { redisConnection } from "../src/config/redis.js";
import {
  DOCUMENT_PROCESS_JOB,
  DOCUMENT_QUEUE_NAME,
  type DocumentJobPayload,
} from "../src/queues/documentQueue.js";
import { updateDocumentProcessingStatus } from "../src/services/documentService.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createDocumentWorker(): Worker<DocumentJobPayload> {
  const worker = new Worker<DocumentJobPayload>(
    DOCUMENT_QUEUE_NAME,
    async (job) => {
      const { documentId } = job.data;

      console.log(`Processing document ${documentId}`);

      await updateDocumentProcessingStatus(documentId, "processing");
      await sleep(2000);
      await updateDocumentProcessingStatus(documentId, "completed");

      console.log(`Document ${documentId} processed`);
    },
    {
      connection: redisConnection,
    },
  );

  worker.on("failed", async (job, error) => {
    console.error(`Document job ${job?.id} failed:`, error);

    if (job?.data.documentId) {
      try {
        await updateDocumentProcessingStatus(job.data.documentId, "failed");
      } catch (updateError) {
        console.error("Failed to mark document as failed:", updateError);
      }
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
