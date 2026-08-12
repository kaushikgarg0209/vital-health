"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLabApiError, toUserFacingLabError } from "@/lib/api/lab";
import { useCreateManualReading } from "@/hooks/useLab";
import { cn } from "@/lib/utils";
import type { TrackedBiomarker } from "@/types/lab";

export type ManualReadingBiomarkerOption = {
  biomarkerKey: string;
  biomarkerName: string;
  displayName: string;
  unit: string;
};

const FALLBACK_BIOMARKER_OPTIONS: ManualReadingBiomarkerOption[] = [
  {
    biomarkerKey: "glucose",
    biomarkerName: "Glucose (Fasting)",
    displayName: "Glucose (Fasting)",
    unit: "mg/dL",
  },
  {
    biomarkerKey: "hba1c",
    biomarkerName: "Hemoglobin A1c",
    displayName: "Hemoglobin A1c",
    unit: "%",
  },
  {
    biomarkerKey: "ldl",
    biomarkerName: "LDL Cholesterol",
    displayName: "LDL Cholesterol",
    unit: "mg/dL",
  },
  {
    biomarkerKey: "hdl",
    biomarkerName: "HDL Cholesterol",
    displayName: "HDL Cholesterol",
    unit: "mg/dL",
  },
  {
    biomarkerKey: "total_cholesterol",
    biomarkerName: "Total Cholesterol",
    displayName: "Total Cholesterol",
    unit: "mg/dL",
  },
];

type ManualReadingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  biomarker?: ManualReadingBiomarkerOption | null;
  biomarkerOptions?: TrackedBiomarker[];
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualReadingDialog({
  open,
  onOpenChange,
  biomarker,
  biomarkerOptions = [],
}: ManualReadingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateManualReading();

  const [selectedKey, setSelectedKey] = useState(biomarker?.biomarkerKey ?? "");
  const [value, setValue] = useState("");
  const [readingDate, setReadingDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const optionList =
    biomarkerOptions.length > 0
      ? biomarkerOptions.map((option) => ({
          biomarkerKey: option.biomarkerKey,
          biomarkerName: option.biomarkerName,
          displayName: option.displayName,
          unit: option.unit,
        }))
      : FALLBACK_BIOMARKER_OPTIONS;

  const selectedBiomarker =
    biomarker ??
    optionList.find((option) => option.biomarkerKey === selectedKey) ??
    null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setSuccessMessage(null);
      setValue("");
      setNotes("");
      setReadingDate(todayIsoDate());
      if (biomarker) {
        setSelectedKey(biomarker.biomarkerKey);
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, biomarker]);

  useEffect(() => {
    if (biomarker) {
      setSelectedKey(biomarker.biomarkerKey);
    }
  }, [biomarker]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSuccessMessage(null);

    if (!selectedBiomarker) {
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    try {
      await mutation.mutateAsync({
        biomarkerKey: selectedBiomarker.biomarkerKey,
        biomarkerName: selectedBiomarker.displayName ?? selectedBiomarker.biomarkerName,
        value: numericValue,
        unit: selectedBiomarker.unit,
        readingDate,
        notes: notes.trim() || null,
      });
      setSuccessMessage("Reading logged successfully.");
      setTimeout(() => {
        onOpenChange(false);
      }, 800);
    } catch {
      // error shown below
    }
  }

  const errorMessage =
    mutation.isError && isLabApiError(mutation.error)
      ? toUserFacingLabError(
          mutation.error.status,
          mutation.error.code,
          mutation.error.message,
        )
      : mutation.isError
        ? "Failed to log reading."
        : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,28rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40 open:animate-in open:fade-in open:zoom-in-95"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-800">Log a reading</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manually record a biomarker value from an at-home test or clinic visit.
          </p>
        </div>

        <div className="space-y-4">
          {!biomarker && optionList.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="biomarker-select">Biomarker</Label>
              <select
                id="biomarker-select"
                value={selectedKey}
                onChange={(event) => setSelectedKey(event.target.value)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                required
              >
                <option value="" disabled>
                  Select biomarker
                </option>
                {optionList.map((option) => (
                  <option key={option.biomarkerKey} value={option.biomarkerKey}>
                    {option.displayName} ({option.unit})
                  </option>
                ))}
              </select>
            </div>
          ) : selectedBiomarker ? (
            <div className="rounded-xl bg-neutral-50 px-3 py-2 text-sm">
              <span className="font-medium text-neutral-800">{selectedBiomarker.displayName}</span>
              <span className="text-neutral-400"> · {selectedBiomarker.unit}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reading-value">Value</Label>
            <Input
              id="reading-value"
              type="number"
              step="any"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="e.g. 95"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading-date">Reading date</Label>
            <Input
              id="reading-date"
              type="date"
              value={readingDate}
              onChange={(event) => setReadingDate(event.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading-notes">Notes (optional)</Label>
            <Input
              id="reading-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Fasting, morning reading"
              className="rounded-xl"
            />
          </div>
        </div>

        {successMessage ? (
          <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>
        ) : null}
        {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !selectedBiomarker}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Save reading
          </button>
        </div>
      </form>
    </dialog>
  );
}
