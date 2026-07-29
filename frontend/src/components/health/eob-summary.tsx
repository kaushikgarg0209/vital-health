import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClaimStatus, EobSummary } from "@/types/extraction";

type EobSummaryCardProps = {
  eob: EobSummary;
};

const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  approved: "Approved",
  partially_approved: "Partially approved",
  denied: "Denied",
  pending: "Pending",
  appealed: "Appealed",
};

function formatCurrency(amount: number | null): string {
  if (amount == null) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) {
    return "—";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EobSummaryCard({ eob }: EobSummaryCardProps) {
  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-neutral-800">
              Explanation of benefits
            </CardTitle>
            {eob.providerName ? (
              <p className="mt-1 text-sm text-neutral-500">{eob.providerName}</p>
            ) : null}
          </div>
          {eob.claimStatus ? (
            <Badge variant="outline" className="rounded-lg">
              {CLAIM_STATUS_LABELS[eob.claimStatus]}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-neutral-400">Claim number</dt>
            <dd className="font-medium text-neutral-800">{eob.claimNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Service date</dt>
            <dd className="font-medium text-neutral-800">{formatDate(eob.serviceDate)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Billed</dt>
            <dd className="font-medium text-neutral-800">{formatCurrency(eob.billedAmount)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Insurance paid</dt>
            <dd className="font-medium text-neutral-800">{formatCurrency(eob.insurancePaid)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Your responsibility</dt>
            <dd className="font-medium text-neutral-800">
              {formatCurrency(eob.patientResponsibility)}
            </dd>
          </div>
        </dl>

        {eob.denialReason ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Denial reason</p>
            <p className="mt-1 text-sm text-amber-900">{eob.denialReason}</p>
            {eob.denialCode ? (
              <p className="mt-1 text-xs text-amber-700">Code: {eob.denialCode}</p>
            ) : null}
          </div>
        ) : null}

        {eob.plainLanguageExplanation ? (
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              AI summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {eob.plainLanguageExplanation}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
