import { Worker } from "bullmq";
import { redisConnection } from "../src/config/redis.js";
import {
  EMBEDDING_QUEUE_NAME,
  GENERATE_EMBEDDINGS_JOB,
  type EmbeddingJobPayload,
} from "../src/queues/embeddingQueue.js";
import { processDocumentEmbeddings } from "../src/services/embeddingProcessingService.js";

export function createEmbeddingWorker(): Worker<EmbeddingJobPayload> {
  const worker = new Worker<EmbeddingJobPayload>(
    EMBEDDING_QUEUE_NAME,
    async (job) => {
      const { documentId, userId } = job.data;

      console.log(`Generating embeddings for document ${documentId} (job ${job.id})`);

      await processDocumentEmbeddings(documentId, userId);
    },
    {
      connection: redisConnection,
    },
  );

  worker.on("failed", (job, error) => {
    console.error(`Embedding job ${job?.id} failed:`, error);
  });

  return worker;
}

export function startEmbeddingWorker(): Worker<EmbeddingJobPayload> {
  const worker = createEmbeddingWorker();

  worker.on("ready", () => {
    console.log(
      `Embedding worker listening on queue "${EMBEDDING_QUEUE_NAME}" (${GENERATE_EMBEDDINGS_JOB})`,
    );
  });

  return worker;
}
