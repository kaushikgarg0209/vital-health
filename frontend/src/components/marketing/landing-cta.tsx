import { MarketingCtaButtons } from "@/components/layout/marketing-cta-buttons";
import type { AuthUser } from "@/types/auth";

type LandingCtaProps = {
  user: AuthUser | null;
};

export function LandingCta({ user }: LandingCtaProps) {
  return (
    <section className="bg-neutral-900 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ready to take control of your health data?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-400">
          Organize records, track biomarkers, ask the AI Advocate, coordinate with family,
          and follow a personalized wellness plan — all in one secure workspace.
        </p>
        <MarketingCtaButtons user={user} variant="footer" />
      </div>
    </section>
  );
}
