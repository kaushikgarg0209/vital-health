"use client";

import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
};

type OnboardingProgressProps = {
  steps: Step[];
  currentStep: number;
};

export function OnboardingProgress({ steps, currentStep }: OnboardingProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-neutral-400">{steps[currentStep]?.label}</span>
      </div>

      <div className="flex gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= currentStep ? "bg-primary-500" : "bg-neutral-200",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
