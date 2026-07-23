import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const DOCUMENT_QUEUE_NAME = "document-processing";
export const DOCUMENT_PROCESS_JOB = "DOCUMENT_PROCESS";

export type DocumentJobPayload = {
  documentId: string;
  userId: string;
};

export const documentQueue = new Queue<DocumentJobPayload>(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
});
