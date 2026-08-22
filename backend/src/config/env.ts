import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3001),
    BASE_URL: z.string().url().optional(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    FRONTEND_URL: z.string().url().optional(),
    REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
    SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_CLASSIFICATION_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
    GEMINI_EXTRACTION_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
    GEMINI_EMBEDDING_MODEL: z.string().min(1).default("gemini-embedding-001"),
    EMBEDDING_CHUNK_SIZE: z.coerce.number().int().positive().default(3200),
    EMBEDDING_CHUNK_OVERLAP: z.coerce.number().int().nonnegative().default(400),
    EMBEDDING_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.62),
    GEMINI_CHAT_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
    CHAT_HISTORY_LIMIT: z.coerce.number().int().min(1).max(20).default(6),
    CHAT_RETRIEVAL_LIMIT: z.coerce.number().int().min(1).max(20).default(8),
    CHAT_RETRIEVAL_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.55),
    CHAT_QUERY_EXPANSION_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    LAB_INSIGHT_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
    LAB_TREND_DELTA_ALERT_PCT: z.coerce.number().positive().default(15),
    GEMINI_INSIGHT_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
    GEMINI_FITNESS_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
    GEMINI_FITNESS_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(16384),
  })
  .transform((data) => {
    const baseUrl =
      data.BASE_URL ?? `http://localhost:${data.PORT}/api/v1`;
    const apiPath = new URL(baseUrl).pathname.replace(/\/$/, "") || "/api/v1";

    return {
      ...data,
      BASE_URL: baseUrl,
      API_PATH: apiPath,
      FRONTEND_URL: data.FRONTEND_URL ?? "http://localhost:3000",
    };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
