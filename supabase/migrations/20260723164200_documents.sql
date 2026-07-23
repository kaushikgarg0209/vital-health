-- ─────────────────────────────────────────────────────────────────────────────
-- Documents migration
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- pgvector adds the `vector` column type used by document_chunks.embedding
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS (document-domain only — other enums come in later migrations)
-- An ENUM is like a TypeScript union type enforced by the database.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.processing_status_enum AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.document_type_enum AS ENUM (
  'lab_report',
  'prescription',
  'discharge_summary',
  'imaging_report',
  'medical_bill',
  'insurance_eob',
  'insurance_policy',
  'vaccination_record',
  'other'
);

CREATE TYPE public.payment_status_enum AS ENUM (
  'pending',
  'paid',
  'disputed',
  'payment_plan',
  'written_off'
);

CREATE TYPE public.claim_status_enum AS ENUM (
  'approved',
  'partially_approved',
  'denied',
  'pending',
  'appealed'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: documents
-- Central hub — one row per uploaded file. Everything else hangs off this.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  file_name             TEXT NOT NULL,
  file_mime_type        TEXT NOT NULL,
  storage_path          TEXT NOT NULL,
  document_type         public.document_type_enum,
  processing_status     public.processing_status_enum NOT NULL DEFAULT 'pending',
  document_date         DATE,
  institution_name      TEXT,
  doctor_name           TEXT,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  ai_suggested_tags     TEXT[] NOT NULL DEFAULT '{}',
  notes                 TEXT,
  file_size_bytes       INTEGER,
  extraction_confidence NUMERIC(3, 2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT documents_extraction_confidence_range
    CHECK (
      extraction_confidence IS NULL
      OR (extraction_confidence >= 0 AND extraction_confidence <= 1)
    ),
  CONSTRAINT documents_file_size_positive
    CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

COMMENT ON TABLE public.documents IS 'Every uploaded health document — hub table for all document types';
COMMENT ON COLUMN public.documents.storage_path IS 'Private Supabase Storage path, e.g. health-documents/{userId}/{docId}.pdf';
COMMENT ON COLUMN public.documents.processing_status IS 'Background worker lifecycle: pending → processing → completed|failed';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: document_type_metadata
-- Lookup table for UI labels/icons — NOT an ENUM because we need display metadata.
-- No FK from documents.document_type → here (ENUM cannot FK to TEXT); kept in sync via seed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.document_type_metadata (
  key          TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  icon_name    TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.document_type_metadata IS 'UI metadata for each document_type_enum value';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: document_chunks
-- Text chunks + vector embeddings for RAG (Retrieval Augmented Generation).
-- embedding is NULL until the async worker runs (Phase 4).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding    vector(768),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT document_chunks_unique_index UNIQUE (document_id, chunk_index)
);

COMMENT ON TABLE public.document_chunks IS 'Searchable text chunks with optional vector embeddings for AI retrieval';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: lab_reports
-- One lab report document → one lab_reports row (1:1 with documents).
-- biomarker_readings (separate migration) will reference this table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.lab_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id      UUID NOT NULL UNIQUE REFERENCES public.documents (id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  report_date      DATE,
  lab_name         TEXT,
  ordering_doctor  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lab_reports IS 'Structured metadata extracted from lab report documents';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: prescriptions
-- One prescription document may yield multiple medication rows.
-- document_id is nullable for manually entered medications.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.prescriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id         UUID REFERENCES public.documents (id) ON DELETE SET NULL,
  user_id             UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  medication_name     TEXT NOT NULL,
  generic_name        TEXT,
  dosage              TEXT,
  frequency           TEXT,
  route               TEXT,
  prescribing_doctor  TEXT,
  prescribed_date     DATE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prescriptions IS 'Medications from prescription documents or manual entry';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: medical_bills + bill_line_items
-- Bill document → one medical_bills row → many line items.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.medical_bills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL UNIQUE REFERENCES public.documents (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_name     TEXT,
  service_date      DATE,
  total_billed      NUMERIC(10, 2),
  insurance_paid    NUMERIC(10, 2),
  amount_due        NUMERIC(10, 2),
  due_date          DATE,
  payment_status    public.payment_status_enum NOT NULL DEFAULT 'pending',
  has_discrepancy   BOOLEAN NOT NULL DEFAULT FALSE,
  discrepancy_note  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.medical_bills IS 'Top-level billing summary extracted from medical bill documents';

CREATE TABLE public.bill_line_items (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id                      UUID NOT NULL REFERENCES public.medical_bills (id) ON DELETE CASCADE,
  user_id                      UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  procedure_code               TEXT,
  description                  TEXT,
  service_date                 DATE,
  billed_amount                NUMERIC(10, 2),
  plain_language_description   TEXT,
  is_flagged                   BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason                  TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bill_line_items IS 'Individual charges on a medical bill';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: insurance_policies + eob_records
-- Policy documents and Explanation of Benefits (claim decisions).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.insurance_policies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id         UUID REFERENCES public.documents (id) ON DELETE SET NULL,
  user_id             UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  insurance_company   TEXT,
  plan_name           TEXT,
  member_id           TEXT,
  group_number        TEXT,
  effective_date      DATE,
  expiry_date         DATE,
  deductible_amount   NUMERIC(10, 2),
  deductible_met      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  out_of_pocket_max   NUMERIC(10, 2),
  out_of_pocket_met   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  coverage_summary    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.insurance_policies IS 'Insurance policy/card details extracted from documents';

CREATE TABLE public.eob_records (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id                 UUID NOT NULL UNIQUE REFERENCES public.documents (id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  policy_id                   UUID REFERENCES public.insurance_policies (id) ON DELETE SET NULL,
  claim_number                TEXT,
  service_date                DATE,
  provider_name               TEXT,
  billed_amount               NUMERIC(10, 2),
  insurance_paid              NUMERIC(10, 2),
  patient_responsibility      NUMERIC(10, 2),
  denial_reason               TEXT,
  denial_code                 TEXT,
  claim_status                public.claim_status_enum,
  plain_language_explanation  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.eob_records IS 'Explanation of Benefits — one row per insurance claim document';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- Composite indexes match how the app queries: "my documents by date", "by status", etc.
-- GIN on tags enables fast array containment search (@> operator).
-- ivfflat on embeddings enables approximate nearest-neighbor vector search.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_documents_user_type ON public.documents (user_id, document_type);
CREATE INDEX idx_documents_user_date ON public.documents (user_id, document_date DESC);
CREATE INDEX idx_documents_user_status ON public.documents (user_id, processing_status);
CREATE INDEX idx_documents_tags ON public.documents USING GIN (tags);

CREATE INDEX idx_chunks_user ON public.document_chunks (user_id);
CREATE INDEX idx_chunks_document ON public.document_chunks (document_id);
CREATE INDEX idx_chunks_content_hash ON public.document_chunks (content_hash);
CREATE INDEX idx_chunks_embedding ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_bills_user_status ON public.medical_bills (user_id, payment_status);
CREATE INDEX idx_bills_service_date ON public.medical_bills (user_id, service_date DESC);

CREATE INDEX idx_eob_service_date ON public.eob_records (user_id, service_date);
CREATE INDEX idx_eob_claim_status ON public.eob_records (user_id, claim_status);

CREATE INDEX idx_prescriptions_user_active ON public.prescriptions (user_id, is_active);
CREATE INDEX idx_lab_reports_user_date ON public.lab_reports (user_id, report_date DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- Reuses handle_updated_at() created in the profiles migration.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Every table is private to the owning user. Family-sharing policies will be
-- added in a later migration once family_memberships exists.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_type_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eob_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_own"
  ON public.documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "document_type_metadata_read"
  ON public.document_type_metadata
  FOR SELECT
  USING (TRUE);

CREATE POLICY "document_chunks_own"
  ON public.document_chunks
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "lab_reports_own"
  ON public.lab_reports
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "prescriptions_own"
  ON public.prescriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "medical_bills_own"
  ON public.medical_bills
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bill_line_items_own"
  ON public.bill_line_items
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "insurance_policies_own"
  ON public.insurance_policies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "eob_records_own"
  ON public.eob_records
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS
-- Lets Supabase API roles reach tables through RLS (same pattern as profiles).
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;

GRANT SELECT ON TABLE public.document_type_metadata TO authenticated;
GRANT SELECT ON TABLE public.document_type_metadata TO service_role;

GRANT ALL ON TABLE public.document_chunks TO authenticated;
GRANT ALL ON TABLE public.document_chunks TO service_role;

GRANT ALL ON TABLE public.lab_reports TO authenticated;
GRANT ALL ON TABLE public.lab_reports TO service_role;

GRANT ALL ON TABLE public.prescriptions TO authenticated;
GRANT ALL ON TABLE public.prescriptions TO service_role;

GRANT ALL ON TABLE public.medical_bills TO authenticated;
GRANT ALL ON TABLE public.medical_bills TO service_role;

GRANT ALL ON TABLE public.bill_line_items TO authenticated;
GRANT ALL ON TABLE public.bill_line_items TO service_role;

GRANT ALL ON TABLE public.insurance_policies TO authenticated;
GRANT ALL ON TABLE public.insurance_policies TO service_role;

GRANT ALL ON TABLE public.eob_records TO authenticated;
GRANT ALL ON TABLE public.eob_records TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: document_type_metadata
-- Populates upload UI dropdowns — keys must match document_type_enum values exactly.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.document_type_metadata (key, display_name, icon_name, description, sort_order)
VALUES
  ('lab_report',         'Lab Report',              'flask-conical',  'Blood work, urine tests, pathology reports',       1),
  ('prescription',       'Prescription',            'pill',           'Doctor-prescribed medication slips',                2),
  ('discharge_summary',  'Discharge Summary',       'file-heart',     'Hospital discharge and treatment summaries',        3),
  ('imaging_report',     'Imaging Report',          'scan',           'X-ray, MRI, CT scan, ultrasound reports',         4),
  ('medical_bill',       'Medical Bill',            'receipt',        'Hospital or clinic billing statements',             5),
  ('insurance_eob',      'Explanation of Benefits', 'shield-check',   'Insurance claim decision documents',                6),
  ('insurance_policy',   'Insurance Policy',        'shield',         'Insurance cards and policy summaries',              7),
  ('vaccination_record', 'Vaccination Record',      'syringe',        'Vaccine certificates and immunization records',     8),
  ('other',              'Other',                   'file',           'Other medical or health documents',                 9)
ON CONFLICT (key) DO NOTHING;
