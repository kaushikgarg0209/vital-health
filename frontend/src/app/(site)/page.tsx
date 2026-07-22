import {
  Activity,
  Brain,
  FileHeart,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthHashRedirect } from "@/components/auth/auth-hash-redirect";
import { MarketingCtaButtons } from "@/components/layout/marketing-cta-buttons";
import { getServerUser } from "@/lib/auth/server-session";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: FileHeart,
    title: "Health records hub",
    description:
      "Upload labs, imaging reports, and visit notes. Vital organizes everything into a searchable timeline.",
  },
  {
    icon: LineChart,
    title: "Biomarker intelligence",
    description:
      "Track glucose, lipids, hormones, and more. See what changed, when, and why it matters.",
  },
  {
    icon: Brain,
    title: "AI health advocate",
    description:
      "Ask questions in plain language and get answers grounded in your records — not generic web advice.",
  },
  {
    icon: ShieldCheck,
    title: "Security first",
    description:
      "Encrypted storage, verified sign-in, and privacy controls designed for sensitive health data.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in minutes and verify your email to get started.",
  },
  {
    step: "02",
    title: "Add your health data",
    description: "Import labs and records to build your personal health profile.",
  },
  {
    step: "03",
    title: "Understand and act",
    description: "Review trends, get insights, and bring clearer questions to your care team.",
  },
];

export default async function Home() {
  const user = await getServerUser();

  return (
    <>
      <AuthHashRedirect />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 size-[32rem] rounded-full bg-primary-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-80 rounded-full bg-primary-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="space-y-8">
            <Badge className="border-primary-200 bg-white/80 text-primary-700 shadow-sm hover:bg-white/80">
              <Sparkles className="mr-1.5 size-3.5" />
              Your personal health advocate
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-800 sm:text-5xl lg:text-[3.25rem]">
                Take control of your health with clarity and confidence.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-neutral-500">
                Vital brings your records, biomarkers, and AI guidance into one
                professional workspace — so you always know where you stand.
              </p>
            </div>

            <MarketingCtaButtons user={user} variant="hero" />

            <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary-600" />
                Secure by design
              </span>
              <span className="flex items-center gap-2">
                <Activity className="size-4 text-primary-600" />
                Built for long-term tracking
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/10 to-primary-700/5 blur-2xl" />
            <Card className="relative overflow-hidden border-neutral-200/80 shadow-xl shadow-neutral-900/5">
              <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-400/80" />
                  <div className="size-2.5 rounded-full bg-amber-400/80" />
                  <div className="size-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs text-neutral-400">Vital Dashboard</span>
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-neutral-100 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      LDL Cholesterol
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-800">
                      118
                      <span className="ml-1 text-base font-normal text-neutral-400">mg/dL</span>
                    </p>
                    <p className="mt-1 text-xs text-emerald-600">↓ 12% vs last quarter</p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      Health score
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-primary-600">
                      84
                      <span className="ml-1 text-base font-normal text-neutral-400">/ 100</span>
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">Based on recent labs</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
                      <Brain className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">AI Advocate insight</p>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                        Your LDL trend is improving. Consider discussing maintenance
                        strategies with your clinician at your next visit.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
              Everything you need for a complete health picture
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              Vital is designed like a modern health platform — not a folder of PDFs.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="border-neutral-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-neutral-800">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-neutral-500">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-neutral-200 bg-neutral-25 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
              From signup to insight in three steps
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {steps.map(({ step, title, description }) => (
              <div
                key={step}
                className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
              >
                <p className="text-sm font-semibold tabular-nums text-primary-600">{step}</p>
                <h3 className="mt-4 text-xl font-semibold text-neutral-800">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to build your health baseline?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-400">
            Join Vital and start organizing your health data with the clarity of a
            platform built for the long run.
          </p>
          <MarketingCtaButtons user={user} variant="footer" />
        </div>
      </section>
    </>
  );
}
