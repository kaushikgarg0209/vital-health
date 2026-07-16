import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <Badge className="bg-primary-50 text-primary-700 hover:bg-primary-50">
            Phase 0 — Frontend ready
          </Badge>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Activity className="size-6" />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-700">Vital</h1>
          </div>
          <p className="max-w-lg text-base text-neutral-500">
            Your personal health advocate. Organize records, track biomarkers, and
            get AI-powered guidance — all in one place.
          </p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Card className="border-neutral-100 text-left shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-neutral-700">
                Design system
              </CardTitle>
              <CardDescription className="text-sm text-neutral-400">
                Inter typography, primary blue palette, and shadcn/ui components
                are configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-primary-600">145</p>
              <p className="text-sm text-neutral-400">mg/dL — sample biomarker value</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-100 text-left shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-neutral-700">
                Stack ready
              </CardTitle>
              <CardDescription className="text-sm text-neutral-400">
                Next.js, Supabase client, TanStack Query, and Zustand are wired up.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary">Next.js 16</Badge>
              <Badge variant="secondary">Tailwind v4</Badge>
              <Badge variant="secondary">shadcn/ui</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className={buttonVariants({
              className: "bg-primary-600 text-white hover:bg-primary-700",
            })}
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "outline" })}>
            Create account
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
            View dashboard shell
          </Link>
        </div>
      </main>
    </div>
  );
}
