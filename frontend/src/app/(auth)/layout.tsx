import { getServerSession } from "@/lib/auth/server-session";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader user={user} />
      <div className="flex flex-1 bg-gradient-to-b from-neutral-50 via-neutral-25 to-neutral-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
          <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)] ring-1 ring-neutral-900/[0.04] lg:grid-cols-2 lg:min-h-[620px]">
            <AuthBrandPanel />
            <div className="relative flex items-center justify-center px-6 py-10 sm:px-8 lg:px-10 xl:px-14">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-8 left-0 hidden w-px bg-gradient-to-b from-transparent via-neutral-200/80 to-transparent lg:block"
              />
              <div className="w-full max-w-md">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter user={user} />
    </div>
  );
}
