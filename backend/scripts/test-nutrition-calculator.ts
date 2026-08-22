import {
  calculateBmi,
  calculateBmr,
  calculateNutritionTargets,
  calculateTdee,
} from "../src/services/wellness/nutritionCalculator.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("=== Nutrition Calculator Tests ===\n");

const bmi = calculateBmi(80, 175);
assert(Math.abs(bmi - 26.1) < 0.2, `Expected BMI ~26.1, got ${bmi}`);
console.log("✓ BMI calculation");

const bmrMale = calculateBmr(80, 175, 35, "male");
assert(bmrMale > 1600 && bmrMale < 1900, `Unexpected male BMR: ${bmrMale}`);
console.log(`✓ Male BMR: ${Math.round(bmrMale)} kcal`);

const bmrFemale = calculateBmr(65, 165, 35, "female");
assert(bmrFemale > 1300 && bmrFemale < 1500, `Unexpected female BMR: ${bmrFemale}`);
console.log(`✓ Female BMR: ${Math.round(bmrFemale)} kcal`);

const tdee = calculateTdee(bmrMale, "moderately_active");
assert(tdee > bmrMale, "TDEE should exceed BMR");
console.log(`✓ TDEE: ${Math.round(tdee)} kcal`);

const targets = calculateNutritionTargets({
  weightKg: 80,
  heightCm: 175,
  age: 35,
  biologicalSex: "male",
  activityLevel: "moderately_active",
  fitnessGoal: "lose_weight",
  knownConditions: [],
  labSignals: [
    { biomarkerKey: "ldl_cholesterol", biomarkerName: "LDL Cholesterol", status: "borderline" },
    { biomarkerKey: "fasting_glucose", biomarkerName: "Fasting Glucose", status: "concerning" },
  ],
});

assert(targets.dailyCalories > 0, "Calories should be positive");
assert(targets.proteinG > 0, "Protein should be positive");
assert(targets.carbsG >= 0, "Carbs should be non-negative");
assert(targets.fatG > 0, "Fat should be positive");
assert(targets.fiberG >= 25, "Fiber should meet minimum");
assert(targets.labAdjustments.length >= 1, "Lab adjustments should be applied");
console.log(`✓ Full targets: ${targets.dailyCalories} kcal, P${targets.proteinG}/C${targets.carbsG}/F${targets.fatG}`);

const kidneyTargets = calculateNutritionTargets({
  weightKg: 70,
  heightCm: 170,
  age: 55,
  biologicalSex: "female",
  activityLevel: "sedentary",
  fitnessGoal: "maintain",
  knownConditions: ["Chronic Kidney Disease"],
  labSignals: [],
});

assert(kidneyTargets.proteinG <= 70 * 0.85, "Kidney condition should cap protein");
console.log(`✓ Kidney-safe protein cap: ${kidneyTargets.proteinG}g`);

console.log("\n=== All nutrition calculator tests passed ===");
