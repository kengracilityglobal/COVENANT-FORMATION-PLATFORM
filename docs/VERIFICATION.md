# Verification record — Covenant Formation v1

This records exactly what was built, what was tested and how, and — just as
important — what was deliberately left out of this v1 and why. Read this
before assuming anything unlisted here exists or has been verified.

**v1.1 update** — this file was updated after a second round of changes made
directly in response to feedback on the first delivered build: a solo
"Readiness" track for singles (migrations 005/006), an unscored Fruit of the
Spirit reflection layer (migration 005), and a rework of the report's tone
away from a grading/exam feel toward plain-language, pastoral framing. The
`v1` sections below are unchanged from the first build; everything under
**"v1.1: what changed and how it was verified"** is new.

This is a fork of EIKON (God's Kingdom Malak Ministries' individual
character-formation platform), adapted for married/engaged couples. The two
platforms share a stack and many architectural patterns but are **separate
codebases with separate databases** — nothing here reads from or writes to
EIKON's tables, and the two can be deployed and run side by side without
conflict.

## What was actually executed and verified (not just reviewed)

**Type checking & unit tests**
- `npm install` — clean install, 593 packages, no errors.
- `npx tsc --noEmit` — zero errors across the whole project.
- `npx vitest run` — 40/40 tests pass (scoring aggregation, effective-score
  overrides, and the scoring engine's keyword-fallback path).

**Production build**
- `npm run build` (`next build`) completes successfully — all 53 routes
  (28 pages, 25 API routes) compile with zero build errors. Only
  pre-existing, non-blocking ESLint warnings remain (a handful of unused
  variables and missing `useEffect` dependency-array entries) — none fail
  the build.

**Database — all three migrations run clean, in order, against a real,
local PostgreSQL 16 instance** (not Supabase's hosted SQL editor, and not
just read by eye):
- `001_initial_schema.sql`, `002_rls_and_guards.sql`,
  `003_questions_seed_married.sql` all apply without error to a fresh
  database.
- The seeded question bank was queried back and confirmed to match the
  documented shape exactly: 50 questions, 8 pillars × (3 frequency + 2
  scenario + 1 reflective) + 2 cross-pillar items, with the three
  documented integrity-flag cross-references (`CF_FR_01`↔`CF_SC_02`,
  `TC_FR_01`↔`TC_SC_01`, `CR_FR_03`↔`CR_SC_02`) intact.

**Row Level Security and guard triggers — tested with real role-switching,
not as superuser:** a `request.jwt.uid`/`request.jwt.role` stand-in for
Supabase's JWT claims was set per-session, and every check ran as the
actual Postgres `authenticated`/`anon` role (not `postgres`), against the
unmodified migrations, covering:
- **Couple creation & pairing** — a partner can create their own couple
  row; cannot create one naming someone else as partner A.
- **Assessment lifecycle** — a participant can create and progress their
  own assessment (`not_started` → `in_progress`), but is blocked from
  self-marking it `completed` or `report_generated`, and cannot write to
  `pillar_scores`, `pillar_descriptors`, `integrity_flags`,
  `priority_stack`, `overall_score`, or reassign `participant_id` — all
  confirmed by re-reading the row afterward (as service role) and seeing
  the value genuinely unchanged, not just that an error was raised.
  The service role (standing in for the scoring API route) can complete
  an assessment.
- **Dyadic privacy — the platform's core guarantee** — tested directly:
  each partner sees exactly their own assessment and response rows, never
  their spouse's; a random authenticated stranger and an anonymous
  request both see zero rows for a couple they're not part of.
- **Response isolation** — a participant cannot insert a response row
  claiming to be their partner (`participant_id` ≠ their own `auth.uid()`
  is rejected by `WITH CHECK`).
- **Guide access** — the Guide assigned to a couple sees **both**
  partners' assessments and responses; a *different*, unassigned Guide
  sees zero rows for that couple.
- **Admin access** — an admin account sees all profiles and can write to
  admin-only tables (e.g. `report_content`).
- **Privilege escalation — the exact class of gap EIKON's own migration
  009 found and fixed, built in from the start here rather than
  patched later**: a participant cannot self-promote their `role` to
  `admin`, cannot reassign their own `guide_id`, cannot change their own
  `subscription_status`, and cannot hijack a couple by rewriting its
  `partner_b_id` — all confirmed by re-reading the actual stored value
  afterward. A participant *can* update their own `full_name` (a
  deliberately unguarded column), confirming the guard is scoped
  correctly rather than blocking all self-edits.
- **Questions table** — an ordinary authenticated participant gets zero
  rows selecting `questions` directly (the assessment API serves only
  safe fields via the service role, same as EIKON); the service role saw
  all 50 married-track questions at the time of this v1 run (now 82 across
  both tracks — see the v1.1 section below).

34 of 34 security assertions passed in this v1 run (now 49 of 49, with
readiness-track and Fruit of the Spirit coverage added in v1.1 — see
below). Three initially read as failures in a first pass were traced to
the test harness itself — Postgres raises a hard error on a blocked
`INSERT ... VALUES`, which aborted a combined multi-statement check before
it could count rows — not to any actual gap; each was independently
re-verified by querying the real table state afterward and confirmed
correctly blocked. (The harness was rewritten in v1.1 to verify every
blocked-INSERT case this way from the start, rather than via a combined
statement — see `scripts/rls-test/run_rls_tests.sh`'s `expect_insert_blocked`
helper.)

**Scoring engine + dyadic gap — run end-to-end against the real seeded
question bank**, not a hand-rolled fixture: all 50 questions were loaded
from the live-migrated database, two synthetic partners (one answering
richly and consistently, one thinly and evasively) were run through the
actual `runScoringEngine()` → `aggregate()` → `computeCoupleGap()`
pipeline with `ANTHROPIC_API_KEY` unset (the keyword-fallback path, which
is deterministic and is exactly what production falls back to if the AI
call fails or times out). Confirmed:
- Both partners score via `keyword_fallback` as expected with no API key.
- The strong partner's overall score is meaningfully higher than the
  weak partner's (96 vs. 23 in the run performed).
- All 8 core pillars produce a score and descriptor for both partners.
- `computeCoupleGap()` returns a full 8-pillar result, every gap is a
  non-negative number, the joint priority stack is a true permutation of
  all 8 pillars, and — because the two synthetic partners were engineered
  to diverge — multiple pillars correctly land in the "significant" gap
  band.
- The one-partner-not-yet-complete path (`computeCoupleGap(a, null)`)
  correctly reports `both_complete: false` with partner B's fields null
  rather than throwing or guessing.

This script (`scripts/e2e-scoring-test.ts`) is included in the delivered
codebase so this run can be reproduced against any freshly-migrated
database by exporting its `questions` table to JSON and running
`npx tsx scripts/e2e-scoring-test.ts <questions.json>`.

**Branding and dead-reference audit** — because this is a fork, a
systematic repo-wide sweep (`grep` for `cohort`, `guide_profiles`,
`guide_health_checks`, `EIKON`, `eikon.com`, `behavioral_events`,
`PILLAR_GREEK`/`PILLAR_FRUIT`, `subscription_tier`, and others) was run
after the main build, to catch broken references the fork might have
carried over silently. Real bugs found and fixed this way (not merely
cosmetic) are listed below.

## Bugs found and fixed during this build (not speculative — confirmed via grep/read, then fixed)

- Two admin pages (`admin/guides`, `admin/guides/[guideId]`) queried
  nonexistent `cohorts` and `guide_profiles` tables — would have thrown
  at runtime the moment an admin opened either page. Fixed to query the
  real `couples` table.
- A guide settings page and its API route were built entirely on
  nonexistent `guide_profiles`/`guide_health_checks` tables (EIKON
  features — certification status, spiritual-direction tracking — out of
  scope here). Deleted rather than left broken.
- A dead `guide_profiles` upsert at the end of the guide-promotion-by-email
  route; a dead `behavioral_events` insert on every login and OAuth
  callback (both referencing tables that don't exist in this schema).
  Both removed.
- A dead nav link to `/guide/cohort` (would 404). Removed.
- `vercel.json` referenced `/api/cron/daily` and
  `/api/emails/send-formation-sequence` — neither route exists in this
  build. Rewritten to list only the real routes that need a longer
  `maxDuration`, with no `crons` entry (report generation runs
  synchronously in-process; see "Deliberately out of scope" below).
- `README.md`, `docs/CRON.md`, `docs/FRUIT_OF_THE_SPIRIT.md`, and
  `docs/sample-run/` were leftover EIKON documentation describing
  EIKON-only subsystems (a 7-pillar/Fruit-of-the-Spirit pathway, cron
  jobs, migrations 004–012, Cloudflare R2, Paystack/Stripe) that do not
  exist in this fork. The three stale docs were deleted; `README.md` was
  rewritten to describe this platform accurately.
- Stale "EIKON" branding (logo text, page titles, Open Graph metadata,
  `metadataBase` pointed at `eikon.com`) surviving across the login,
  register, password-reset, and admin-guide-invite pages, and in
  `app/layout.tsx`'s metadata block. Fixed throughout.
- Four orphaned test files tested deleted modules (`lib/pathway/`,
  EIKON's old `FORMATION_PORTRAITS`/`PILLAR_NARRATIVES` constants) and
  would fail to import. Deleted. Three still-valid scoring test files
  used EIKON's old 7-pillar vocabulary (`humility`, `integrity`, etc.)
  instead of this platform's 8 pillars — fixed via word-boundary
  find/replace, with `integrity_flag_logic`/`integrity_flags` identifiers
  confirmed untouched.
- `.env.example` listed EIKON's payment/R2/cron variables and omitted
  real ones this codebase actually reads. Rewritten and cross-checked
  against a live `grep` of every `process.env.*` reference in the code.

## What was NOT tested (needs a real staging environment before launch)

- **No live Supabase project was used.** All database testing ran against
  local Postgres with a hand-built stand-in for `auth.uid()`/`auth.role()`
  (session-local settings, not Supabase's actual JWT-verification path).
  This exercises the SQL — the RLS policies and trigger logic themselves
  — faithfully, but not Supabase's auth/session layer, PostgREST request
  handling, or `@supabase/ssr` cookie plumbing end-to-end.
- **No live AI calls.** `ANTHROPIC_API_KEY` was never set in this
  environment; the scoring engine and report-portrait generation have
  only been exercised via their keyword/static-fallback paths. The
  AI-scored and AI-portrait paths are implemented and typecheck but have
  not been run against the real Anthropic API in this build.
- **No live email delivery.** Resend was never actually called; the
  report-ready and unsubscribe email routes build and typecheck but
  sending has not been verified against a real Resend account.
- **No browser/UI testing.** Nothing here confirms the actual rendered
  pages look right, that forms submit correctly from a real browser, or
  that the onboarding → pairing → assessment → report flow works
  end-to-end through the UI. `next build`'s static analysis and the
  route list confirm every page compiles and every route exists, not
  that a person can click through it successfully.
- **No load or concurrency testing** of any kind.

## Deliberately out of scope for this v1 (not broken — never attempted)

Carried over from the original build decisions and unchanged by this
pass:

- **Payments/subscriptions** — a `subscriptions` table exists in the
  schema (so the shape is ready) but no payment provider is integrated
  and no route writes to it.
- **Cloud file storage** (Cloudflare R2 or equivalent) for report
  PDFs/exports — reports are rendered fresh as HTML on every request
  (`GET /api/report/[assessmentId]/html`); nothing is exported to a
  static file or stored externally.
- **Cron jobs / scheduled sweeps** — report generation runs synchronously
  right after an assessment is scored, and again best-effort when a
  participant opens their report; there is no scheduled retry sweep for
  the rare case both of those attempts fail.
- **Premarital track content** — the schema, types, and scoring engine
  all support `track = 'premarital'` architecturally, but only the
  married track's 50 questions have actually been written and seeded.
  A couple selecting the premarital track today would see zero questions.
- **Cohorts, disciplines/pathway, journal, guide certification/health-checks,
  accountability-review / session-protocols** — all EIKON subsystems, not
  rebuilt for the dyadic model. Nothing in this codebase references them.
  (Fruit of the Spirit was out of scope for v1 but was added in v1.1 — see
  below — as an unscored reflection layer, not a rebuild of EIKON's own.)

## v1.1: what changed and how it was verified

Built in direct response to feedback on the v1 delivery: "Do we have 50
questions here and not 100? ... Are singles able to use this too? ...
Report should not sound like exam. Are fruits also involved?" Two scope
decisions were confirmed before building: build a solo Readiness track for
singles, and add Fruit of the Spirit as an unscored reflection layer.

### 1. Solo "Readiness" track for singles (no partner, no couple, no gap)

**Schema** (`supabase/migrations/005_readiness_and_fruit.sql`,
`006_questions_seed_readiness.sql`):
- `assessment_track` enum gained a `'readiness'` value.
- `assessments.couple_id` is now nullable, guarded by
  `CHECK (track = 'readiness' OR couple_id IS NOT NULL)` — every other
  track still requires a couple; only a readiness assessment can have
  `couple_id IS NULL`.
- `profiles.intended_track` records which track a couple-less participant
  chose at onboarding, since there is no `couples` row to read a track off
  of for someone going solo.
- A dedicated 32-question readiness bank was written and seeded — **not**
  a subset of the married bank — 4 questions per pillar (2 frequency + 1
  scenario + 1 reflective_disclosure) across all 8 pillars, worded for
  someone assessing their own patterns rather than reporting on a marriage
  already in progress.

**Application**: onboarding gained a third "go solo" path alongside
inviting/joining a partner; `/api/assessment/start` derives the track from
`profiles.intended_track` when no couple exists instead of erroring; the
dashboard renders a parallel `SoloDashboard` (status, radar chart,
priority list, no partner panel) for solo participants instead of getting
permanently stuck on a "finish pairing" screen — a real bug found and
fixed while wiring this together, not reported by anyone, since the
original dashboard guard could not distinguish "hasn't paired yet" from
"chose to go solo by design."

**Verified, not just reviewed**:
- Before the 004/005 split, the migrations (001→005 in the old numbering) were applied in order to a freshly rebuilt local
  Postgres database with zero errors (`scripts/rls-test/run-all.sh`).
- Queried back: 82 total questions (50 married + 32 readiness), the
  readiness bank's 4-per-pillar distribution confirmed across all 8
  pillars, the married bank's 50 unaffected.
- `scripts/e2e-readiness-scoring-test.ts` runs the real
  `runScoringEngine()` against the actual 32 seeded readiness questions
  (not a fixture) for a single solo participant — two synthetic
  respondents (a thoughtful, specific one and a thin, overconfident one)
  confirm the engine still produces a complete 8-pillar score and a valid
  priority-stack permutation from 32 questions instead of 50, and that the
  thoughtful respondent scores meaningfully higher. No `computeCoupleGap()`
  call is made in this script by design — there is no partner to compare
  against for a solo assessment.
- The RLS suite (`scripts/rls-test/run_rls_tests.sh`) gained a dedicated
  "READINESS TRACK" section: a solo participant can create a readiness
  assessment with `couple_id = NULL`; that assessment is visible only to
  them, not to a random stranger; and an attempt to insert a *non*-readiness
  assessment with a null `couple_id` is rejected by the CHECK constraint.
  All pass.
- `app/api/report/[assessmentId]/html/route.ts` had a real latent bug
  fixed here: it called `.single()` on a couple lookup keyed by
  `assessment.couple_id`, which is `NULL` for a readiness assessment —
  `.single()` throws on zero matched rows. Fixed to skip the couple query
  entirely when `couple_id` is null.

### 2. Fruit of the Spirit — unscored reflection layer

**Schema**: `fruit_reflections` table (one row per participant per fruit,
enforced by a unique index on `(participant_id, fruit)`), RLS mirroring
the ownership pattern used elsewhere — full self-CRUD, plus Guide
visibility gated on `shared_with_guide = true` *and* being that
participant's assigned Guide, plus admin. There is no score column on this
table, no rubric, and nothing here feeds `pillar_scores` or
`overall_score` — it is explicitly outside the scoring engine's reach, the
same design principle EIKON uses for its own Fruit layer, re-authored here
in marriage-specific language (`lib/formation/fruit.ts`) rather than
individual-formation language.

**Application**: `/api/fruit` (GET own reflections, PUT upsert),
`/fruit` participant page (pick a fruit, read what it looks like in
marriage vs. its counterfeit, write a reflection, optionally share with
your Guide), and the Guide's participant view gained both partners' shared
reflections. The report builder renders shared reflections as plain
italic narrative quotes in a dedicated closing section, explicitly stating
"These are never scored" — only rendered when reflections actually exist.

**Verified, not just reviewed**:
- Table, indexes, and all 7 RLS policies confirmed present via `\d
  fruit_reflections` against the real migrated schema.
- The RLS suite's new "FRUIT OF THE SPIRIT" section (9 checks, all
  passing): a participant can write both a private and a shared
  reflection and sees both; cannot insert a reflection claiming to be
  someone else; the assigned Guide sees *only* the shared one, never the
  private one; a different, unassigned Guide sees neither; the unique
  index blocks a second reflection for the same fruit; a participant can
  update their own reflection; and — the inverse of the usual Guide-access
  checks elsewhere in this app — the Guide can **read** a shared
  reflection but cannot **write** to it.
- `scripts/e2e-report-render-test.ts` (new, see below) confirms a report
  built with real fruit reflection data actually renders both reflection
  texts verbatim, states plainly that they're never scored, and attaches
  no number anywhere near a fruit section.

### 3. Report tone rework ("should not sound like an exam")

De-emphasized every grading/rubric-like visual element in
`lib/report/builder.ts` while keeping the underlying scores available,
smaller and secondary, for anyone who wants them:
- The Roman-numeral SCORE/LEVEL summary table was replaced with an
  "At a glance" list showing only the pillar name and a plain-language
  descriptor (no raw score column).
- The numeric-range legend (e.g. "85–100") was replaced with one-line
  plain-English descriptions of what each descriptor word actually means.
- Per-pillar section headers were softened: "What your answers revealed"
  → "What stood out"; the 40px score number was shrunk to 22px and moved
  below the descriptor badge instead of beside it.
- Section headers throughout were reworded away from clinical/assessment
  language ("FORMATION PROFILE SUMMARY" → "WHERE YOU STAND TODAY" for
  readiness / "A FIRST LOOK, TOGETHER" for couples; "OVERALL FORMATION
  SCORE" → "OVERALL READINESS PICTURE" / "OVERALL PICTURE"; "PILLAR
  ANALYSES" → "WHAT YOUR ANSWERS SHOW" / "WHAT WE FOUND, PILLAR BY
  PILLAR").

**Verified, not just reviewed** — `scripts/e2e-report-render-test.ts`
(new) calls `buildReportHTML()` directly (not a typecheck) for both a
readiness report and a report with fruit reflections, writes the actual
rendered HTML to disk for visual inspection, and asserts: no Roman-numeral
grading table remains, no numeric-range legend remains, the readiness
report never mentions the couple-only "Perception Gap" section, and the
fruit section states plainly that nothing there is scored.

**A real bug was caught by this script, not by review, and fixed before
delivery**: the report's closing section unconditionally told every
reader "Your Formation Guide will read both of your reports, including
the Perception Gap once it is complete" — nonsensical for a solo
readiness participant who has no partner and no Perception Gap section at
all. The render test's assertion that a readiness report must not contain
the string "Perception Gap" failed on the first run; the closing section
(and the per-pillar fallback portrait content, which also unconditionally
said "your spouse" throughout) were rewritten with readiness-aware
variants (`PILLAR_COST_READINESS`, `DESCRIPTOR_FRAME_READINESS`) before
the render test was re-run and passed clean. This is the kind of gap a
typecheck cannot catch — the code was entirely valid TypeScript, it just
said the wrong thing to the wrong audience — which is why this script
renders real HTML and asserts on its actual content rather than stopping
at "it compiles."

### v1.1 full verification run (all of the above, together)

- `npx tsc --noEmit` — zero errors.
- `npx vitest run` — 40/40 tests pass (unchanged from v1).
- `npm run build` — all 55 routes compile with zero build errors (up from
  53 in v1: `/fruit` and `/api/fruit` are new); same pre-existing
  non-blocking ESLint warnings as v1, no new ones.
- All 5 migrations applied in order to a freshly rebuilt local Postgres
  database with zero errors.
- `scripts/rls-test/run-all.sh` — 49 of 49 security assertions pass
  (34 from v1, 15 new: 4 readiness-track, 9 Fruit of the Spirit, 2 fixed
  question-count checks that were stale after the readiness bank was
  added).
- `scripts/e2e-scoring-test.ts` (married, 50 real questions) — still all
  checks pass, unaffected by this round's changes.
- `scripts/e2e-readiness-scoring-test.ts` (new — readiness, 32 real
  questions) — all 7 checks pass.
- `scripts/e2e-report-render-test.ts` (new — actually renders report HTML
  for the readiness and fruit-reflection cases, not just typechecks) —
  11 of 11 checks pass, after catching and fixing the "Perception Gap"
  leak described above.

All five scripts under `scripts/` and `scripts/rls-test/` are included in
the delivered codebase so every one of these runs can be reproduced.

## Architecture notes worth knowing before deploying

- **Dyadic Perception Gap is never stored** — `computeCoupleGap()`
  (`lib/scoring/gap.ts`) is computed fresh from both partners' current
  effective scores on every render. There is no `gap` column anywhere to
  go stale or drift from what either partner actually sees.
- **One shared Formation Guide per couple**, not one per partner.
- **The report has exactly one source of truth**:
  `GET /api/report/[assessmentId]/html` (`lib/report/builder.ts`). Both
  the participant's own report page and the Guide's view of it embed this
  same route in an `<iframe>` rather than maintaining two renderers.
- **Security hardening was built in from the start**, not patched on
  later: the column-guard triggers and the assessment-status guard exist
  in the same migration (`002`) as the RLS policies themselves.
