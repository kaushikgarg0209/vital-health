import "dotenv/config";
import { redisConnection } from "../src/config/redis.js";
import { startDocumentWorker } from "./documentWorker.js";

const worker = startDocumentWorker();

async function shutdown(): Promise<void> {
  console.log("Shutting down document worker...");
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
