import "dotenv/config";
import { supabaseAdmin } from "../src/config/supabase.js";
import { getExtractedDataForDocument } from "../src/services/documentExtractionReadService.js";

async function main(): Promise<void> {
  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("id, user_id, document_type, processing_status")
    .eq("processing_status", "completed")
    .eq("document_type", "lab_report")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!document) {
    console.log("No completed lab_report documents found — run npm run test:processing first.");
    return;
  }

  const extractedData = await getExtractedDataForDocument(
    document.user_id,
    document.id,
    document.document_type,
    document.processing_status,
  );

  console.log("Document ID:", document.id);
  console.log("Extracted data:", JSON.stringify(extractedData, null, 2));

  if (!extractedData || extractedData.type !== "lab_report") {
    throw new Error("Expected lab_report extracted data");
  }

  if (extractedData.readings.length === 0) {
    throw new Error("Expected biomarker readings");
  }

  console.log("\nDocument detail API payload verification passed.");
}

main().catch((error) => {
  console.error("Extraction read verification failed:", error);
  process.exit(1);
});
