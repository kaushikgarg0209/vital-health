import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";

export type ConnectionCheck = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

function formatConnectionError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause;

    if (cause instanceof Error && "code" in cause) {
      const code = String((cause as NodeJS.ErrnoException).code);
      return `${error.message} (${code})`;
    }

    return error.message;
  }

  return "Unknown connection error";
}

async function verifyPostgrestConnection(
  startedAt = Date.now()
): Promise<ConnectionCheck> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    return {
      ok: false,
      latencyMs,
      error: `PostgREST returned HTTP ${response.status}`,
    };
  }

  return { ok: true, latencyMs };
}

export async function verifyDatabaseConnection(): Promise<ConnectionCheck> {
  const start = Date.now();

  try {
    const { error } = await supabaseAdmin.from("profiles").select("id", {
      head: true,
      count: "exact",
    });

    const latencyMs = Date.now() - start;

    if (error?.code === "PGRST205") {
      return verifyPostgrestConnection(start);
    }

    if (error) {
      return { ok: false, latencyMs, error: error.message };
    }

    return { ok: true, latencyMs };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: formatConnectionError(error),
    };
  }
}

export async function getHealthStatus() {
  const database = await verifyDatabaseConnection();

  return {
    status: database.ok ? "ok" : "degraded",
    message: "Server is running",
    checks: {
      database: {
        status: database.ok ? "ok" : "error",
        latencyMs: database.latencyMs,
        ...(database.error && { error: database.error }),
      },
    },
  };
}
