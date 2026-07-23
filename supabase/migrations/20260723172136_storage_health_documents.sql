-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Storage: health-documents bucket + RLS
-- ─────────────────────────────────────────────────────────────────────────────
--
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-documents',
  'health-documents',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS on storage.objects (enabled by default in Supabase)
-- (storage.foldername(name))[1] = first path segment = user UUID folder
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "health_documents_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "health_documents_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "health_documents_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "health_documents_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
