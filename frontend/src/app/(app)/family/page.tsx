import { redirect } from "next/navigation";
import { FamilyPageContent } from "@/components/family/FamilyPageContent";
import { getServerSession } from "@/lib/auth/server-session";

export default async function FamilyPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login?next=/family");
  }

  return <FamilyPageContent currentUserId={session.user.id} currentUserEmail={session.user.email} />;
}
