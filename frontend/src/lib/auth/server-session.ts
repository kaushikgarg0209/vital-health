import { cookies } from "next/headers";
import type { AuthUser, SessionResponse } from "@/types/auth";

const API_BASE = process.env.API_PROXY_URL ?? "http://localhost:3001";

async function fetchSession(cookieHeader: string): Promise<SessionResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: SessionResponse;
    };

    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  return fetchSession(cookieHeader);
}

export async function getServerUser(): Promise<AuthUser | null> {
  const session = await getServerSession();
  return session?.user ?? null;
}
