import { Activity, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingCtaButtons } from "@/components/layout/marketing-cta-buttons";
import { DashboardPreviewMock } from "@/components/marketing/ui-mocks/dashboard-preview-mock";
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/types/auth";

type LandingHeroProps = {
  user: AuthUser | null;
};

export function LandingHero({ user }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-primary-50/70 via-white to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 size-[32rem] rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-80 rounded-full bg-primary-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div className="space-y-8">
          <Badge className="border-primary-200 bg-white/80 text-primary-700 shadow-sm hover:bg-white/80">
            <Sparkles className="mr-1.5 size-3.5" />
            Your data. Your answers.
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-800 sm:text-5xl lg:text-[3.25rem]">
              One place for your health records, trends, and AI guidance.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-neutral-500">
              Upload labs and medical documents once. Vital extracts structured data, powers
              semantic search and the AI Advocate, tracks biomarkers, coordinates family care,
              and builds personalized wellness plans — all grounded in your own records.
            </p>
          </div>

          <MarketingCtaButtons user={user} variant="hero" />

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary-600" />
              Private storage & RLS
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary-600" />
              Answers with source citations
            </span>
            <span className="flex items-center gap-2">
              <Activity className="size-4 text-primary-600" />
              Supabase + Google Gemini
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/10 to-primary-700/5 blur-2xl" />
          <DashboardPreviewMock />
        </div>
      </div>
    </section>
  );
}
