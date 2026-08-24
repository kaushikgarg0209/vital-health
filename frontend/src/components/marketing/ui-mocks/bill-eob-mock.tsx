import { Badge } from "@/components/ui/badge";

export function BillEobMock() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-neutral-800">Medical bill</p>
          <Badge variant="outline">Extracted</Badge>
        </div>
        <p className="mt-2 text-xs text-neutral-500">City Medical Center · Mar 12, 2026</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Total billed</dt>
            <dd className="font-medium text-neutral-800">$1,240.00</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Insurance paid</dt>
            <dd className="font-medium text-neutral-800">$980.00</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-100 pt-2">
            <dt className="text-neutral-700">Amount due</dt>
            <dd className="font-semibold text-neutral-800">$260.00</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-neutral-800">Insurance EOB</p>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Approved
          </Badge>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Claim #EOB-88421</p>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Your plan covered 80% of eligible charges. Your remaining responsibility is $260
          for the office visit and lab panel.
        </p>
      </div>
    </div>
  );
}
