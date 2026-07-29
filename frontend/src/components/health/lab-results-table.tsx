import { biomarkerStatus } from "@/lib/tokens";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BiomarkerReadingDetail, LabReportSummary } from "@/types/extraction";
import { cn } from "@/lib/utils";

type LabResultsTableProps = {
  labReport: LabReportSummary;
  readings: BiomarkerReadingDetail[];
};

function formatReferenceRange(reading: BiomarkerReadingDetail): string {
  if (reading.referenceRangeText) {
    return reading.referenceRangeText;
  }

  if (reading.referenceRangeLow != null && reading.referenceRangeHigh != null) {
    return `${reading.referenceRangeLow}–${reading.referenceRangeHigh}`;
  }

  if (reading.referenceRangeLow != null) {
    return `≥ ${reading.referenceRangeLow}`;
  }

  if (reading.referenceRangeHigh != null) {
    return `≤ ${reading.referenceRangeHigh}`;
  }

  return "—";
}

function StatusCell({ status }: { status: BiomarkerReadingDetail["status"] }) {
  if (!status) {
    return <span className="text-neutral-400">—</span>;
  }

  const token = biomarkerStatus[status];

  return (
    <span className={cn("inline-flex items-center gap-2", token.textClass)}>
      <span className={cn("size-2 rounded-full", token.dotClass)} />
      {token.label}
    </span>
  );
}

export function LabResultsTable({ labReport, readings }: LabResultsTableProps) {
  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-800">Lab results</CardTitle>
        {(labReport.labName || labReport.orderingDoctor) && (
          <p className="text-sm text-neutral-500">
            {[labReport.labName, labReport.orderingDoctor].filter(Boolean).join(" · ")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {readings.length === 0 ? (
          <p className="text-sm text-neutral-500">No test values extracted.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reference range</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell className="font-medium text-neutral-800">
                    {reading.biomarkerName}
                  </TableCell>
                  <TableCell>{reading.value}</TableCell>
                  <TableCell>{reading.unit}</TableCell>
                  <TableCell>{formatReferenceRange(reading)}</TableCell>
                  <TableCell>
                    <StatusCell status={reading.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
