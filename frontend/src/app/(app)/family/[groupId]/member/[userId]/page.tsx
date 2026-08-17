import { redirect } from "next/navigation";
import { FamilyMemberPageContent } from "@/components/family/FamilyMemberPageContent";
import { getServerSession } from "@/lib/auth/server-session";

type FamilyMemberPageProps = {
  params: Promise<{ groupId: string; userId: string }>;
};

export default async function FamilyMemberPage({ params }: FamilyMemberPageProps) {
  const session = await getServerSession();
  const { groupId, userId } = await params;

  if (!session?.user) {
    redirect(`/login?next=/family/${groupId}/member/${userId}`);
  }

  return <FamilyMemberPageContent groupId={groupId} memberUserId={userId} />;
}
