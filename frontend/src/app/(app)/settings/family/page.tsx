import { redirect } from "next/navigation";
import { SettingsFamilyPageContent } from "@/components/settings/SettingsFamilyPageContent";
import { getServerSession } from "@/lib/auth/server-session";

export default async function SettingsFamilyPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login?next=/settings/family");
  }

  return <SettingsFamilyPageContent currentUserId={session.user.id} />;
}
