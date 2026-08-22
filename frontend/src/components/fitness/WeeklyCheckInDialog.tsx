"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isWellnessApiError, toUserFacingWellnessError } from "@/lib/api/wellness";
import { useSubmitWeeklyCheckin } from "@/hooks/useWellness";
import { cn } from "@/lib/utils";

type WeeklyCheckInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  weekNumber: number;
};

function ScorePicker({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-neutral-500">{helper}</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              "min-w-10 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              value === score
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WeeklyCheckInDialog({
  open,
  onOpenChange,
  planId,
  weekNumber,
}: WeeklyCheckInDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useSubmitWeeklyCheckin(planId);
  const [weightKg, setWeightKg] = useState("");
  const [adherenceScore, setAdherenceScore] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepHoursAvg, setSleepHoursAvg] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await mutation.mutateAsync({
        weekNumber,
        weightKg: weightKg ? Number(weightKg) : undefined,
        adherenceScore,
        energyLevel,
        sleepHoursAvg: sleepHoursAvg ? Number(sleepHoursAvg) : null,
        notes: notes.trim() || null,
      });
      onOpenChange(false);
      setWeightKg("");
      setNotes("");
    } catch (err) {
      if (isWellnessApiError(err)) {
        setError(toUserFacingWellnessError(err.status, err.code, err.message));
      } else {
        setError("Unable to submit check-in.");
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,32rem)] rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Week {weekNumber} check-in</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Share how the week went. Your coach feedback updates after you submit.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="checkin-weight">Weight (kg, optional)</Label>
            <Input
              id="checkin-weight"
              type="number"
              min={20}
              max={500}
              step={0.1}
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className="rounded-xl"
              placeholder="e.g. 72.5"
            />
            <p className="text-xs text-neutral-500">We&apos;ll track this on your weight trend chart.</p>
          </div>

          <ScorePicker
            label="Plan adherence"
            value={adherenceScore}
            onChange={setAdherenceScore}
            helper="1 = not at all, 5 = followed closely"
          />

          <ScorePicker
            label="Energy level"
            value={energyLevel}
            onChange={setEnergyLevel}
            helper="1 = very low, 5 = excellent"
          />

          <div className="space-y-2">
            <Label htmlFor="sleep">Average sleep (hours)</Label>
            <Input
              id="sleep"
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleepHoursAvg}
              onChange={(event) => setSleepHoursAvg(event.target.value)}
              className="rounded-xl"
              placeholder="e.g. 7"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="What worked well? What was challenging?"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit check-in"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
