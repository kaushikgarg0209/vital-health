-- Supabase JS cannot express pgvector <=> in the query builder, so we expose
-- cosine similarity search as a Postgres function callable via .rpc().
--
-- min_similarity filters weak matches (default 0.62). Without a threshold, any
-- query returns the top-N chunks even when similarity is very low — e.g.
-- gibberish still matches the only embedded document in a small corpus.

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector(768),
  match_user_id uuid,
  match_count int DEFAULT 8,
  min_similarity float DEFAULT 0.62
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = match_user_id
    AND dc.embedding IS NOT NULL
    AND (1 - (dc.embedding <=> query_embedding)) >= min_similarity
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_document_chunks IS
  'Cosine similarity search over document_chunks with minimum score threshold';

GRANT EXECUTE ON FUNCTION public.match_document_chunks(extensions.vector(768), uuid, int, float)
  TO authenticated, service_role;
