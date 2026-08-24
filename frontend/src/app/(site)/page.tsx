import { AuthHashRedirect } from "@/components/auth/auth-hash-redirect";
import { LandingAiPipeline } from "@/components/marketing/landing-ai-pipeline";
import { LandingCapabilities } from "@/components/marketing/landing-capabilities";
import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingPlatform } from "@/components/marketing/landing-platform";
import { LandingSecurity } from "@/components/marketing/landing-security";
import { LandingTechStrip } from "@/components/marketing/landing-tech-strip";
import { getServerUser } from "@/lib/auth/server-session";

export default async function Home() {
  const user = await getServerUser();

  return (
    <>
      <AuthHashRedirect />
      <LandingHero user={user} />
      <LandingCapabilities />
      <LandingPlatform />
      <LandingAiPipeline />
      <LandingHowItWorks />
      <LandingTechStrip />
      <LandingSecurity />
      <LandingCta user={user} />
    </>
  );
}
