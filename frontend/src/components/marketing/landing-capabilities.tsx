import {
  Activity,
  Brain,
  Dumbbell,
  FileHeart,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const capabilities = [
  {
    icon: FileHeart,
    title: "Health records hub",
    description: "Upload PDFs and images to a private, searchable timeline.",
  },
  {
    icon: Sparkles,
    title: "Intelligent extraction",
    description: "Nine document types — labs, prescriptions, bills, EOBs, and more.",
  },
  {
    icon: Search,
    title: "Semantic search",
    description: "Find information across all records with vector-powered search.",
  },
  {
    icon: Brain,
    title: "AI Advocate",
    description: "RAG chat with streaming answers and citations to your documents.",
  },
  {
    icon: Activity,
    title: "Lab trends",
    description: "Biomarker dashboard, charts, alerts, and AI-generated insights.",
  },
  {
    icon: Users,
    title: "Family network",
    description: "Care circles, caregiver summaries, and emergency health briefs.",
  },
  {
    icon: Dumbbell,
    title: "Fitness & wellness",
    description: "Macro targets, 4-week plans, 7-day meals, and weekly check-ins.",
  },
  {
    icon: ShieldCheck,
    title: "Security & privacy",
    description: "Row Level Security, HttpOnly sessions, and chat emergency guardrails.",
  },
];

export function LandingCapabilities() {
  return (
    <section id="capabilities" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
            Everything in one health workspace
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            Vital is a full-stack platform — not a folder of PDFs. Records, intelligence,
            collaboration, and wellness in one cohesive experience.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, description }) => (
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
  );
}
