import { redirect } from "next/navigation";
import { FitnessPageContent } from "@/components/fitness/FitnessPageContent";
import { getServerSession } from "@/lib/auth/server-session";

export default async function FitnessPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login?next=/fitness");
  }

  return <FitnessPageContent />;
}
