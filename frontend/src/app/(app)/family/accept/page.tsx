import { FamilyInvitationPanel } from "@/components/family/FamilyInvitationPanel";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import type { PermissionLevel } from "@/lib/tokens";

type FamilyAcceptPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readToken(
  params: Record<string, string | string[] | undefined>,
): string | null {
  const raw = params.token;
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  return null;
}

function readHint(
  params: Record<string, string | string[] | undefined>,
): { subjectName?: string; permissionLevel?: PermissionLevel } | undefined {
  const subjectName =
    typeof params.subject === "string" && params.subject.length > 0
      ? params.subject
      : undefined;
  const permissionLevel =
    params.level === "full" || params.level === "monitor" || params.level === "emergency"
      ? params.level
      : undefined;

  if (!subjectName && !permissionLevel) {
    return undefined;
  }

  return { subjectName, permissionLevel };
}

export default async function FamilyAcceptPage({ searchParams }: FamilyAcceptPageProps) {
  const params = await searchParams;
  const token = readToken(params);
  const hint = readHint(params);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Family", href: "/family" },
          { label: "Invitation" },
        ]}
      />
      <FamilyInvitationPanel token={token} hint={hint} />
    </div>
  );
}
