#!/usr/bin/env bash
# Real RLS/guard-trigger test harness against a live local Postgres instance
# running the Covenant Formation migrations unmodified. Each check opens its
# own connection, SETs ROLE + the session-local JWT stand-ins, and runs one
# statement — mirroring how PostgREST/Supabase presents a request. Rejection
# checks assert on ACTUAL DATA STATE afterward, not just exit code, since a
# blocked UPDATE/INSERT in Postgres can silently affect 0 rows under RLS
# rather than raising — a 0-row no-op is just as secure as a raised error.
set -u
PASS=0
FAIL=0

PARTNER_A="11111111-1111-1111-1111-111111111111"
PARTNER_B="22222222-2222-2222-2222-222222222222"
GUIDE="33333333-3333-3333-3333-333333333333"
ADMIN="44444444-4444-4444-4444-444444444444"
STRANGER="55555555-5555-5555-5555-555555555555"

as() {
  local pgrole="$1" uid="$2" sql="$3"
  sudo -u postgres psql -d covenant_test -t -A -q -v ON_ERROR_STOP=1 \
    -c "SET ROLE ${pgrole}; SET request.jwt.uid = '${uid}'; SET request.jwt.role = '${pgrole}'; ${sql}" 2>&1
}

expect_success() {
  local desc="$1" pgrole="$2" uid="$3" sql="$4"
  local out; out=$(as "$pgrole" "$uid" "$sql")
  if [ $? -eq 0 ]; then PASS=$((PASS+1)); echo "PASS  $desc"
  else FAIL=$((FAIL+1)); echo "FAIL  $desc"; echo "      -> $out"; fi
}

# Attempts a write, then independently re-reads the target value (as
# service_role, bypassing RLS) to confirm it did NOT change — correct
# whether Postgres blocked it via a raised exception or a silent 0-row no-op.
expect_blocked_write() {
  local desc="$1" pgrole="$2" uid="$3" write_sql="$4" verify_sql="$5" original_val="$6"
  as "$pgrole" "$uid" "$write_sql" >/dev/null 2>&1
  local after; after=$(as service_role '' "$verify_sql" | tail -1 | tr -d '[:space:]')
  local orig; orig=$(echo "$original_val" | tr -d '[:space:]')
  if [ "$after" = "$orig" ]; then PASS=$((PASS+1)); echo "PASS  $desc (value unchanged: $after)"
  else FAIL=$((FAIL+1)); echo "FAIL  $desc (value changed from '$orig' to '$after')"; fi
}

expect_rowcount() {
  local desc="$1" pgrole="$2" uid="$3" sql="$4" want="$5"
  local out; out=$(as "$pgrole" "$uid" "$sql" | tail -1 | tr -d '[:space:]')
  if [ "$out" = "$want" ]; then PASS=$((PASS+1)); echo "PASS  $desc (got $out)"
  else FAIL=$((FAIL+1)); echo "FAIL  $desc (expected $want, got '$out')"; fi
}

# For an INSERT that should be rejected by RLS. An INSERT violating WITH
# CHECK always raises (unlike UPDATE, which can silently no-op), so this
# doesn't try to chain a verification SELECT onto the same statement —
# it attempts the insert, then independently re-reads with service_role
# to confirm the row never landed, same evidentiary standard as
# expect_blocked_write.
expect_insert_blocked() {
  local desc="$1" pgrole="$2" uid="$3" insert_sql="$4" verify_sql="$5"
  as "$pgrole" "$uid" "$insert_sql" >/dev/null 2>&1
  local count; count=$(as service_role '' "$verify_sql" | tail -1 | tr -d '[:space:]')
  if [ "$count" = "0" ]; then PASS=$((PASS+1)); echo "PASS  $desc (row count: 0)"
  else FAIL=$((FAIL+1)); echo "FAIL  $desc (expected 0 rows, found $count)"; fi
}

echo "=== SETUP (service_role, bypasses RLS) ==="
as service_role '' "
INSERT INTO auth.users (id, email) VALUES
  ('$PARTNER_A', 'partnera@test.com'),
  ('$PARTNER_B', 'partnerb@test.com'),
  ('$GUIDE', 'guide@test.com'),
  ('$ADMIN', 'admin@test.com'),
  ('$STRANGER', 'stranger@test.com');
" >/dev/null
as service_role '' "UPDATE profiles SET role = 'guide' WHERE id = '$GUIDE';" >/dev/null
as service_role '' "UPDATE profiles SET role = 'admin' WHERE id = '$ADMIN';" >/dev/null
echo "profiles seeded: $(as service_role '' 'SELECT count(*) FROM profiles;' | tail -1)"

echo ""
echo "=== COUPLE CREATION & PAIRING ==="
expect_success "Partner A creates their own couple row" authenticated "$PARTNER_A" \
  "INSERT INTO couples (id, partner_a_id, track, invite_code) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '$PARTNER_A', 'married', 'INVITE-001');"

expect_insert_blocked "Partner A cannot create a couple row naming someone else as partner_a" authenticated "$PARTNER_A" \
  "INSERT INTO couples (partner_a_id, track, invite_code) VALUES ('$STRANGER', 'married', 'INVITE-999');" \
  "SELECT count(*) FROM couples WHERE invite_code = 'INVITE-999';"

as service_role '' "UPDATE couples SET partner_b_id = '$PARTNER_B', status = 'active' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';" >/dev/null
as service_role '' "UPDATE couples SET guide_id = '$GUIDE' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';" >/dev/null
expect_rowcount "Couple is active with both partners + guide after service-role pairing" service_role '' \
  "SELECT count(*) FROM couples WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001' AND partner_b_id = '$PARTNER_B' AND guide_id = '$GUIDE' AND status = 'active';" "1"

echo ""
echo "=== ASSESSMENTS ==="
expect_success "Partner A creates own assessment (not_started)" authenticated "$PARTNER_A" \
  "INSERT INTO assessments (id, participant_id, couple_id, track) VALUES ('bbbbbbbb-0000-0000-0000-00000000000a', '$PARTNER_A', 'aaaaaaaa-0000-0000-0000-000000000001', 'married');"
expect_success "Partner B creates own assessment (not_started)" authenticated "$PARTNER_B" \
  "INSERT INTO assessments (id, participant_id, couple_id, track) VALUES ('bbbbbbbb-0000-0000-0000-00000000000b', '$PARTNER_B', 'aaaaaaaa-0000-0000-0000-000000000001', 'married');"

expect_insert_blocked "Partner A cannot create an assessment for Partner B" authenticated "$PARTNER_A" \
  "INSERT INTO assessments (participant_id, couple_id, track) VALUES ('$PARTNER_B', 'aaaaaaaa-0000-0000-0000-000000000001', 'married');" \
  "SELECT count(*) FROM assessments WHERE participant_id = '$PARTNER_B' AND id != 'bbbbbbbb-0000-0000-0000-00000000000b';"

expect_blocked_write "Partner A cannot self-mark their assessment completed" authenticated "$PARTNER_A" \
  "UPDATE assessments SET status = 'completed' WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" \
  "SELECT status FROM assessments WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" "not_started"

expect_blocked_write "Partner A cannot self-mark their assessment report_generated" authenticated "$PARTNER_A" \
  "UPDATE assessments SET status = 'report_generated' WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" \
  "SELECT status FROM assessments WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" "not_started"

expect_success "Partner A CAN move their own assessment to in_progress" authenticated "$PARTNER_A" \
  "UPDATE assessments SET status = 'in_progress', last_question_index = 3 WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';"

expect_blocked_write "Partner A cannot forge pillar_scores on their own assessment" authenticated "$PARTNER_A" \
  "UPDATE assessments SET pillar_scores = '{\"oneness\": 100}'::jsonb WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" \
  "SELECT pillar_scores FROM assessments WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" ""

expect_blocked_write "Partner A cannot reassign their assessment to another participant" authenticated "$PARTNER_A" \
  "UPDATE assessments SET participant_id = '$STRANGER' WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" \
  "SELECT participant_id FROM assessments WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" "$PARTNER_A"

as service_role '' "UPDATE assessments SET status = 'completed', pillar_scores = '{\"oneness\": 72}'::jsonb WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a';" >/dev/null
expect_success "Service role (the scoring route) CAN complete an assessment" service_role '' \
  "SELECT 1 FROM assessments WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000a' AND status = 'completed';"

echo ""
echo "=== CROSS-PARTNER / CROSS-COUPLE ISOLATION (the core dyadic-privacy guarantee) ==="
expect_rowcount "Partner A sees exactly their OWN assessment, not Partner B's" authenticated "$PARTNER_A" \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "1"
expect_rowcount "Partner B sees exactly their OWN assessment, not Partner A's" authenticated "$PARTNER_B" \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "1"
expect_rowcount "A random authenticated stranger sees ZERO rows on this couple" authenticated "$STRANGER" \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "0"
expect_rowcount "A random stranger sees ZERO of this couple's profiles" authenticated "$STRANGER" \
  "SELECT count(*) FROM profiles WHERE id IN ('$PARTNER_A','$PARTNER_B');" "0"
expect_rowcount "A random stranger cannot see the couple row itself" authenticated "$STRANGER" \
  "SELECT count(*) FROM couples WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';" "0"
expect_rowcount "An unauthenticated (anon) request sees ZERO assessments" anon '' \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "0"

echo ""
echo "=== RESPONSES (never shared between partners directly) ==="
as service_role '' "
INSERT INTO responses (assessment_id, participant_id, question_id, response_scale, computed_score)
SELECT 'bbbbbbbb-0000-0000-0000-00000000000a', '$PARTNER_A', id, 4, 80 FROM questions WHERE code = 'ON_FR_01';
INSERT INTO responses (assessment_id, participant_id, question_id, response_scale, computed_score)
SELECT 'bbbbbbbb-0000-0000-0000-00000000000b', '$PARTNER_B', id, 2, 40 FROM questions WHERE code = 'ON_FR_01';
" >/dev/null
expect_rowcount "Partner A sees only their own response row, never Partner B's" authenticated "$PARTNER_A" \
  "SELECT count(*) FROM responses WHERE participant_id = '$PARTNER_B';" "0"
expect_insert_blocked "Partner A cannot INSERT a response impersonating Partner B" authenticated "$PARTNER_A" \
  "INSERT INTO responses (assessment_id, participant_id, question_id, response_scale) VALUES ('bbbbbbbb-0000-0000-0000-00000000000b', '$PARTNER_B', (SELECT id FROM questions LIMIT 1), 5);" \
  "SELECT count(*) FROM responses WHERE participant_id = '$PARTNER_B' AND response_scale = 5;"

echo ""
echo "=== GUIDE ACCESS (assigned Guide sees BOTH partners; no one else's couples) ==="
expect_rowcount "Guide sees BOTH partners' assessments for their assigned couple" authenticated "$GUIDE" \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "2"
expect_rowcount "Guide sees BOTH partners' response rows for their assigned couple" authenticated "$GUIDE" \
  "SELECT count(*) FROM responses WHERE assessment_id IN ('bbbbbbbb-0000-0000-0000-00000000000a','bbbbbbbb-0000-0000-0000-00000000000b');" "2"
expect_success "Guide can SELECT the couple row they're assigned to" authenticated "$GUIDE" \
  "SELECT 1 FROM couples WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';"
as service_role '' "
INSERT INTO auth.users (id, email) VALUES ('66666666-6666-6666-6666-666666666666', 'otherguide@test.com');
UPDATE profiles SET role = 'guide' WHERE id = '66666666-6666-6666-6666-666666666666';
" >/dev/null
expect_rowcount "A DIFFERENT guide (not assigned to this couple) sees zero of its assessments" authenticated "66666666-6666-6666-6666-666666666666" \
  "SELECT count(*) FROM assessments WHERE couple_id = 'aaaaaaaa-0000-0000-0000-000000000001';" "0"

echo ""
echo "=== ADMIN ACCESS (full visibility) ==="
expect_rowcount "Admin sees all 6 seeded profiles" authenticated "$ADMIN" \
  "SELECT count(*) FROM profiles;" "6"
expect_success "Admin can write report_content" authenticated "$ADMIN" \
  "INSERT INTO report_content (content_type, content_key, content_text) VALUES ('test','k','v');"

echo ""
echo "=== PRIVILEGE ESCALATION ATTEMPTS (the exact gap EIKON's 009 migration fixed) ==="
expect_blocked_write "Partner A cannot self-promote to admin" authenticated "$PARTNER_A" \
  "UPDATE profiles SET role = 'admin' WHERE id = '$PARTNER_A';" \
  "SELECT role FROM profiles WHERE id = '$PARTNER_A';" "participant"
expect_blocked_write "Partner A cannot reassign their own guide_id" authenticated "$PARTNER_A" \
  "UPDATE profiles SET guide_id = '$PARTNER_A' WHERE id = '$PARTNER_A';" \
  "SELECT guide_id FROM profiles WHERE id = '$PARTNER_A';" ""
expect_blocked_write "Partner A cannot change their own subscription_status" authenticated "$PARTNER_A" \
  "UPDATE profiles SET subscription_status = 'active' WHERE id = '$PARTNER_A';" \
  "SELECT subscription_status FROM profiles WHERE id = '$PARTNER_A';" "trial"
expect_success "Partner A CAN update their own full_name (an unguarded column)" authenticated "$PARTNER_A" \
  "UPDATE profiles SET full_name = 'Partner A Updated' WHERE id = '$PARTNER_A';"
expect_blocked_write "Partner A cannot hijack the couple by rewriting partner_b_id" authenticated "$PARTNER_A" \
  "UPDATE couples SET partner_b_id = '$STRANGER' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';" \
  "SELECT partner_b_id FROM couples WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';" "$PARTNER_B"
expect_blocked_write "A stranger cannot update a profile that isn't theirs" authenticated "$STRANGER" \
  "UPDATE profiles SET full_name = 'Hijacked' WHERE id = '$PARTNER_A';" \
  "SELECT full_name FROM profiles WHERE id = '$PARTNER_A';" "Partner A Updated"

echo ""
echo "=== QUESTIONS TABLE (no direct end-user access — service role only) ==="
expect_rowcount "An ordinary authenticated participant gets ZERO rows selecting questions directly" authenticated "$PARTNER_A" \
  "SELECT count(*) FROM questions;" "0"
expect_rowcount "Service role (API route) sees all 50 married-track questions" service_role '' \
  "SELECT count(*) FROM questions WHERE track = 'married';" "50"
expect_rowcount "Service role (API route) sees all 32 readiness-track questions" service_role '' \
  "SELECT count(*) FROM questions WHERE track = 'readiness';" "32"
expect_rowcount "Service role sees 82 questions total across both tracks" service_role '' \
  "SELECT count(*) FROM questions;" "82"

echo ""
echo "=== READINESS TRACK (solo participant, no couple at all — migration 004) ==="
SOLO="77777777-7777-7777-7777-777777777777"
as service_role '' "
INSERT INTO auth.users (id, email) VALUES ('$SOLO', 'solo@test.com');
UPDATE profiles SET intended_track = 'readiness' WHERE id = '$SOLO';
" >/dev/null
expect_success "A solo participant (no couple) can create a readiness assessment with couple_id NULL" authenticated "$SOLO" \
  "INSERT INTO assessments (id, participant_id, couple_id, track) VALUES ('dddddddd-0000-0000-0000-000000000001', '$SOLO', NULL, 'readiness');"
expect_rowcount "That assessment is visible to the solo participant themselves" authenticated "$SOLO" \
  "SELECT count(*) FROM assessments WHERE id = 'dddddddd-0000-0000-0000-000000000001';" "1"
expect_rowcount "A random stranger (Partner A) sees zero of the solo participant's assessments" authenticated "$PARTNER_A" \
  "SELECT count(*) FROM assessments WHERE id = 'dddddddd-0000-0000-0000-000000000001';" "0"
expect_insert_blocked "A non-readiness assessment with a NULL couple_id is rejected by the CHECK constraint" service_role '' \
  "INSERT INTO assessments (id, participant_id, couple_id, track) VALUES ('dddddddd-0000-0000-0000-000000000099', '$PARTNER_A', NULL, 'married');" \
  "SELECT count(*) FROM assessments WHERE id = 'dddddddd-0000-0000-0000-000000000099';"

echo ""
echo "=== FRUIT OF THE SPIRIT (unscored reflection layer, migration 004 — Guide-visible only if shared) ==="
expect_success "Partner A writes a private (unshared) fruit reflection" authenticated "$PARTNER_A" \
  "INSERT INTO fruit_reflections (participant_id, fruit, reflection_text, shared_with_guide) VALUES ('$PARTNER_A', 'patience', 'Working on this.', false);"
expect_success "Partner A writes a shared fruit reflection" authenticated "$PARTNER_A" \
  "INSERT INTO fruit_reflections (participant_id, fruit, reflection_text, shared_with_guide) VALUES ('$PARTNER_A', 'kindness', 'Shared with my Guide.', true);"
expect_rowcount "Partner A sees both of their own reflections (shared and unshared)" authenticated "$PARTNER_A" \
  "SELECT count(*) FROM fruit_reflections WHERE participant_id = '$PARTNER_A';" "2"
expect_insert_blocked "Partner A cannot insert a reflection claiming to be Partner B" authenticated "$PARTNER_A" \
  "INSERT INTO fruit_reflections (participant_id, fruit, reflection_text) VALUES ('$PARTNER_B', 'joy', 'Not actually Partner B.');" \
  "SELECT count(*) FROM fruit_reflections WHERE participant_id = '$PARTNER_B';"
expect_rowcount "The assigned Guide sees ONLY the shared reflection, not the private one" authenticated "$GUIDE" \
  "SELECT count(*) FROM fruit_reflections WHERE participant_id = '$PARTNER_A';" "1"
expect_rowcount "A different (unassigned) guide sees zero of Partner A's reflections" authenticated "66666666-6666-6666-6666-666666666666" \
  "SELECT count(*) FROM fruit_reflections WHERE participant_id = '$PARTNER_A';" "0"
expect_insert_blocked "The unique index blocks a second reflection for the same participant+fruit" authenticated "$PARTNER_A" \
  "INSERT INTO fruit_reflections (participant_id, fruit, reflection_text) VALUES ('$PARTNER_A', 'patience', 'Second attempt.');" \
  "SELECT count(*) FROM fruit_reflections WHERE participant_id = '$PARTNER_A' AND reflection_text = 'Second attempt.';"
expect_success "Partner A CAN update their own reflection text" authenticated "$PARTNER_A" \
  "UPDATE fruit_reflections SET reflection_text = 'Updated reflection.' WHERE participant_id = '$PARTNER_A' AND fruit = 'patience';"
expect_blocked_write "The assigned Guide cannot write to a reflection, only read it" authenticated "$GUIDE" \
  "UPDATE fruit_reflections SET reflection_text = 'Guide edited this.' WHERE participant_id = '$PARTNER_A' AND fruit = 'kindness';" \
  "SELECT reflection_text FROM fruit_reflections WHERE participant_id = '$PARTNER_A' AND fruit = 'kindness';" "Shared with my Guide."

echo ""
echo "================================================"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "================================================"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
