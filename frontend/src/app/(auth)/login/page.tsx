import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-neutral-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
