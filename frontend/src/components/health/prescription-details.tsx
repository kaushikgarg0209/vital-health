import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PrescriptionMedication } from "@/types/extraction";

type PrescriptionDetailsProps = {
  medications: PrescriptionMedication[];
  prescribingDoctor?: string | null;
  prescribedDate?: string | null;
};

function formatDate(date: string | null | undefined): string | null {
  if (!date) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PrescriptionDetails({
  medications,
  prescribingDoctor,
  prescribedDate,
}: PrescriptionDetailsProps) {
  const headerDate = formatDate(prescribedDate);

  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-800">Prescription</CardTitle>
        {(prescribingDoctor || headerDate) && (
          <p className="text-sm text-neutral-500">
            {[prescribingDoctor, headerDate].filter(Boolean).join(" · ")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {medications.length === 0 ? (
          <p className="text-sm text-neutral-500">No medications extracted.</p>
        ) : (
          medications.map((medication) => (
            <div
              key={medication.id}
              className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-800">{medication.medicationName}</p>
                  {medication.genericName ? (
                    <p className="mt-1 text-sm text-neutral-500">{medication.genericName}</p>
                  ) : null}
                </div>
                {medication.isActive ? (
                  <Badge variant="secondary" className="rounded-lg bg-emerald-50 text-emerald-700">
                    Active
                  </Badge>
                ) : null}
              </div>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {medication.dosage ? (
                  <div>
                    <dt className="text-neutral-400">Dosage</dt>
                    <dd className="text-neutral-700">{medication.dosage}</dd>
                  </div>
                ) : null}
                {medication.frequency ? (
                  <div>
                    <dt className="text-neutral-400">Frequency</dt>
                    <dd className="text-neutral-700">{medication.frequency}</dd>
                  </div>
                ) : null}
                {medication.route ? (
                  <div>
                    <dt className="text-neutral-400">Route</dt>
                    <dd className="text-neutral-700">{medication.route}</dd>
                  </div>
                ) : null}
                {medication.prescribedDate ? (
                  <div>
                    <dt className="text-neutral-400">Prescribed</dt>
                    <dd className="text-neutral-700">{formatDate(medication.prescribedDate)}</dd>
                  </div>
                ) : null}
              </dl>

              {medication.notes ? (
                <p className="mt-3 text-sm text-neutral-600">{medication.notes}</p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
