import { MessageSquareQuote, Search } from "lucide-react";

export function AdvocateSearchMock() {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-25 px-4 py-3">
        <Search className="size-4 text-neutral-400" />
        <span className="text-sm text-neutral-500">Search glucose trends in my records...</span>
      </div>
      <div className="rounded-xl border border-neutral-100 bg-neutral-25 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
            <MessageSquareQuote className="size-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-neutral-700">
              Your fasting glucose has stayed between 88–95 mg/dL over the last three lab
              reports. That pattern is consistent with good glycemic control.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
              Cited: Lab report · Oct 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
