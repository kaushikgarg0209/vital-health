"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const type = params.get("type");

    if (type === "signup" || params.has("access_token")) {
      router.replace(`/confirm#${hash}`);
    }
  }, [router]);

  return null;
}
