import { ArrowRight, FileUp, MessageSquareQuote, Search, Sparkles, Tags } from "lucide-react";

const steps = [
  {
    icon: FileUp,
    title: "Upload document",
    description: "Add labs, prescriptions, bills, or imaging reports.",
  },
  {
    icon: Tags,
    title: "AI classifies type",
    description: "Gemini identifies the document category automatically.",
  },
  {
    icon: Sparkles,
    title: "Extract structured data",
    description: "Biomarkers, medications, and billing fields are parsed.",
  },
  {
    icon: Search,
    title: "Index for search",
    description: "Text is chunked and embedded for semantic retrieval.",
  },
  {
    icon: MessageSquareQuote,
    title: "Ask with citations",
    description: "The Advocate answers using your indexed records.",
  },
];

export function LandingAiPipeline() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            AI pipeline
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
            From upload to insight in five steps
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            Background workers process documents asynchronously so your dashboard stays fast
            while intelligence builds in the background.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-25 p-5 shadow-sm">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-neutral-800">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-neutral-300 md:block" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
