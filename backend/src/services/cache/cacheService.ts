import { redisConnection } from "../../config/redis.js";

export function insightCacheKey(userId: string, biomarkerKey: string): string {
  return `insight:${userId}:${biomarkerKey}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redisConnection.get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    await redisConnection.del(key);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await redisConnection.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await redisConnection.del(key);
}
