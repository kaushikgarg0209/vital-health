import Link from "next/link";
import {
  Activity,
  FileText,
  FlaskConical,
  MessageSquare,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/lab", label: "Lab Trends", icon: FlaskConical },
  { href: "/advocate", label: "AI Advocate", icon: MessageSquare },
  { href: "/family", label: "Family", icon: Users },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-100 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-100 px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Activity className="size-4" />
          </div>
          <span className="text-sm font-semibold text-neutral-700">Vital</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors duration-100 hover:bg-neutral-50 hover:text-neutral-700"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-6">
          <p className="text-sm text-neutral-400">Your personal health advocate</p>
          <LogoutButton />
        </header>
        <main className="flex-1 bg-neutral-25 p-6">{children}</main>
      </div>
    </div>
  );
}
