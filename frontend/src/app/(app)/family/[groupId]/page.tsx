import { redirect } from "next/navigation";
import { FamilyGroupPageContent } from "@/components/family/FamilyGroupPageContent";
import { getServerSession } from "@/lib/auth/server-session";

type FamilyGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function FamilyGroupPage({ params }: FamilyGroupPageProps) {
  const session = await getServerSession();
  const { groupId } = await params;

  if (!session?.user) {
    redirect(`/login?next=/family/${groupId}`);
  }

  return (
    <FamilyGroupPageContent groupId={groupId} currentUserId={session.user.id} />
  );
}
