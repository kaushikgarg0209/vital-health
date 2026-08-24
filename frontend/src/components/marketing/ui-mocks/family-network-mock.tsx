import { Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const permissions = [
  { label: "Full access", description: "Manage records and invitations" },
  { label: "Monitor", description: "Read-only caregiver summary" },
  { label: "Emergency", description: "Emergency brief only" },
];

export function FamilyNetworkMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Users className="size-5" />
        </div>
        <div>
          <p className="font-medium text-neutral-800">Garg Family Circle</p>
          <p className="text-sm text-neutral-500">3 members · 1 pending invite</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {permissions.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-neutral-800">{item.label}</p>
              <p className="text-xs text-neutral-500">{item.description}</p>
            </div>
            <Badge variant="outline" className="shrink-0">
              Tier
            </Badge>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <Shield className="mt-0.5 size-4 shrink-0" />
        Emergency brief ready with meds, allergies, and contacts
      </div>
    </div>
  );
}
