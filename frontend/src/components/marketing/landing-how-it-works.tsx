const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up, verify your email, and complete your health profile in minutes.",
  },
  {
    step: "02",
    title: "Upload your records",
    description: "Add lab reports, prescriptions, and visit documents to build your timeline.",
  },
  {
    step: "03",
    title: "Understand and act",
    description:
      "Explore trends, ask the Advocate, share with family, and follow your wellness plan.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-neutral-200 bg-neutral-25 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
            From signup to clarity in three steps
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
  );
}
