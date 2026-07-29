import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BillLineItem, MedicalBillSummary } from "@/types/extraction";

type MedicalBillSummaryCardProps = {
  bill: MedicalBillSummary;
  lineItems: BillLineItem[];
};

const PAYMENT_STATUS_LABELS: Record<MedicalBillSummary["paymentStatus"], string> = {
  pending: "Pending",
  paid: "Paid",
  disputed: "Disputed",
  payment_plan: "Payment plan",
  written_off: "Written off",
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

export function MedicalBillSummaryCard({ bill, lineItems }: MedicalBillSummaryCardProps) {
  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-neutral-800">Medical bill</CardTitle>
            {bill.providerName ? (
              <p className="mt-1 text-sm text-neutral-500">{bill.providerName}</p>
            ) : null}
          </div>
          <Badge variant="outline" className="rounded-lg">
            {PAYMENT_STATUS_LABELS[bill.paymentStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-neutral-400">Service date</dt>
            <dd className="font-medium text-neutral-800">{formatDate(bill.serviceDate)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Total billed</dt>
            <dd className="font-medium text-neutral-800">{formatCurrency(bill.totalBilled)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Insurance paid</dt>
            <dd className="font-medium text-neutral-800">{formatCurrency(bill.insurancePaid)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Amount due</dt>
            <dd className="font-medium text-neutral-800">{formatCurrency(bill.amountDue)}</dd>
          </div>
        </dl>

        {lineItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-neutral-700">
                    {item.description ?? item.procedureCode ?? "Line item"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.billedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-neutral-500">No line items extracted.</p>
        )}
      </CardContent>
    </Card>
  );
}
