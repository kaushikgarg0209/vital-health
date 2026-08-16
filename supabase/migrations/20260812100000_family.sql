-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.family_permission_enum AS ENUM (
  'full',
  'monitor',
  'emergency'
);

COMMENT ON TYPE public.family_permission_enum IS
  'Caregiver access level: full=all records, monitor=labs+meds, emergency=brief only';

CREATE TYPE public.family_membership_status_enum AS ENUM (
  'pending',
  'accepted',
  'declined',
  'revoked'
);

COMMENT ON TYPE public.family_membership_status_enum IS
  'Invitation lifecycle: pending → accepted/declined, or revoked by subject';

CREATE TYPE public.notification_type_enum AS ENUM (
  'biomarker_alert',
  'family_alert',
  'family_invitation',
  'document_processed',
  'document_failed'
);

COMMENT ON TYPE public.notification_type_enum IS
  'In-app notification categories; extended as new features ship';


-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILE EXTENSIONS (emergency brief)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN emergency_contact_name  TEXT,
  ADD COLUMN emergency_contact_phone TEXT,
  ADD COLUMN primary_care_doctor     TEXT;

COMMENT ON COLUMN public.profiles.emergency_contact_name IS
  'Name shown on emergency health brief for first responders / caregivers';
COMMENT ON COLUMN public.profiles.emergency_contact_phone IS
  'Phone number for emergency contact on health brief';
COMMENT ON COLUMN public.profiles.primary_care_doctor IS
  'Primary care physician name for emergency brief';


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: family_groups
-- A named care circle (e.g. "Sharma Family"). created_by is the group admin.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.family_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT family_groups_name_not_empty CHECK (char_length(trim(name)) > 0)
);

COMMENT ON TABLE public.family_groups IS
  'Named family/care circle; members connect via family_memberships grants';


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: family_memberships
-- Directed access grant: subject shares data with viewer at permission_level.
-- Pending invites store invitee_email + invitation_token until accepted.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.family_memberships (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id                UUID NOT NULL REFERENCES public.family_groups (id) ON DELETE CASCADE,
  subject_user_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  viewer_user_id          UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  invitee_email           TEXT,
  permission_level        public.family_permission_enum NOT NULL DEFAULT 'monitor',
  status                  public.family_membership_status_enum NOT NULL DEFAULT 'pending',
  invitation_token        UUID UNIQUE DEFAULT gen_random_uuid(),
  invitation_expires_at   TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT family_memberships_subject_not_viewer
    CHECK (viewer_user_id IS NULL OR subject_user_id <> viewer_user_id),
  CONSTRAINT family_memberships_pending_has_email
    CHECK (status <> 'pending' OR invitee_email IS NOT NULL OR viewer_user_id IS NOT NULL)
);

COMMENT ON TABLE public.family_memberships IS
  'Caregiver grant: viewer may access subject health data at permission_level within group';

-- One active accepted grant per (group, subject, viewer) triple
CREATE UNIQUE INDEX idx_family_memberships_active_grant
  ON public.family_memberships (group_id, subject_user_id, viewer_user_id)
  WHERE status = 'accepted' AND viewer_user_id IS NOT NULL;

CREATE INDEX idx_family_memberships_subject
  ON public.family_memberships (subject_user_id, status);

CREATE INDEX idx_family_memberships_viewer
  ON public.family_memberships (viewer_user_id, status)
  WHERE viewer_user_id IS NOT NULL;

CREATE INDEX idx_family_memberships_invitation_token
  ON public.family_memberships (invitation_token)
  WHERE status = 'pending';

CREATE INDEX idx_family_memberships_group
  ON public.family_memberships (group_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: notifications
-- In-app notifications delivered to a single user (caregiver alerts, invites).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type        public.notification_type_enum NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS
  'User notification inbox; family_alert rows fan out from biomarker trend worker';

CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER family_groups_set_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER family_memberships_set_updated_at
  BEFORE UPDATE ON public.family_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS HELPERS
-- family_permission_rank: higher number = more access (used in comparisons)
-- family_has_access: true when auth.uid() is an accepted caregiver for subject
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.family_permission_rank(
  level public.family_permission_enum
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE level
    WHEN 'emergency' THEN 1
    WHEN 'monitor'   THEN 2
    WHEN 'full'       THEN 3
  END;
$$;

CREATE OR REPLACE FUNCTION public.family_has_access(
  p_subject_user_id UUID,
  p_min_level       public.family_permission_enum
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_memberships fm
    WHERE fm.subject_user_id = p_subject_user_id
      AND fm.viewer_user_id = auth.uid()
      AND fm.status = 'accepted'
      AND public.family_permission_rank(fm.permission_level)
        >= public.family_permission_rank(p_min_level)
  );
$$;

COMMENT ON FUNCTION public.family_has_access IS
  'RLS helper: returns true if current user has at least p_min_level access to subject data';


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — family tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Groups: creator or anyone with a membership in the group can read
CREATE POLICY "family_groups_select"
  ON public.family_groups
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_memberships fm
      WHERE fm.group_id = family_groups.id
        AND (fm.subject_user_id = auth.uid() OR fm.viewer_user_id = auth.uid())
        AND fm.status IN ('pending', 'accepted')
    )
  );

CREATE POLICY "family_groups_insert"
  ON public.family_groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "family_groups_update"
  ON public.family_groups
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Memberships: visible to subject, viewer, or group creator
CREATE POLICY "family_memberships_select"
  ON public.family_memberships
  FOR SELECT
  USING (
    subject_user_id = auth.uid()
    OR viewer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_memberships.group_id
        AND fg.created_by = auth.uid()
    )
    OR (
      status = 'pending'
      AND invitee_email IS NOT NULL
      AND lower(invitee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Subject or group creator can create invitations/grants
CREATE POLICY "family_memberships_insert"
  ON public.family_memberships
  FOR INSERT
  WITH CHECK (
    subject_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_memberships.group_id
        AND fg.created_by = auth.uid()
    )
  );

-- Subject/creator can revoke; viewer can decline their own pending invite
CREATE POLICY "family_memberships_update"
  ON public.family_memberships
  FOR UPDATE
  USING (
    subject_user_id = auth.uid()
    OR viewer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_memberships.group_id
        AND fg.created_by = auth.uid()
    )
  )
  WITH CHECK (
    subject_user_id = auth.uid()
    OR viewer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_memberships.group_id
        AND fg.created_by = auth.uid()
    )
  );

-- Notifications: own inbox only
CREATE POLICY "notifications_own"
  ON public.notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — shared health data (SELECT-only family policies)
-- Own-user policies from earlier migrations remain unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_family_emergency"
  ON public.profiles
  FOR SELECT
  USING (public.family_has_access(id, 'emergency'));

CREATE POLICY "biomarker_readings_family_monitor"
  ON public.biomarker_readings
  FOR SELECT
  USING (public.family_has_access(user_id, 'monitor'));

CREATE POLICY "biomarker_alerts_family_monitor"
  ON public.biomarker_alerts
  FOR SELECT
  USING (public.family_has_access(user_id, 'monitor'));

CREATE POLICY "prescriptions_family_monitor"
  ON public.prescriptions
  FOR SELECT
  USING (public.family_has_access(user_id, 'monitor'));

CREATE POLICY "documents_family_full"
  ON public.documents
  FOR SELECT
  USING (public.family_has_access(user_id, 'full'));

CREATE POLICY "lab_reports_family_full"
  ON public.lab_reports
  FOR SELECT
  USING (public.family_has_access(user_id, 'full'));


-- ─────────────────────────────────────────────────────────────────────────────
-- AUTH HELPER (email lookup for invitations — service role only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.family_groups TO authenticated;
GRANT ALL ON TABLE public.family_groups TO service_role;

GRANT ALL ON TABLE public.family_memberships TO authenticated;
GRANT ALL ON TABLE public.family_memberships TO service_role;

GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
