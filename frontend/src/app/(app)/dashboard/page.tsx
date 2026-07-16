import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-700">Health Dashboard</h1>
        <p className="text-sm text-neutral-400">
          Your health summary will appear here in later phases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {["Records", "Biomarkers", "AI Insights"].map((title) => (
          <Card key={title} className="border-neutral-100 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-neutral-700">
                {title}
              </CardTitle>
              <CardDescription className="text-neutral-400">Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-neutral-300">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
