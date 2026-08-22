import type { BiologicalSex } from "../../types/profile.js";
import type {
  ActivityLevel,
  FitnessGoal,
  NutritionTargets,
} from "../../types/wellness.js";

export type LabSignal = {
  biomarkerKey: string;
  biomarkerName: string;
  status: string;
};

export type NutritionInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  biologicalSex: BiologicalSex;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  knownConditions: string[];
  labSignals: LabSignal[];
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

function round(value: number): number {
  return Math.round(value);
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) {
    return "underweight";
  }
  if (bmi < 25) {
    return "normal";
  }
  if (bmi < 30) {
    return "overweight";
  }
  return "obese";
}

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  biologicalSex: BiologicalSex,
): number {
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  if (biologicalSex === "male") {
    return male;
  }
  if (biologicalSex === "female") {
    return female;
  }

  return (male + female) / 2;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

function goalAdjustedCalories(tdee: number, goal: FitnessGoal, bmi: number): number {
  switch (goal) {
    case "lose_weight":
      return bmi < 25 ? tdee - 300 : tdee - 450;
    case "gain_muscle":
      return tdee + 300;
    case "maintain":
      return tdee;
    case "improve_biomarkers":
    case "general_wellness":
      return bmi >= 25 ? tdee - 250 : tdee;
    default:
      return tdee;
  }
}

function hasKidneyCondition(conditions: string[]): boolean {
  const normalized = conditions.map((c) => c.toLowerCase());
  return normalized.some(
    (c) =>
      c.includes("kidney") ||
      c.includes("renal") ||
      c.includes("ckd") ||
      c.includes("nephro"),
  );
}

function proteinGramsPerKg(goal: FitnessGoal, kidneyLimited: boolean): number {
  if (kidneyLimited) {
    return 0.8;
  }
  if (goal === "gain_muscle") {
    return 2.0;
  }
  if (goal === "lose_weight") {
    return 1.6;
  }
  return 1.4;
}

function defaultFiberG(biologicalSex: BiologicalSex, age: number): number {
  let base = biologicalSex === "male" ? 30 : 25;
  if (age > 50) {
    base += 5;
  }
  return base;
}

function applyLabAdjustments(
  dailyCalories: number,
  proteinG: number,
  labSignals: LabSignal[],
): { carbsPct: number; fatPct: number; proteinG: number; adjustments: string[] } {
  const adjustments: string[] = [];
  let carbsPct = 0.5;
  let fatPct = 0.28;
  let adjustedProtein = proteinG;

  for (const signal of labSignals) {
    const key = signal.biomarkerKey.toLowerCase();
    const status = signal.status;

    if (status !== "concerning" && status !== "critical" && status !== "borderline") {
      continue;
    }

    if (key.includes("ldl") || key.includes("cholesterol")) {
      fatPct = 0.25;
      adjustments.push(`Lower fat emphasis due to elevated ${signal.biomarkerName}`);
    }

    if (key.includes("hba1c") || key.includes("glucose")) {
      carbsPct = 0.42;
      adjustments.push(`Moderate carbs due to elevated ${signal.biomarkerName}`);
    }

    if (key.includes("triglyceride")) {
      carbsPct = Math.min(carbsPct, 0.4);
      adjustments.push(`Reduce refined carbs due to elevated ${signal.biomarkerName}`);
    }

    if (key.includes("uric")) {
      adjustments.push(`Avoid purine-heavy foods due to elevated ${signal.biomarkerName}`);
    }

    if (key.includes("egfr") || key.includes("creatinine")) {
      adjustedProtein = Math.min(adjustedProtein, proteinG * 0.7);
      adjustments.push(`Protein capped due to kidney-related marker ${signal.biomarkerName}`);
    }
  }

  return { carbsPct, fatPct, proteinG: adjustedProtein, adjustments };
}

export function calculateNutritionTargets(input: NutritionInput): NutritionTargets {
  const bmi = calculateBmi(input.weightKg, input.heightCm);
  const bmr = calculateBmr(
    input.weightKg,
    input.heightCm,
    input.age,
    input.biologicalSex,
  );
  const tdee = calculateTdee(bmr, input.activityLevel);
  const dailyCalories = goalAdjustedCalories(tdee, input.fitnessGoal, bmi);

  const kidneyLimited = hasKidneyCondition(input.knownConditions);
  const proteinPerKg = proteinGramsPerKg(input.fitnessGoal, kidneyLimited);
  let proteinG = input.weightKg * proteinPerKg;

  const labResult = applyLabAdjustments(dailyCalories, proteinG, input.labSignals);
  proteinG = labResult.proteinG;

  const proteinCalories = proteinG * 4;
  const fatCalories = dailyCalories * labResult.fatPct;
  const fatG = fatCalories / 9;
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const carbsG = Math.max(remainingCalories / 4, 0);
  const fiberG = defaultFiberG(input.biologicalSex, input.age);

  const rationaleParts = [
    `Maintenance calories (TDEE) estimated at ${round(tdee)} kcal based on your activity level.`,
    `Daily target set to ${round(dailyCalories)} kcal for your ${input.fitnessGoal.replace(/_/g, " ")} goal.`,
    `Protein at ${round(proteinG)}g supports muscle maintenance${kidneyLimited ? " (reduced for kidney safety)" : ""}.`,
  ];

  if (labResult.adjustments.length > 0) {
    rationaleParts.push("Lab-aware adjustments applied.");
  }

  return {
    dailyCalories: round(dailyCalories),
    proteinG: round(proteinG),
    carbsG: round(carbsG),
    fatG: round(fatG),
    fiberG: round(fiberG),
    bmr: round(bmr),
    tdee: round(tdee),
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory: bmiCategory(bmi),
    rationale: rationaleParts.join(" "),
    labAdjustments: labResult.adjustments,
  };
}
