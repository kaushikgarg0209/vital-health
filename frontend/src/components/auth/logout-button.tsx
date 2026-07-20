"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}
