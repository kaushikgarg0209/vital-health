-- Phase 9: Fitness & Wellness Planning

CREATE TYPE public.dietary_preference_enum AS ENUM (
  'vegetarian',
  'non_vegetarian',
  'vegan',
  'eggetarian',
  'pescatarian'
);

CREATE TYPE public.activity_level_enum AS ENUM (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active'
);

CREATE TYPE public.work_routine_enum AS ENUM (
  'desk_job',
  'shift_work',
  'physical_labor',
  'retired',
  'student',
  'homemaker'
);

CREATE TYPE public.fitness_goal_enum AS ENUM (
  'lose_weight',
  'maintain',
  'gain_muscle',
  'improve_biomarkers',
  'general_wellness'
);

CREATE TYPE public.weight_source_enum AS ENUM (
  'manual',
  'check_in',
  'profile_update'
);

CREATE TYPE public.wellness_plan_status_enum AS ENUM (
  'active',
  'completed',
  'archived'
);

CREATE TABLE public.wellness_preferences (
  user_id              UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  dietary_preference   public.dietary_preference_enum,
  country_code         CHAR(2),
  cuisine_notes        TEXT,
  activity_level       public.activity_level_enum,
  work_routine         public.work_routine_enum,
  fitness_goal         public.fitness_goal_enum,
  target_weight_kg     NUMERIC(5,1),
  typical_sleep_hours  NUMERIC(3,1),
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.weight_measurements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  weight_kg    NUMERIC(5,1) NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source       public.weight_source_enum NOT NULL DEFAULT 'manual',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weight_measurements_positive CHECK (weight_kg > 0)
);

CREATE INDEX weight_measurements_user_recorded_idx
  ON public.weight_measurements (user_id, recorded_at DESC);

CREATE TABLE public.wellness_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status                  public.wellness_plan_status_enum NOT NULL DEFAULT 'active',
  plan_json               JSONB NOT NULL,
  nutrition_targets_json  JSONB NOT NULL,
  current_week            SMALLINT NOT NULL DEFAULT 1,
  generated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wellness_plans_user_status_idx
  ON public.wellness_plans (user_id, status);

CREATE TABLE public.weekly_checkins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES public.wellness_plans (id) ON DELETE CASCADE,
  week_number       SMALLINT NOT NULL,
  weight_kg         NUMERIC(5,1),
  adherence_score   SMALLINT NOT NULL,
  energy_level      SMALLINT NOT NULL,
  sleep_hours_avg   NUMERIC(3,1),
  notes             TEXT,
  ai_feedback       TEXT,
  adjusted_targets  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_checkins_week_positive CHECK (week_number >= 1 AND week_number <= 4),
  CONSTRAINT weekly_checkins_adherence_range CHECK (adherence_score >= 1 AND adherence_score <= 5),
  CONSTRAINT weekly_checkins_energy_range CHECK (energy_level >= 1 AND energy_level <= 5),
  UNIQUE (plan_id, week_number)
);

ALTER TABLE public.wellness_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wellness_preferences_own"
  ON public.wellness_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "weight_measurements_own"
  ON public.weight_measurements
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wellness_plans_own"
  ON public.wellness_plans
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "weekly_checkins_own"
  ON public.weekly_checkins
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wellness_plans wp
      WHERE wp.id = weekly_checkins.plan_id
        AND wp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wellness_plans wp
      WHERE wp.id = weekly_checkins.plan_id
        AND wp.user_id = auth.uid()
    )
  );

GRANT ALL ON TABLE public.wellness_preferences TO authenticated;
GRANT ALL ON TABLE public.wellness_preferences TO service_role;

GRANT ALL ON TABLE public.weight_measurements TO authenticated;
GRANT ALL ON TABLE public.weight_measurements TO service_role;

GRANT ALL ON TABLE public.wellness_plans TO authenticated;
GRANT ALL ON TABLE public.wellness_plans TO service_role;

GRANT ALL ON TABLE public.weekly_checkins TO authenticated;
GRANT ALL ON TABLE public.weekly_checkins TO service_role;
