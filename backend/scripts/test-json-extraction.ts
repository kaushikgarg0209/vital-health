import { extractJsonPayload, GeminiError, parseJsonResponse } from "../src/services/ai/geminiJson.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn: () => unknown): void {
  try {
    fn();
    throw new Error("Expected function to throw");
  } catch (error) {
    if (error instanceof Error && error.message === "Expected function to throw") {
      throw error;
    }
    if (!(error instanceof GeminiError)) {
      throw new Error(`Expected GeminiError, got ${String(error)}`);
    }
  }
}

console.log("=== JSON Extraction Tests ===\n");

const bare = '{"overview":"hello","weeks":[]}';
assert(JSON.stringify(parseJsonResponse(bare)) === JSON.stringify(JSON.parse(bare)), "bare JSON");
console.log("✓ Valid bare JSON parses");

const fenced = "```json\n{\"a\":1,\"b\":\"test\"}\n```";
assert(JSON.stringify(parseJsonResponse(fenced)) === JSON.stringify({ a: 1, b: "test" }), "fenced JSON");
console.log("✓ Markdown fenced JSON parses");

const trailing = '{"a":1,"nested":{"x":2}}\n\nHere is a summary of the plan.';
assert(JSON.stringify(parseJsonResponse(trailing)) === JSON.stringify({ a: 1, nested: { x: 2 } }), "trailing");
console.log("✓ JSON with trailing text parses");

const extracted = extractJsonPayload('prefix {"ok": true} suffix');
assert(extracted === '{"ok": true}', "extract balanced object");
console.log("✓ extractJsonPayload returns balanced object");

assertThrows(() => parseJsonResponse("NV"));
console.log("✓ Garbage input fails cleanly");

console.log("\n=== All JSON extraction tests passed ===");
