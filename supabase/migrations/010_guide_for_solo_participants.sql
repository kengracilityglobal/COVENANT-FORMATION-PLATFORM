-- ============================================================
-- Covenant Formation Platform — Migration 010
-- Let a Formation Guide be assigned to a SOLO (readiness-track) participant.
--
-- Until now a guide could only be attached to a couple (couples.guide_id).
-- A readiness-track participant has no couple row, so no guide could ever
-- see their assessment or report. profiles.guide_id already exists (and is
-- already protected from self-edits by guard_columns); this migration makes
-- the access rules honour it. A participant who IS in a couple keeps the
-- couple's guide as before.
--
-- Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION is_guide_of_participant(p_participant_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM couples
    WHERE guide_id = auth.uid()
    AND (partner_a_id = p_participant_id OR partner_b_id = p_participant_id)
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_participant_id AND guide_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Solo assessments have couple_id = NULL, so is_guide_of_couple() never matches them.
DROP POLICY IF EXISTS "assessments_select_guide_solo" ON assessments;
CREATE POLICY "assessments_select_guide_solo" ON assessments FOR SELECT
  USING (couple_id IS NULL AND is_guide_of_participant(participant_id));

DROP POLICY IF EXISTS "ai_portraits_select_guide_solo" ON ai_portraits;
CREATE POLICY "ai_portraits_select_guide_solo" ON ai_portraits FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_id AND a.couple_id IS NULL AND is_guide_of_participant(a.participant_id))
);
