import { Cookie, Database, Lock, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: Lock,
    title: "Private document storage",
    description:
      "Health files live in a non-public Supabase bucket. Access is through signed URLs tied to your session.",
  },
  {
    icon: Database,
    title: "Row Level Security",
    description:
      "Database policies ensure each user can only read and write their own health data.",
  },
  {
    icon: Cookie,
    title: "HttpOnly session cookies",
    description:
      "Authentication tokens are stored in secure cookies — not exposed in browser storage.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible AI",
    description:
      "The Advocate cites your records and includes emergency guardrails. Vital provides information, not medical advice.",
  },
];

export function LandingSecurity() {
  return (
    <section id="security" className="bg-neutral-25 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Security & privacy
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
            Designed for sensitive health data
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            Trust is foundational. Vital uses industry-standard patterns to keep your records
            private and your session secure.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-800">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
