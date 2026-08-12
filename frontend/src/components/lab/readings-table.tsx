import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLabDate, sourceLabel } from "@/lib/lab-utils";
import type { LabReading } from "@/types/lab";

type ReadingsTableProps = {
  readings: LabReading[];
  unit: string;
};

export function ReadingsTable({ readings, unit }: ReadingsTableProps) {
  if (readings.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-white p-6 text-sm text-neutral-500">
        No readings recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-medium text-neutral-700">All readings</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="hidden sm:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell className="whitespace-nowrap text-neutral-600">
                  {formatLabDate(reading.readingDate)}
                </TableCell>
                <TableCell className="font-medium tabular-nums text-neutral-800">
                  {reading.value} {unit}
                </TableCell>
                <TableCell>
                  <BiomarkerStatusBadge status={reading.status} size="sm" />
                </TableCell>
                <TableCell className="text-neutral-500">{sourceLabel(reading.source)}</TableCell>
                <TableCell className="hidden max-w-xs truncate text-neutral-400 sm:table-cell">
                  {reading.notes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
