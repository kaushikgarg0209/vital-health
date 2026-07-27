-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.biomarker_status_enum AS ENUM (
  'normal',
  'borderline',
  'concerning',
  'critical'
);

CREATE TYPE public.biomarker_source_enum AS ENUM (
  'lab_report',
  'manual'
);

CREATE TYPE public.alert_type_enum AS ENUM (
  'status_change',
  'large_delta',
  'consecutive_high'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: biomarker_readings
-- Individual test values from lab reports (or manual entry).
-- biomarker_key is standardized (e.g. ldl_cholesterol) so trends work across labs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.biomarker_readings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lab_report_id         UUID REFERENCES public.lab_reports (id) ON DELETE SET NULL,
  biomarker_key         TEXT NOT NULL,
  biomarker_name        TEXT NOT NULL,
  value                 NUMERIC NOT NULL,
  unit                  TEXT NOT NULL,
  reference_range_low   NUMERIC,
  reference_range_high  NUMERIC,
  reference_range_text  TEXT,
  status                public.biomarker_status_enum,
  reading_date          DATE NOT NULL,
  source                public.biomarker_source_enum NOT NULL DEFAULT 'lab_report',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.biomarker_readings IS 'Individual biomarker test values — core table for lab trends';
COMMENT ON COLUMN public.biomarker_readings.biomarker_key IS 'Standardized key (e.g. ldl_cholesterol, hba1c) for grouping across lab formats';
COMMENT ON COLUMN public.biomarker_readings.lab_report_id IS 'NULL when source = manual';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: biomarker_alerts
-- Auto-generated when a biomarker crosses a threshold (Phase 6 trend worker).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.biomarker_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  biomarker_key    TEXT NOT NULL,
  alert_type       public.alert_type_enum NOT NULL,
  previous_value   NUMERIC,
  new_value        NUMERIC,
  previous_status  public.biomarker_status_enum,
  new_status       public.biomarker_status_enum,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.biomarker_alerts IS 'Threshold alerts when biomarker status or values change significantly';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_readings_user_key_date
  ON public.biomarker_readings (user_id, biomarker_key, reading_date DESC);

CREATE INDEX idx_readings_user_date
  ON public.biomarker_readings (user_id, reading_date DESC);

CREATE INDEX idx_readings_lab_report
  ON public.biomarker_readings (lab_report_id);

CREATE INDEX idx_alerts_user_unread
  ON public.biomarker_alerts (user_id, is_read, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Family-sharing policies will be added once family_memberships exists.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.biomarker_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarker_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biomarker_readings_own"
  ON public.biomarker_readings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "biomarker_alerts_own"
  ON public.biomarker_alerts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.biomarker_readings TO authenticated;
GRANT ALL ON TABLE public.biomarker_readings TO service_role;

GRANT ALL ON TABLE public.biomarker_alerts TO authenticated;
GRANT ALL ON TABLE public.biomarker_alerts TO service_role;
