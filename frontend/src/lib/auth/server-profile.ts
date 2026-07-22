import { cookies } from "next/headers";
import type { Profile } from "@/types/profile";

const API_BASE = process.env.API_PROXY_URL ?? "http://localhost:3001";

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function getServerProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore);

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/profile`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: Profile };
    return payload.data ?? null;
  } catch {
    return null;
  }
}
