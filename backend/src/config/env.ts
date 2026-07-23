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
