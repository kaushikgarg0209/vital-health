-- ─────────────────────────────────────────────────────────────────────────────
-- Biomarker reference catalog — standardized keys, units, and reference ranges
-- Used by trend analysis to compute consistent status across labs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.biomarker_reference (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biomarker_key   TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  category        TEXT NOT NULL,
  unit            TEXT NOT NULL,
  biological_sex  public.biological_sex_enum,
  age_min         INT,
  age_max         INT,
  reference_low   NUMERIC,
  reference_high  NUMERIC,
  sort_order      INT NOT NULL DEFAULT 0,
  UNIQUE (biomarker_key, biological_sex, age_min, age_max)
);

COMMENT ON TABLE public.biomarker_reference IS 'Reference ranges for standardized biomarker keys (read-only catalog)';
COMMENT ON COLUMN public.biomarker_reference.biological_sex IS 'NULL = applies to all sexes';
COMMENT ON COLUMN public.biomarker_reference.age_min IS 'NULL = no lower age bound';
COMMENT ON COLUMN public.biomarker_reference.age_max IS 'NULL = no upper age bound';

CREATE INDEX idx_biomarker_reference_key
  ON public.biomarker_reference (biomarker_key);

ALTER TABLE public.biomarker_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biomarker_reference_read"
  ON public.biomarker_reference
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.biomarker_reference TO authenticated;
GRANT ALL ON TABLE public.biomarker_reference TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: ~35 common biomarkers (adult defaults; sex-specific where meaningful)
-- Ranges are approximate clinical guidelines for dashboard status logic.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.biomarker_reference
  (biomarker_key, display_name, category, unit, biological_sex, age_min, age_max, reference_low, reference_high, sort_order)
VALUES
  -- Lipid Panel
  ('total_cholesterol', 'Total Cholesterol', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 125, 200, 1),
  ('ldl_cholesterol', 'LDL Cholesterol', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 0, 100, 2),
  ('hdl_cholesterol', 'HDL Cholesterol', 'Lipid Panel', 'mg/dL', 'male', 18, NULL, 40, NULL, 3),
  ('hdl_cholesterol', 'HDL Cholesterol', 'Lipid Panel', 'mg/dL', 'female', 18, NULL, 50, NULL, 3),
  ('triglycerides', 'Triglycerides', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 0, 150, 4),
  ('non_hdl_cholesterol', 'Non-HDL Cholesterol', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 0, 130, 5),
  ('apolipoprotein_b', 'Apolipoprotein B', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 0, 90, 6),
  ('lipoprotein_a', 'Lipoprotein(a)', 'Lipid Panel', 'mg/dL', NULL, 18, NULL, 0, 30, 7),

  -- Blood Sugar
  ('glucose', 'Glucose (Fasting)', 'Blood Sugar', 'mg/dL', NULL, 18, NULL, 70, 99, 10),
  ('hba1c', 'HbA1c', 'Blood Sugar', '%', NULL, 18, NULL, 4.0, 5.6, 11),
  ('insulin', 'Insulin (Fasting)', 'Blood Sugar', 'µIU/mL', NULL, 18, NULL, 2.6, 24.9, 12),

  -- Kidney
  ('creatinine', 'Creatinine', 'Kidney', 'mg/dL', 'male', 18, NULL, 0.74, 1.35, 20),
  ('creatinine', 'Creatinine', 'Kidney', 'mg/dL', 'female', 18, NULL, 0.59, 1.04, 20),
  ('bun', 'Blood Urea Nitrogen', 'Kidney', 'mg/dL', NULL, 18, NULL, 7, 20, 21),
  ('egfr', 'eGFR', 'Kidney', 'mL/min/1.73m²', NULL, 18, NULL, 90, NULL, 22),
  ('uric_acid', 'Uric Acid', 'Kidney', 'mg/dL', 'male', 18, NULL, 3.4, 7.0, 23),
  ('uric_acid', 'Uric Acid', 'Kidney', 'mg/dL', 'female', 18, NULL, 2.4, 6.0, 23),

  -- Liver
  ('alt', 'ALT', 'Liver', 'U/L', 'male', 18, NULL, 7, 56, 30),
  ('alt', 'ALT', 'Liver', 'U/L', 'female', 18, NULL, 7, 45, 30),
  ('ast', 'AST', 'Liver', 'U/L', NULL, 18, NULL, 10, 40, 31),
  ('alp', 'Alkaline Phosphatase', 'Liver', 'U/L', NULL, 18, NULL, 44, 147, 32),
  ('bilirubin_total', 'Total Bilirubin', 'Liver', 'mg/dL', NULL, 18, NULL, 0.1, 1.2, 33),
  ('albumin', 'Albumin', 'Liver', 'g/dL', NULL, 18, NULL, 3.5, 5.5, 34),
  ('ggt', 'GGT', 'Liver', 'U/L', 'male', 18, NULL, 8, 61, 35),
  ('ggt', 'GGT', 'Liver', 'U/L', 'female', 18, NULL, 5, 36, 35),

  -- Thyroid
  ('tsh', 'TSH', 'Thyroid', 'mIU/L', NULL, 18, NULL, 0.4, 4.0, 40),
  ('free_t4', 'Free T4', 'Thyroid', 'ng/dL', NULL, 18, NULL, 0.8, 1.8, 41),
  ('free_t3', 'Free T3', 'Thyroid', 'pg/mL', NULL, 18, NULL, 2.3, 4.2, 42),

  -- Complete Blood Count
  ('hemoglobin', 'Hemoglobin', 'Complete Blood Count', 'g/dL', 'male', 18, NULL, 13.5, 17.5, 50),
  ('hemoglobin', 'Hemoglobin', 'Complete Blood Count', 'g/dL', 'female', 18, NULL, 12.0, 15.5, 50),
  ('hematocrit', 'Hematocrit', 'Complete Blood Count', '%', 'male', 18, NULL, 38.3, 48.6, 51),
  ('hematocrit', 'Hematocrit', 'Complete Blood Count', '%', 'female', 18, NULL, 35.5, 44.9, 51),
  ('wbc', 'White Blood Cells', 'Complete Blood Count', 'K/µL', NULL, 18, NULL, 4.5, 11.0, 52),
  ('rbc', 'Red Blood Cells', 'Complete Blood Count', 'M/µL', 'male', 18, NULL, 4.35, 5.65, 53),
  ('rbc', 'Red Blood Cells', 'Complete Blood Count', 'M/µL', 'female', 18, NULL, 3.92, 5.13, 53),
  ('platelets', 'Platelets', 'Complete Blood Count', 'K/µL', NULL, 18, NULL, 150, 400, 54),

  -- Vitamins & Minerals
  ('vitamin_d', 'Vitamin D (25-OH)', 'Vitamins & Minerals', 'ng/mL', NULL, 18, NULL, 30, 100, 60),
  ('vitamin_b12', 'Vitamin B12', 'Vitamins & Minerals', 'pg/mL', NULL, 18, NULL, 200, 900, 61),
  ('ferritin', 'Ferritin', 'Vitamins & Minerals', 'ng/mL', 'male', 18, NULL, 30, 400, 62),
  ('ferritin', 'Ferritin', 'Vitamins & Minerals', 'ng/mL', 'female', 18, NULL, 15, 150, 62),
  ('iron', 'Iron', 'Vitamins & Minerals', 'µg/dL', 'male', 18, NULL, 65, 175, 63),
  ('iron', 'Iron', 'Vitamins & Minerals', 'µg/dL', 'female', 18, NULL, 50, 170, 63),

  -- Inflammation
  ('crp', 'C-Reactive Protein', 'Inflammation', 'mg/L', NULL, 18, NULL, 0, 3.0, 70),
  ('esr', 'ESR', 'Inflammation', 'mm/hr', 'male', 18, 50, 0, 15, 71),
  ('esr', 'ESR', 'Inflammation', 'mm/hr', 'female', 18, 50, 0, 20, 71),
  ('esr', 'ESR', 'Inflammation', 'mm/hr', 'male', 50, NULL, 0, 20, 71),
  ('esr', 'ESR', 'Inflammation', 'mm/hr', 'female', 50, NULL, 0, 30, 71),

  -- Electrolytes
  ('sodium', 'Sodium', 'Electrolytes', 'mEq/L', NULL, 18, NULL, 136, 145, 80),
  ('potassium', 'Potassium', 'Electrolytes', 'mEq/L', NULL, 18, NULL, 3.5, 5.0, 81),
  ('calcium', 'Calcium', 'Electrolytes', 'mg/dL', NULL, 18, NULL, 8.6, 10.2, 82);
