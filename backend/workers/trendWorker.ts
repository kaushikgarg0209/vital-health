import { Worker } from "bullmq";
import { redisConnection } from "../src/config/redis.js";
import {
  TREND_PROCESS_JOB,
  TREND_QUEUE_NAME,
  type TrendJobPayload,
} from "../src/queues/trendQueue.js";
import { processTrendForBiomarker } from "../src/services/lab/labService.js";

export function createTrendWorker(): Worker<TrendJobPayload> {
  const worker = new Worker<TrendJobPayload>(
    TREND_QUEUE_NAME,
    async (job) => {
      const { userId, biomarkerKey } = job.data;

      console.log(`Processing trend for ${biomarkerKey} (user ${userId}, job ${job.id})`);

      await processTrendForBiomarker(userId, biomarkerKey);
    },
    {
      connection: redisConnection,
    },
  );

  worker.on("failed", (job, error) => {
    console.error(`Trend job ${job?.id} failed:`, error);
  });

  return worker;
}

export function startTrendWorker(): Worker<TrendJobPayload> {
  const worker = createTrendWorker();

  worker.on("ready", () => {
    console.log(`Trend worker listening on queue "${TREND_QUEUE_NAME}" (${TREND_PROCESS_JOB})`);
  });

  return worker;
}
