import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Activity className="size-5" />
        </div>
        <CardTitle className="text-2xl font-semibold text-neutral-700">
          Create your Vital account
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Registration will be wired up in Phase 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" type="text" placeholder="Jane Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
        <Button className="w-full bg-primary-600 hover:bg-primary-700" disabled>
          Create account
        </Button>
        <p className="text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
