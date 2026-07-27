import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { generateText } from "../src/services/ai/geminiJson.js";
import {
  classifyDocument,
  extractDocumentData,
  parseDocument,
} from "../src/services/ai/documentParser.js";
import { CLASSIFICATION_MODEL } from "../src/config/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePdfPath = path.resolve(__dirname, "../testdata/sample-lab-report.pdf");

async function main(): Promise<void> {
  console.log(`Using classification model: ${CLASSIFICATION_MODEL}`);
  console.log("Testing Gemini connectivity...");
  const hello = await generateText(CLASSIFICATION_MODEL, 'Say "Gemini is connected" and nothing else.');
  console.log("Hello test:", hello);

  if (!fs.existsSync(samplePdfPath)) {
    console.log(`Sample PDF not found at ${samplePdfPath} — skipping document parse test.`);
    return;
  }

  console.log("\nTesting document classification + extraction...");
  const buffer = fs.readFileSync(samplePdfPath);

  const classification = await classifyDocument(buffer, "application/pdf");
  console.log("Classification:", classification);

  const extraction = await extractDocumentData(classification.type, buffer, "application/pdf");
  console.log("Extraction:", JSON.stringify(extraction, null, 2));

  console.log("\nTesting full parseDocument pipeline...");
  const parsed = await parseDocument(buffer, "application/pdf");
  console.log("Parsed document type:", parsed.classification.type);
  console.log("Confidence:", parsed.classification.confidence);
}

main().catch((error) => {
  console.error("Gemini test failed:", error);
  process.exit(1);
});
