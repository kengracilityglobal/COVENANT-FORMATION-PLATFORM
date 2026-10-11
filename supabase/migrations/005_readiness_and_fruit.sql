-- ============================================================
-- Covenant Formation Platform — Migration 005
-- Two additions, requested directly by ministry leadership after
-- reviewing v1:
--
-- 1. A solo "Readiness" track for singles who are not yet paired with
--    a partner — discerning marriage-readiness rather than reviewing a
--    lived marriage. No couple is required; there is therefore no
--    Perception Gap for this track (see docs/VERIFICATION.md for what
--    that does and doesn't mean for the report).
--
-- 2. An unscored Fruit of the Spirit reflection layer (Galatians 5:22-23),
--    deliberately built the way EIKON built its own: narrative only, no
--    Likert scale, no computed score, nothing that could be read as
--    "your Patience score is 62." It exists because fruit is produced by
--    abiding, not achieved by trying harder at it — scoring it would
--    teach the opposite of what it's meant to protect. Shared with a
--    Formation Guide only when the participant chooses to.
-- ============================================================

-- ── 1. READINESS TRACK ──────────────────────────────────────────

-- (The 'readiness' enum value is added in 004_readiness_enum_value.sql, which
-- must be run and committed BEFORE this file — otherwise Postgres raises
-- 55P04 "unsafe use of new value" at the CHECK constraint in section 3.)

-- ── 2. FRUIT OF THE SPIRIT ──────────────────────────────────────

CREATE TYPE fruit_name AS ENUM (
  'love', 'joy', 'peace', 'patience', 'kindness',
  'goodness', 'faithfulness', 'gentleness', 'self_control'
);

CREATE TABLE fruit_reflections (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id     uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fruit              fruit_name    NOT NULL,
  reflection_text    text          NOT NULL,
  shared_with_guide  boolean       NOT NULL DEFAULT false,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_fruit_reflections_participant ON fruit_reflections(participant_id);
-- One reflection per person per fruit — written, re-opened, and edited in
-- place over time, not an append-only log. Matches how the UI presents it:
-- nine fruits, each with one evolving reflection.
CREATE UNIQUE INDEX idx_fruit_reflections_unique ON fruit_reflections(participant_id, fruit);

ALTER TABLE fruit_reflections ENABLE ROW LEVEL SECURITY;

-- Fully participant-owned content — nothing here is server-computed, so
-- unlike assessments/profiles there is no column to guard. A Guide only
-- ever sees a reflection the participant has explicitly marked shared,
-- and only for a participant they're actually assigned to (is_guide_of_participant,
-- defined in migration 002).
CREATE POLICY "fruit_reflections_select_own"   ON fruit_reflections FOR SELECT USING (participant_id = auth_uid());
CREATE POLICY "fruit_reflections_select_guide" ON fruit_reflections FOR SELECT USING (shared_with_guide = true AND is_guide_of_participant(participant_id));
CREATE POLICY "fruit_reflections_select_admin" ON fruit_reflections FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "fruit_reflections_insert_own"   ON fruit_reflections FOR INSERT WITH CHECK (participant_id = auth_uid());
CREATE POLICY "fruit_reflections_update_own"   ON fruit_reflections FOR UPDATE USING (participant_id = auth_uid()) WITH CHECK (participant_id = auth_uid());
CREATE POLICY "fruit_reflections_delete_own"   ON fruit_reflections FOR DELETE USING (participant_id = auth_uid());
CREATE POLICY "fruit_reflections_all_admin"    ON fruit_reflections FOR ALL USING (get_user_role() = 'admin');

-- ── 3. SCHEMA CHANGES TO SUPPORT A COUPLE-LESS ASSESSMENT ───────
-- A readiness assessment has no couple, no partner, and therefore no
-- Perception Gap — see lib/scoring/gap.ts, unchanged by this migration,
-- which already handles a null partner input gracefully.

ALTER TABLE assessments ALTER COLUMN couple_id DROP NOT NULL;

-- Every other track still requires a couple; only 'readiness' may have none.
ALTER TABLE assessments ADD CONSTRAINT assessments_couple_required_unless_readiness
  CHECK (track = 'readiness' OR couple_id IS NOT NULL);

-- Records which track a solo (no-couple) participant chose at onboarding,
-- so /api/assessment/start knows what to create without needing a couples
-- row to read it from. Only meaningful when the person has no couple —
-- a paired participant's track always comes from their couple row instead.
ALTER TABLE profiles ADD COLUMN intended_track assessment_track NULL;
