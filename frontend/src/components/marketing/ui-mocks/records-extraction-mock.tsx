import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RecordsExtractionMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary-600" />
          <span className="text-sm font-medium text-neutral-800">Annual_metabolic_panel.pdf</span>
        </div>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
          Processed
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Sparkles className="size-3.5 text-primary-500" />
          Classified as Lab report · 96% confidence
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { name: "Glucose", value: "92 mg/dL", status: "Normal" },
            { name: "HbA1c", value: "5.4%", status: "Normal" },
            { name: "LDL", value: "118 mg/dL", status: "Borderline" },
            { name: "HDL", value: "54 mg/dL", status: "Normal" },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2"
            >
              <p className="text-xs text-neutral-500">{item.name}</p>
              <p className="text-sm font-medium text-neutral-800">{item.value}</p>
              <p className="text-xs text-neutral-400">{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
