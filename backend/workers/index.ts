import "dotenv/config";
import { redisConnection } from "../src/config/redis.js";
import { startDocumentWorker } from "./documentWorker.js";
import { startEmbeddingWorker } from "./embeddingWorker.js";

const documentWorker = startDocumentWorker();
const embeddingWorker = startEmbeddingWorker();

async function shutdown(): Promise<void> {
  console.log("Shutting down workers...");
  await Promise.all([documentWorker.close(), embeddingWorker.close()]);
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
