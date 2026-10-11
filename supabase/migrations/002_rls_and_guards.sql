-- ============================================================
-- Covenant Formation Platform — Migration 002
-- Row Level Security + server-only column guards.
--
-- EIKON shipped these as two migrations (002 then 009, after a real
-- gap was found: RLS alone lets an authenticated user UPDATE their
-- own row's role/status/score columns directly, not just the columns
-- the app's own UI exposes). Folding that lesson in from the start
-- here rather than reproducing the same window and patching it later.
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_content   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_portraits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_briefings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;

-- ── Helper functions ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Is the current user a partner (either side) in this couple?
CREATE OR REPLACE FUNCTION is_partner_in_couple(p_couple_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM couples
    WHERE id = p_couple_id
    AND (partner_a_id = auth.uid() OR partner_b_id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Is the current user the Guide assigned to this couple?
CREATE OR REPLACE FUNCTION is_guide_of_couple(p_couple_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND guide_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Is the current user the Guide of whichever couple this participant belongs to?
CREATE OR REPLACE FUNCTION is_guide_of_participant(p_participant_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM couples
    WHERE guide_id = auth.uid()
    AND (partner_a_id = p_participant_id OR partner_b_id = p_participant_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Signup: role is always 'participant', never chosen by the signer ──

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'participant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Column guards: server-controlled columns can't be self-edited ────
-- Allowed to bypass: the service role (auth.uid() IS NULL under it),
-- and an admin. Everyone else gets 42501 if they touch a guarded column.

CREATE OR REPLACE FUNCTION guard_columns()
RETURNS TRIGGER AS $$
DECLARE
  col text;
  old_j jsonb := to_jsonb(OLD);
  new_j jsonb := to_jsonb(NEW);
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN RETURN NEW; END IF;
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF old_j -> col IS DISTINCT FROM new_j -> col THEN
      RAISE EXCEPTION 'Column %.% can only be changed by the server', TG_TABLE_NAME, col
        USING ERRCODE = '42501';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER guard_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_columns('role', 'subscription_status', 'guide_id', 'email');

CREATE TRIGGER guard_couple_columns
  BEFORE UPDATE ON couples
  FOR EACH ROW EXECUTE FUNCTION guard_columns('partner_a_id', 'partner_b_id', 'guide_id', 'status', 'invite_code', 'cycle_number');

CREATE TRIGGER guard_assessment_columns
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION guard_columns(
    'participant_id', 'couple_id', 'cycle_number', 'completed_at', 'pillar_scores',
    'pillar_descriptors', 'integrity_flags', 'priority_stack', 'overall_score',
    'report_generated_at', 'scoring_notes'
  );

-- A participant may start their own assessment but never mark it completed
-- themselves — that status change only ever comes from the scoring route,
-- running as the service role.
CREATE OR REPLACE FUNCTION guard_assessment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('completed', 'report_generated') THEN
    RAISE EXCEPTION 'Assessment status % can only be set by the server', NEW.status USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER guard_assessment_status_trigger
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION guard_assessment_status();

-- ── PROFILES ─────────────────────────────────────────────────────

CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (id = auth_uid());
CREATE POLICY "profiles_select_guide" ON profiles FOR SELECT USING (is_guide_of_participant(id));
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (id = auth_uid()) WITH CHECK (id = auth_uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- ── COUPLES ──────────────────────────────────────────────────────

CREATE POLICY "couples_select_partner" ON couples FOR SELECT USING (partner_a_id = auth_uid() OR partner_b_id = auth_uid());
CREATE POLICY "couples_select_guide"   ON couples FOR SELECT USING (guide_id = auth_uid());
CREATE POLICY "couples_select_admin"   ON couples FOR SELECT USING (get_user_role() = 'admin');
-- Partner A creates the couple row when they register (see /api/onboarding
-- or /api/couple/create); partner B joins via /api/couple/accept-invite,
-- which runs as the service role and is therefore exempt from this check.
CREATE POLICY "couples_insert_own"     ON couples FOR INSERT WITH CHECK (partner_a_id = auth_uid());
CREATE POLICY "couples_all_admin"      ON couples FOR ALL USING (get_user_role() = 'admin');

-- ── QUESTIONS ────────────────────────────────────────────────────
-- No direct SELECT policy for ordinary authenticated users: the assessment
-- API serves only the safe fields (text, type — never the scoring rubric or
-- integrity logic) using the service role, same as EIKON. Admins get full
-- access for the question-bank editor.

CREATE POLICY "questions_all_admin" ON questions FOR ALL USING (get_user_role() = 'admin');

-- ── ASSESSMENTS ──────────────────────────────────────────────────

CREATE POLICY "assessments_select_own"   ON assessments FOR SELECT USING (participant_id = auth_uid());
CREATE POLICY "assessments_select_guide" ON assessments FOR SELECT USING (is_guide_of_couple(couple_id));
CREATE POLICY "assessments_select_admin" ON assessments FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "assessments_insert_own"   ON assessments FOR INSERT
  WITH CHECK (participant_id = auth_uid() AND status IN ('not_started', 'in_progress'));
CREATE POLICY "assessments_update_own"   ON assessments FOR UPDATE USING (participant_id = auth_uid());
CREATE POLICY "assessments_all_admin"    ON assessments FOR ALL USING (get_user_role() = 'admin');

-- ── RESPONSES ────────────────────────────────────────────────────

CREATE POLICY "responses_select_own"   ON responses FOR SELECT USING (participant_id = auth_uid());
CREATE POLICY "responses_select_guide" ON responses FOR SELECT USING (is_guide_of_participant(participant_id));
CREATE POLICY "responses_insert_own"   ON responses FOR INSERT WITH CHECK (participant_id = auth_uid());
CREATE POLICY "responses_update_own"   ON responses FOR UPDATE USING (participant_id = auth_uid());
CREATE POLICY "responses_all_admin"    ON responses FOR ALL USING (get_user_role() = 'admin');

-- ── REPORT CONTENT ───────────────────────────────────────────────

CREATE POLICY "report_content_select_authenticated" ON report_content FOR SELECT USING (auth_uid() IS NOT NULL AND active = true);
CREATE POLICY "report_content_all_admin" ON report_content FOR ALL USING (get_user_role() = 'admin');

-- ── AI PORTRAITS ─────────────────────────────────────────────────
-- Personal, answer-derived content — never shared through report_content.

CREATE POLICY "ai_portraits_select_own" ON ai_portraits FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_id AND a.participant_id = auth_uid())
);
CREATE POLICY "ai_portraits_select_guide" ON ai_portraits FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_id AND is_guide_of_couple(a.couple_id))
);
CREATE POLICY "ai_portraits_all_admin" ON ai_portraits FOR ALL USING (get_user_role() = 'admin');

-- ── GUIDE BRIEFINGS ──────────────────────────────────────────────

CREATE POLICY "guide_briefings_select_own" ON guide_briefings FOR SELECT USING (guide_id = auth_uid());
CREATE POLICY "guide_briefings_all_admin"  ON guide_briefings FOR ALL USING (get_user_role() = 'admin');

-- ── EMAIL LOG / SUBSCRIPTIONS ────────────────────────────────────
-- Both written exclusively by the service role; admins can review them.

CREATE POLICY "email_log_all_admin"     ON email_log     FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "subscriptions_select_partner" ON subscriptions FOR SELECT USING (is_partner_in_couple(couple_id));
CREATE POLICY "subscriptions_all_admin" ON subscriptions FOR ALL USING (get_user_role() = 'admin');
