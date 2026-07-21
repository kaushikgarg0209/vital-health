import {
  Activity,
  Brain,
  FileHeart,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { VitalLogo } from "./vital-logo";

const highlights = [
  {
    icon: FileHeart,
    title: "Unified health records",
    description: "Labs, visits, and documents in one timeline.",
  },
  {
    icon: LineChart,
    title: "Biomarker tracking",
    description: "Spot trends before they become problems.",
  },
  {
    icon: Brain,
    title: "AI health advocate",
    description: "Clear answers grounded in your own data.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description: "Your data stays encrypted and under your control.",
  },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-neutral-900 lg:flex lg:min-h-full lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 size-80 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-primary-700/25 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-black/10" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-10 p-8 xl:p-10">
        <VitalLogo
          href="/"
          labelClassName="text-white"
          iconClassName="shadow-primary-500/30"
        />

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-primary-100">
            <Activity className="size-3.5" />
            Personal health platform
          </div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Health clarity, not health chaos.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-neutral-300">
            Vital helps you understand your body with organized records,
            meaningful trends, and an AI advocate that speaks your language.
          </p>
        </div>

        <ul className="space-y-5">
          {highlights.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-100 ring-1 ring-white/10">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 border-t border-white/10 px-8 py-5 text-sm text-neutral-500 xl:px-10">
        Trusted by people building a long-term view of their health.
      </div>
    </div>
  );
}
