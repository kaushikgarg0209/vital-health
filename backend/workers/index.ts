import "dotenv/config";
import { redisConnection } from "../src/config/redis.js";
import { startDocumentWorker } from "./documentWorker.js";
import { startEmbeddingWorker } from "./embeddingWorker.js";
import { startTrendWorker } from "./trendWorker.js";

const documentWorker = startDocumentWorker();
const embeddingWorker = startEmbeddingWorker();
const trendWorker = startTrendWorker();

async function shutdown(): Promise<void> {
  console.log("Shutting down workers...");
  await Promise.all([
    documentWorker.close(),
    embeddingWorker.close(),
    trendWorker.close(),
  ]);
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
