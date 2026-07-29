import "dotenv/config";
import { supabaseAdmin } from "../src/config/supabase.js";
import { processDocumentEmbeddings } from "../src/services/embeddingProcessingService.js";

async function main(): Promise<void> {
  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select("id, user_id, file_name, processing_status")
    .eq("processing_status", "completed")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!documents || documents.length === 0) {
    console.log("No completed documents found.");
    return;
  }

  let embeddedCount = 0;
  let skippedCount = 0;

  for (const document of documents) {
    const { count, error: countError } = await supabaseAdmin
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", document.id)
      .eq("user_id", document.user_id);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) > 0) {
      console.log(`Skipping ${document.file_name} (${document.id}) — already embedded`);
      skippedCount += 1;
      continue;
    }

    console.log(`Embedding ${document.file_name} (${document.id})...`);
    await processDocumentEmbeddings(document.id, document.user_id);
    embeddedCount += 1;
  }

  console.log(
    `\nBackfill complete: ${embeddedCount} embedded, ${skippedCount} skipped (already had chunks).`,
  );
}

main().catch((error) => {
  console.error("Embedding backfill failed:", error);
  process.exit(1);
});
