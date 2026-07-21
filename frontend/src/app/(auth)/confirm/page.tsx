import { ConfirmEmailForm } from "@/components/auth/confirm-email-form";
import {
  confirmEmailFromToken,
  resolveConfirmStateFromParams,
} from "@/lib/auth/confirm-email";

type ConfirmPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConfirmEmailPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const resolved = resolveConfirmStateFromParams(params);

  if (resolved === "pending") {
    const tokenHash = params.token_hash as string;
    const type = params.type as string;
    const initialState = await confirmEmailFromToken(tokenHash, type);

    return <ConfirmEmailForm initialState={initialState} />;
  }

  return <ConfirmEmailForm initialState={resolved} />;
}
