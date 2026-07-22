import { redirect } from "next/navigation";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { getServerSession } from "@/lib/auth/server-session";
import { getServerProfile } from "@/lib/auth/server-profile";
import { profileToFormValues } from "@/types/profile";

export default async function ProfileSettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?next=/settings/profile");
  }

  const profile = await getServerProfile();

  const initialValues = profileToFormValues(
    profile,
    session.profile?.fullName ?? "",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings", href: "/settings/profile" },
            { label: "Health profile" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Health profile</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Update the details Vital uses to personalize your dashboard, lab interpretation,
            and AI advocate.
          </p>
        </div>
      </div>

      <ProfileSettingsForm initialValues={initialValues} />
    </div>
  );
}
