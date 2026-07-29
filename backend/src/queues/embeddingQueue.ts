import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const EMBEDDING_QUEUE_NAME = "embedding-processing";
export const GENERATE_EMBEDDINGS_JOB = "GENERATE_EMBEDDINGS";

export type EmbeddingJobPayload = {
  documentId: string;
  userId: string;
};

export const embeddingQueue = new Queue<EmbeddingJobPayload>(EMBEDDING_QUEUE_NAME, {
  connection: redisConnection,
});
