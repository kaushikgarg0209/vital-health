import { VitalLogo } from "@/components/layout/vital-logo";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import { getServerUser } from "@/lib/auth/server-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-neutral-200 px-5">
          <VitalLogo href="/dashboard" iconClassName="size-8 rounded-lg" labelClassName="text-base" />
        </div>
        <div className="flex-1 p-4">
          <AppSidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 bg-neutral-25 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
