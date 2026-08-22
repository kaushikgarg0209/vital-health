import { updateWellnessPreferencesSchema } from "../src/schemas/wellnessSchemas.js";
import { ISO_COUNTRY_CODES } from "../src/constants/isoCountries.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("=== Wellness Validation Tests ===\n");

assert(ISO_COUNTRY_CODES.has("IN"), "ISO list should include IN");
assert(ISO_COUNTRY_CODES.has("US"), "ISO list should include US");
assert(!ISO_COUNTRY_CODES.has("NV"), "ISO list should not include NV");
console.log("✓ ISO country allowlist");

const valid = updateWellnessPreferencesSchema.safeParse({
  dietaryPreference: "vegetarian",
  countryCode: "IN",
  activityLevel: "moderately_active",
  workRoutine: "desk_job",
  fitnessGoal: "general_wellness",
});

assert(valid.success, "Valid preferences should pass schema");
console.log("✓ Valid country code IN accepted");

const invalid = updateWellnessPreferencesSchema.safeParse({
  dietaryPreference: "vegetarian",
  countryCode: "NV",
  activityLevel: "moderately_active",
  workRoutine: "desk_job",
  fitnessGoal: "general_wellness",
});

assert(!invalid.success, "Invalid country code NV should fail schema");
console.log("✓ Invalid country code NV rejected");

console.log("\n=== All wellness validation tests passed ===");
