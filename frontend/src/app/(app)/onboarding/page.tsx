import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/profile/onboarding-flow";
import { getServerSession } from "@/lib/auth/server-session";
import { getServerProfile } from "@/lib/auth/server-profile";
import { profileToFormValues } from "@/types/profile";

export default async function OnboardingPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?next=/onboarding");
  }

  if (session.profile?.hasCompletedSetup) {
    redirect("/dashboard");
  }

  const profile = await getServerProfile();

  const initialValues = profileToFormValues(
    profile,
    session.profile?.fullName ?? "",
  );

  return <OnboardingFlow initialValues={initialValues} />;
}
