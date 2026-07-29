import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { supabaseAdmin } from "../src/config/supabase.js";
import { createDocument } from "../src/services/documentService.js";
import { processDocument } from "../src/services/documentProcessingService.js";
import { uploadFile } from "../src/utils/supabaseStorage.js";
import { redisConnection } from "../src/config/redis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function shutdown(exitCode: number): Promise<void> {
  try {
    await redisConnection.quit();
  } catch {
    // Redis may not have connected if the test failed early.
  }
  process.exit(exitCode);
}
const samplePdfPath = path.resolve(__dirname, "../testdata/sample-lab-report.pdf");

async function getOrCreateTestUserId(): Promise<string> {
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .limit(1);

  if (profileError) {
    throw profileError;
  }

  if (profiles?.[0]?.id) {
    return profiles[0].id;
  }

  const email = `worker-test-${Date.now()}@example.com`;
  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { full_name: "Worker Test User" },
  });

  if (createError || !createdUser.user) {
    throw createError ?? new Error("Failed to create test user");
  }

  return createdUser.user.id;
}

async function main(): Promise<void> {
  if (!fs.existsSync(samplePdfPath)) {
    throw new Error(`Sample PDF not found at ${samplePdfPath}`);
  }

  const userId = await getOrCreateTestUserId();
  const documentId = uuidv4();
  const buffer = fs.readFileSync(samplePdfPath);

  console.log(`Uploading sample lab report for user ${userId}...`);
  const storagePath = await uploadFile(userId, documentId, buffer, "application/pdf");

  await createDocument({
    id: documentId,
    userId,
    fileName: "sample-lab-report.pdf",
    fileMimeType: "application/pdf",
    storagePath,
    fileSizeBytes: buffer.length,
  });

  console.log(`Processing document ${documentId}...`);
  await processDocument(documentId, userId);

  const { data: document, error: documentError } = await supabaseAdmin
    .from("documents")
    .select("processing_status, document_type, extraction_confidence, institution_name")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    throw documentError ?? new Error("Document not found after processing");
  }

  const { data: labReport, error: labReportError } = await supabaseAdmin
    .from("lab_reports")
    .select("id, lab_name")
    .eq("document_id", documentId)
    .single();

  if (labReportError || !labReport) {
    throw labReportError ?? new Error("Lab report not found after processing");
  }

  const { data: readings, error: readingsError } = await supabaseAdmin
    .from("biomarker_readings")
    .select("biomarker_key, biomarker_name, value, unit")
    .eq("lab_report_id", labReport.id);

  if (readingsError) {
    throw readingsError;
  }

  console.log("\nE2E verification results:");
  console.log("Document:", document);
  console.log("Lab report:", labReport);
  console.log("Biomarker readings:", readings);

  if (document.processing_status !== "completed") {
    throw new Error(`Expected completed status, got ${document.processing_status}`);
  }

  if (document.document_type !== "lab_report") {
    throw new Error(`Expected lab_report type, got ${document.document_type}`);
  }

  if (!readings || readings.length === 0) {
    throw new Error("Expected biomarker readings to be inserted");
  }

  console.log("\nDocument worker pipeline verified successfully.");
  await shutdown(0);
}

main().catch(async (error) => {
  console.error("Document processing E2E test failed:", error);
  await shutdown(1);
});
