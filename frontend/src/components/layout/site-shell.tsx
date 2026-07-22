import { getServerUser } from "@/lib/auth/server-session";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type SiteShellProps = {
  children: React.ReactNode;
  headerVariant?: "default" | "transparent";
  hideFooter?: boolean;
};

export async function SiteShell({
  children,
  headerVariant = "default",
  hideFooter = false,
}: SiteShellProps) {
  const user = await getServerUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader user={user} variant={headerVariant} />
      <main className="flex-1">{children}</main>
      {!hideFooter ? <SiteFooter user={user} /> : null}
    </div>
  );
}
