import type { ReactNode } from "react";
import { AdvocateSearchMock } from "@/components/marketing/ui-mocks/advocate-search-mock";
import { BillEobMock } from "@/components/marketing/ui-mocks/bill-eob-mock";
import { FamilyNetworkMock } from "@/components/marketing/ui-mocks/family-network-mock";
import { LabTrendMock } from "@/components/marketing/ui-mocks/lab-trend-mock";
import { RecordsExtractionMock } from "@/components/marketing/ui-mocks/records-extraction-mock";
import { WellnessPlanMock } from "@/components/marketing/ui-mocks/wellness-plan-mock";
import { cn } from "@/lib/utils";

type PlatformModule = {
  title: string;
  description: string;
  bullets: string[];
  mock: ReactNode;
  reverse?: boolean;
};

const modules: PlatformModule[] = [
  {
    title: "Records & document intelligence",
    description:
      "Upload once and let Vital classify, extract, and organize. Labs become biomarkers, prescriptions become structured medication lists, and bills become line items you can review alongside your care history.",
    bullets: [
      "PDF and image upload to private storage",
      "Automatic classification into nine document types",
      "Structured extraction for labs, Rx, bills, and EOBs",
    ],
    mock: <RecordsExtractionMock />,
  },
  {
    title: "Search & AI Advocate",
    description:
      "Ask questions in plain language. Vital retrieves relevant chunks from your records, combines them with structured lab and profile data, and streams answers with citations — not generic web advice.",
    bullets: [
      "Semantic search across all indexed documents",
      "Streaming RAG chat with conversation history",
      "Source citations linking back to your records",
    ],
    mock: <AdvocateSearchMock />,
    reverse: true,
  },
  {
    title: "Lab trends & biomarkers",
    description:
      "See how your markers change over time with reference ranges, status badges, trend direction, and AI insights. Get alerted when values shift meaningfully.",
    bullets: [
      "Dashboard of tracked biomarkers with status",
      "Per-marker history charts and insights",
      "Automated alerts and family notifications",
    ],
    mock: <LabTrendMock />,
  },
  {
    title: "Medical bills & insurance EOBs",
    description:
      "Extract totals, line items, and claim details from uploaded billing documents. Understand what was billed, covered, and owed — within your records, not a separate payments product.",
    bullets: [
      "Medical bill extraction with line items",
      "Insurance EOB parsing with claim status",
      "Displayed alongside your health timeline",
    ],
    mock: <BillEobMock />,
    reverse: true,
  },
  {
    title: "Family health network",
    description:
      "Invite trusted caregivers into care circles with permission tiers. Share summaries for monitoring or provide emergency briefs with medications, allergies, and contacts.",
    bullets: [
      "Email invitations with full, monitor, or emergency access",
      "Caregiver summary with labs, alerts, and prescriptions",
      "In-app notifications for biomarker changes",
    ],
    mock: <FamilyNetworkMock />,
  },
  {
    title: "Fitness & wellness planning",
    description:
      "Complete a wellness wizard and receive computed macro targets plus AI-generated 4-week plans with daily meal menus, activity guidance, and weekly coach check-ins.",
    bullets: [
      "TDEE and macro targets with lab-based adjustments",
      "7-day meal menus per week in each plan",
      "Weight tracking and weekly check-in feedback",
    ],
    mock: <WellnessPlanMock />,
    reverse: true,
  },
];

export function LandingPlatform() {
  return (
    <section id="platform" className="border-y border-neutral-200 bg-neutral-25 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Platform
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800 sm:text-4xl">
            Built for every part of your health journey
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            From raw documents to actionable insight — each module connects through one
            secure profile and one AI pipeline.
          </p>
        </div>

        <div className="mt-16 space-y-20">
          {modules.map((module) => (
            <div
              key={module.title}
              className={cn(
                "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
                module.reverse && "lg:[&>div:first-child]:order-2",
              )}
            >
              <div className="space-y-5">
                <h3 className="text-2xl font-semibold text-neutral-800">{module.title}</h3>
                <p className="text-base leading-relaxed text-neutral-500">{module.description}</p>
                <ul className="space-y-2">
                  {module.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-neutral-600">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div>{module.mock}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
