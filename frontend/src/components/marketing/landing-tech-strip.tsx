const technologies = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "PostgreSQL",
  "pgvector",
  "Google Gemini",
  "Redis",
  "BullMQ",
  "Express 5",
];

export function LandingTechStrip() {
  return (
    <section id="technology" className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Built with
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-800 sm:text-3xl">
            A modern full-stack health platform
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Production-grade architecture with async workers, vector search, and structured AI
            extraction — designed for real health data workflows.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-neutral-200 bg-neutral-25 px-3 py-1.5 text-sm text-neutral-600"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
