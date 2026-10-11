-- ============================================================
-- Covenant Formation Platform — Migration 001: Initial Schema
-- Forked from EIKON's schema pattern. See docs/VERIFICATION.md for
-- what carried over as-is vs. what was rebuilt for the dyadic model.
-- Run: supabase db push  OR  paste into Supabase SQL editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('participant', 'guide', 'admin');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'paused', 'expired');
CREATE TYPE assessment_status AS ENUM ('not_started', 'in_progress', 'completed', 'report_generated');
CREATE TYPE question_type AS ENUM ('scenario', 'frequency', 'reflective_disclosure');

-- The eight pillars of covenant formation. See docs/PILLARS.md.
CREATE TYPE pillar_name AS ENUM (
  'covenant_faithfulness', 'oneness', 'sacrificial_love', 'intimacy',
  'truthful_communication', 'conflict_repair', 'mutual_honor', 'shared_vision',
  'cross_pillar'
);

CREATE TYPE formation_descriptor AS ENUM ('christformed', 'rooted', 'growing', 'awakening', 'unengaged');

-- Premarital (readiness, forward-looking) vs. married (lived-history,
-- repair-oriented). Same pillars, same dyadic mechanism, different
-- question framing — see docs/PILLARS.md.
CREATE TYPE assessment_track AS ENUM ('premarital', 'married');

CREATE TYPE partner_slot AS ENUM ('partner_a', 'partner_b');
CREATE TYPE couple_status AS ENUM ('pending', 'active');
CREATE TYPE payment_provider AS ENUM ('paystack', 'flutterwave', 'paypal');
CREATE TYPE payment_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- ── PROFILES ────────────────────────────────────────────────────

CREATE TABLE profiles (
  id                      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               text        NOT NULL,
  email                   text        NOT NULL UNIQUE,
  role                    user_role   NOT NULL DEFAULT 'participant',
  guide_id                uuid        NULL,
  subscription_status     subscription_status NOT NULL DEFAULT 'trial',
  onboarding_completed    boolean     NOT NULL DEFAULT false,
  relationship_history    jsonb       NULL,
  notification_preferences jsonb      NOT NULL DEFAULT '{"formation_reminders":true,"guide_messages":true,"partner_activity":true}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_guide_id ON profiles(guide_id);

-- ── COUPLES ─────────────────────────────────────────────────────
-- The core new construct over EIKON: two profiles, paired by invite,
-- sharing one Guide and one track. partner_b_id is null until the
-- invite is accepted — the couple exists in 'pending' state from the
-- moment partner A registers, so partner A can start their own
-- assessment immediately without waiting on partner B.

CREATE TABLE couples (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_a_id        uuid            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id        uuid            NULL REFERENCES profiles(id) ON DELETE SET NULL,
  guide_id            uuid            NULL REFERENCES profiles(id) ON DELETE SET NULL,
  track               assessment_track NOT NULL,
  status              couple_status   NOT NULL DEFAULT 'pending',
  invite_code         text            NOT NULL UNIQUE,
  invite_email        text            NULL,
  cycle_number        integer         NOT NULL DEFAULT 1,
  created_at          timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT couples_partners_distinct CHECK (partner_a_id IS DISTINCT FROM partner_b_id)
);

CREATE INDEX idx_couples_partner_a ON couples(partner_a_id);
CREATE INDEX idx_couples_partner_b ON couples(partner_b_id);
CREATE INDEX idx_couples_guide_id ON couples(guide_id);
CREATE INDEX idx_couples_invite_code ON couples(invite_code);

-- A profile can only be on one side of one couple at a time (a given
-- cycle re-pairing is a new couple row, not a reused one).
CREATE UNIQUE INDEX idx_couples_partner_a_unique ON couples(partner_a_id);
CREATE UNIQUE INDEX idx_couples_partner_b_unique ON couples(partner_b_id) WHERE partner_b_id IS NOT NULL;

-- ── QUESTIONS ───────────────────────────────────────────────────

CREATE TABLE questions (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    text          NOT NULL UNIQUE,
  pillar                  pillar_name   NOT NULL,
  track                   assessment_track NOT NULL,
  question_type           question_type NOT NULL,
  sequence_order          integer       NOT NULL,
  question_text           text          NOT NULL,
  scale_reversed          boolean       NOT NULL DEFAULT false,
  scoring_rubric          jsonb         NOT NULL DEFAULT '{}'::jsonb,
  integrity_flag_logic    jsonb         NULL,
  cross_ref_questions     jsonb         NULL,
  active                  boolean       NOT NULL DEFAULT true,
  created_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_pillar ON questions(pillar);
CREATE INDEX idx_questions_track ON questions(track);
CREATE INDEX idx_questions_active ON questions(active);
CREATE INDEX idx_questions_sequence ON questions(track, pillar, sequence_order);

-- ── ASSESSMENTS ─────────────────────────────────────────────────
-- Still one assessment per person, same as EIKON — a couple never has
-- a single shared assessment row, so neither partner's answers can be
-- overwritten or blended by the other's. couple_id + track let the
-- pair be reassembled for the gap report without storing the gap
-- itself anywhere (see lib/scoring/gap.ts — always computed fresh).

CREATE TABLE assessments (
  id                      uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id          uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id               uuid              NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  track                   assessment_track  NOT NULL,
  cycle_number            integer           NOT NULL DEFAULT 1,
  status                  assessment_status NOT NULL DEFAULT 'not_started',
  started_at              timestamptz       NULL,
  completed_at            timestamptz       NULL,
  last_question_index     integer           NOT NULL DEFAULT 0,
  pillar_scores           jsonb             NULL,
  pillar_descriptors      jsonb             NULL,
  integrity_flags         jsonb             NULL,
  priority_stack          jsonb             NULL,
  overall_score           numeric(5,2)      NULL,
  report_generated_at     timestamptz       NULL,
  scoring_notes           text              NULL,
  pillar_score_overrides  jsonb             NULL,
  participant_acknowledgement jsonb         NULL,
  created_at              timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_participant ON assessments(participant_id);
CREATE INDEX idx_assessments_couple ON assessments(couple_id);
CREATE INDEX idx_assessments_status ON assessments(status);
-- One assessment per person per cycle (mirrors EIKON's per-participant uniqueness).
CREATE UNIQUE INDEX idx_assessments_unique_cycle ON assessments(participant_id, cycle_number);

-- ── RESPONSES ───────────────────────────────────────────────────

CREATE TABLE responses (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       uuid              NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  participant_id      uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id         uuid              NOT NULL REFERENCES questions(id),
  response_text       text              NULL,
  response_scale      integer           NULL CHECK (response_scale BETWEEN 1 AND 5),
  computed_score      numeric(5,2)      NULL,
  descriptor_assigned formation_descriptor NULL,
  flags_raised        jsonb             NULL,
  word_count          integer           NULL,
  response_time_seconds integer         NULL,
  answered_at         timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_assessment ON responses(assessment_id);
CREATE INDEX idx_responses_participant ON responses(participant_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE UNIQUE INDEX idx_responses_unique ON responses(assessment_id, question_id);

-- ── REPORT CONTENT ──────────────────────────────────────────────
-- Static fallback narrative content, same role as in EIKON: used when
-- an AI-personalised portrait hasn't been generated for a pillar yet.

CREATE TABLE report_content (
  id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  text                  NOT NULL,
  pillar        pillar_name           NULL,
  descriptor    formation_descriptor  NULL,
  content_key   text                  NOT NULL,
  content_text  text                  NOT NULL,
  version       integer               NOT NULL DEFAULT 1,
  active        boolean               NOT NULL DEFAULT true,
  created_at    timestamptz           NOT NULL DEFAULT now(),
  updated_at    timestamptz           NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_content_lookup ON report_content(pillar, descriptor, content_type) WHERE active = true;

-- ── AI PORTRAITS ────────────────────────────────────────────────
-- Same shape as EIKON: an optional, answer-anchored enrichment layer
-- the report renders when present and falls back from cleanly when not.

CREATE TABLE ai_portraits (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   uuid          NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  pillar          pillar_name   NOT NULL,
  content         jsonb         NOT NULL,
  generated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_portraits_unique ON ai_portraits(assessment_id, pillar);

-- ── GUIDE BRIEFINGS ─────────────────────────────────────────────
-- Keyed to couple_id, not participant_id — a Guide prepares for a
-- couple, not for one partner in isolation.

CREATE TABLE guide_briefings (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     uuid          NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  guide_id      uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       jsonb         NOT NULL,
  generated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_guide_briefings_unique ON guide_briefings(couple_id);

-- ── EMAIL LOG ───────────────────────────────────────────────────

CREATE TABLE email_log (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type    text          NOT NULL,
  sent_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_log_recipient ON email_log(recipient_id, email_type);

-- ── SUBSCRIPTIONS (payments — scaffolded, not wired in v1) ──────
-- Table kept so the schema matches where payments will plug in later
-- (see docs/VERIFICATION.md — payment routes are deliberately deferred
-- in this build, not broken; there are simply no routes writing to
-- this table yet).

CREATE TABLE subscriptions (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id           uuid              NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  provider            payment_provider  NOT NULL,
  provider_subscription_id text         NOT NULL,
  status              payment_status    NOT NULL,
  current_period_end  timestamptz       NULL,
  created_at          timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_couple ON subscriptions(couple_id);

-- Add FK from profiles.guide_id now that profiles/couples both exist.
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_guide FOREIGN KEY (guide_id) REFERENCES profiles(id) ON DELETE SET NULL;
