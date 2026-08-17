import { AlertTriangle, Phone, Stethoscope, User } from "lucide-react";
import type { EmergencyBrief } from "@/types/family";

type EmergencyBriefProps = {
  brief: EmergencyBrief;
};

function InfoBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 text-sm font-semibold text-red-700"
            : "mt-1 text-sm text-neutral-800"
        }
      >
        {value}
      </p>
    </div>
  );
}

function TagList({ label, items, variant }: { label: string; items: string[]; variant?: "danger" }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="mt-1 text-sm text-neutral-500">None listed</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={
              variant === "danger"
                ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmergencyBrief({ brief }: EmergencyBriefProps) {
  const ageDisplay = brief.dateOfBirth
    ? `DOB ${brief.dateOfBirth}${brief.biologicalSex ? ` · ${brief.biologicalSex}` : ""}`
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-white shadow-sm print:border-red-400">
      <div className="border-b border-red-100 bg-red-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Emergency health brief
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-neutral-900">{brief.fullName}</h2>
            {ageDisplay ? <p className="mt-1 text-sm text-neutral-600">{ageDisplay}</p> : null}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <TagList label="Allergies" items={brief.allergies} variant="danger" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoBlock label="Blood type" value={brief.bloodType} highlight />
          <InfoBlock
            label="Height / Weight"
            value={
              brief.heightCm || brief.weightKg
                ? [brief.heightCm ? `${brief.heightCm} cm` : null, brief.weightKg ? `${brief.weightKg} kg` : null]
                    .filter(Boolean)
                    .join(" · ")
                : null
            }
          />
          <InfoBlock label="Primary care doctor" value={brief.primaryCareDoctor} />
        </div>

        <TagList label="Known conditions" items={brief.knownConditions} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Current medications
          </p>
          {brief.currentMedications.length === 0 && brief.activePrescriptions.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">None listed</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(brief.activePrescriptions.length > 0
                ? brief.activePrescriptions.map((rx) => ({
                    key: rx.medicationName,
                    line: [rx.medicationName, rx.dosage, rx.frequency, rx.prescribingDoctor]
                      .filter(Boolean)
                      .join(" · "),
                  }))
                : brief.currentMedications.map((med) => ({ key: med, line: med }))
              ).map((item) => (
                <li key={item.key} className="text-sm text-neutral-800">
                  {item.line}
                </li>
              ))}
            </ul>
          )}
        </div>

        {(brief.emergencyContactName || brief.emergencyContactPhone) && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-25 p-4">
            <div className="flex items-center gap-2 text-neutral-700">
              <User className="size-4" />
              <p className="text-sm font-medium">Emergency contact</p>
            </div>
            {brief.emergencyContactName ? (
              <p className="mt-2 text-sm text-neutral-800">{brief.emergencyContactName}</p>
            ) : null}
            {brief.emergencyContactPhone ? (
              <a
                href={`tel:${brief.emergencyContactPhone}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Phone className="size-3.5" />
                {brief.emergencyContactPhone}
              </a>
            ) : null}
          </div>
        )}

        {brief.primaryCareDoctor ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Stethoscope className="size-4 shrink-0" />
            <span>PCP: {brief.primaryCareDoctor}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
