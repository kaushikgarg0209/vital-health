import "dotenv/config";
import { supabaseAdmin } from "../src/config/supabase.js";
import { searchDocumentsHybrid } from "../src/services/documentSearchService.js";
import { processDocumentEmbeddings } from "../src/services/embeddingProcessingService.js";

async function main(): Promise<void> {
  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("id, user_id, document_type, processing_status, file_name")
    .eq("processing_status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!document) {
    console.log("No completed documents found — run npm run test:processing first.");
    return;
  }

  console.log(`Embedding document ${document.id} (${document.file_name})...`);
  await processDocumentEmbeddings(document.id, document.user_id);

  const { data: chunks, error: chunksError } = await supabaseAdmin
    .from("document_chunks")
    .select("id, chunk_index, content, embedding")
    .eq("document_id", document.id)
    .eq("user_id", document.user_id)
    .order("chunk_index", { ascending: true });

  if (chunksError) {
    throw chunksError;
  }

  if (!chunks || chunks.length === 0) {
    throw new Error("Expected document_chunks rows after embedding");
  }

  const missingEmbeddings = chunks.filter((chunk) => chunk.embedding == null);

  if (missingEmbeddings.length > 0) {
    throw new Error("Expected all chunks to have embeddings");
  }

  console.log(`Stored ${chunks.length} chunk(s).`);
  console.log("Sample chunk:", chunks[0]?.content.slice(0, 120));

  const searchResults = await searchDocumentsHybrid(document.user_id, {
    q: "blood sugar",
    limit: 5,
  });

  console.log("\nSemantic search for 'blood sugar':");
  console.log(JSON.stringify(searchResults, null, 2));

  if (searchResults.length === 0) {
    throw new Error("Expected at least one search result");
  }

  console.log("\nEmbedding pipeline verified successfully.");
}

main().catch((error) => {
  console.error("Embedding test failed:", error);
  process.exit(1);
});
