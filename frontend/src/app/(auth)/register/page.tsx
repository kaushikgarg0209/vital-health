import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-neutral-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
