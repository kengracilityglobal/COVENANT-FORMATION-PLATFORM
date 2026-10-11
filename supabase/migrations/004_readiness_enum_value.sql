-- Covenant Formation Platform — Migration 004 — run this ALONE, as its own query.
-- Postgres won't let a newly added enum value be used until the
-- transaction that added it has committed (error 55P04), so this
-- statement must be committed before part B runs.
ALTER TYPE assessment_track ADD VALUE IF NOT EXISTS 'readiness';
