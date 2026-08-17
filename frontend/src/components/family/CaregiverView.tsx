import { AlertTriangle, FileText, Pill } from "lucide-react";
import { CaregiverBiomarkerCard } from "@/components/family/CaregiverBiomarkerCard";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { alertTypeLabel, formatBiomarkerKey, formatLabDate } from "@/lib/lab-utils";
import type { CaregiverSummary } from "@/types/family";
import type { TrackedBiomarker } from "@/types/lab";

type CaregiverViewProps = {
  summary: CaregiverSummary;
  memberName: string;
};

export function CaregiverView({ summary, memberName }: CaregiverViewProps) {
  const allBiomarkers = summary.biomarkers.categories.flatMap(
    (category) => category.biomarkers,
  ) as TrackedBiomarker[];

  const biomarkerMeta = new Map(
    allBiomarkers.map((biomarker) => [biomarker.biomarkerKey, biomarker]),
  );

  const hasPrescriptions = summary.activePrescriptions.length > 0;
  const hasProfileMeds = summary.currentMedications.length > 0;
  const hasMedications = hasPrescriptions || hasProfileMeds;
  const showRecords = summary.permissionLevel === "full";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Biomarker overview</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Latest tracked values for {memberName}.
          </p>
        </div>

        {allBiomarkers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-500">
            No biomarkers tracked yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allBiomarkers.map((biomarker) => (
              <CaregiverBiomarkerCard key={biomarker.biomarkerKey} biomarker={biomarker} />
            ))}
          </div>
        )}
      </section>

      {summary.alerts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Recent alerts</h2>
          </div>
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
            {summary.alerts.map((alert) => {
              const meta = biomarkerMeta.get(alert.biomarkerKey);
              const displayName = meta?.displayName ?? formatBiomarkerKey(alert.biomarkerKey);
              const unit = meta?.unit ?? "";

              return (
                <li key={alert.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{displayName}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {alertTypeLabel(alert.alertType)}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-neutral-700">
                        {alert.previousValue ?? "—"}
                        {unit ? ` ${unit}` : ""} → {alert.newValue ?? "—"}
                        {unit ? ` ${unit}` : ""}
                      </p>
                    </div>
                    {alert.newStatus ? (
                      <BiomarkerStatusBadge status={alert.newStatus} size="sm" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {hasMedications || showRecords ? (
        <section
          className={
            hasMedications && showRecords ? "grid gap-4 lg:grid-cols-2" : "space-y-4"
          }
        >
          {hasMedications ? (
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Pill className="size-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Active medications</h2>
              </div>
              {hasPrescriptions ? (
                <ul className="mt-4 space-y-3">
                  {summary.activePrescriptions.map((prescription) => (
                    <li
                      key={prescription.medicationName}
                      className="rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-neutral-800">
                        {prescription.medicationName}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {[prescription.dosage, prescription.frequency].filter(Boolean).join(" · ") ||
                          "Dosage not specified"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-4 space-y-2">
                  {summary.currentMedications.map((medication) => (
                    <li
                      key={medication}
                      className="rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2 text-sm text-neutral-800"
                    >
                      {medication}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {showRecords ? (
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Recent records</h2>
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                {summary.lastDocumentDate
                  ? `Most recent document uploaded on ${formatLabDate(summary.lastDocumentDate)}. Summary only — contact ${memberName} for document details.`
                  : "No documents uploaded yet."}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {summary.permissionLevel === "monitor" ? (
        <p className="text-sm text-neutral-500">
          Document access requires Full Access permission. You can view lab trends and medications
          at your current access level.
        </p>
      ) : null}
    </div>
  );
}
