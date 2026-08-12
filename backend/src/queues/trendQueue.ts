import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const TREND_QUEUE_NAME = "trend-processing";
export const TREND_PROCESS_JOB = "TREND_PROCESS";

export type TrendJobPayload = {
  userId: string;
  biomarkerKey: string;
};

export const trendQueue = new Queue<TrendJobPayload>(TREND_QUEUE_NAME, {
  connection: redisConnection,
});
