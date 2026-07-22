import Link from "next/link";
import { ArrowRight, Settings, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server-session";
import { getServerProfile } from "@/lib/auth/server-profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession();
  const profile = await getServerProfile();
  const firstName = profile?.fullName?.split(" ")[0] ?? session?.profile?.fullName?.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">
          {firstName ? `Welcome back, ${firstName}` : "Health Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your health summary will grow here as you add records and lab results.
        </p>
      </div>

      {profile ? (
        <Card className="border-primary-100 bg-gradient-to-r from-primary-50/80 to-white shadow-sm shadow-primary-100/40">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <UserRound className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-neutral-800">
                  {profile.fullName}
                </CardTitle>
                <CardDescription className="mt-1 text-neutral-500">
                  {profile.dateOfBirth
                    ? `Born ${profile.dateOfBirth}${profile.biologicalSex ? ` · ${profile.biologicalSex}` : ""}`
                    : "Complete your profile for better personalization"}
                </CardDescription>
              </div>
            </div>
            <Link
              href="/settings/profile"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden shrink-0 rounded-xl border-primary-200 bg-white sm:inline-flex",
              )}
            >
              <Settings className="size-4" />
              Edit profile
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Conditions
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-700">
                  {profile.knownConditions.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Allergies
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-700">
                  {profile.allergies.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Medications
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-700">
                  {profile.currentMedications.length}
                </p>
              </div>
            </div>
            <Link
              href="/settings/profile"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 sm:hidden"
            >
              Edit profile
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

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
