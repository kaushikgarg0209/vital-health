import Link from "next/link";
import {
  Activity,
  FileText,
  FlaskConical,
  MessageSquare,
  Users,
} from "lucide-react";
import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { VitalLogo } from "@/components/layout/vital-logo";
import { getServerSession } from "@/lib/auth/server-session";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/lab", label: "Lab Trends", icon: FlaskConical },
  { href: "/advocate", label: "AI Advocate", icon: MessageSquare },
  { href: "/family", label: "Family", icon: Users },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-neutral-200 px-5">
          <VitalLogo iconClassName="size-8 rounded-lg" labelClassName="text-base" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <p className="text-sm text-neutral-500">Your personal health advocate</p>
          {user ? <UserAccountMenu user={user} /> : null}
        </header>
        <main className="flex-1 bg-neutral-25 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
