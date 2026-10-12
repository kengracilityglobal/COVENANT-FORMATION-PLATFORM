# Covenant Formation — Marriage Formation Platform

Built on Next.js 15 (App Router), Supabase (Postgres + Auth + RLS), Resend,
and optionally Anthropic Claude. Deployed to Vercel.

A marriage-formation platform for couples preparing for or growing in
covenant marriage — **and for singles who want to know how ready they
are before there's a couple to assess.** Each partner in a couple takes a
50-question assessment independently; the platform computes both
partners' scores across eight pillars of covenant life and the
**Perception Gap** between them — a dyadic diagnostic EIKON (its sibling
platform, individual character formation) does not need, because EIKON
scores one person, not a pair. One shared Formation Guide walks with each
couple, seeing both partners' results side by side.

A single person with no partner yet can instead take the **Readiness**
track — a shorter, 32-question version of the same eight pillars, worded
around their own patterns in their closest relationships rather than a
marriage that doesn't exist yet, with its own dashboard and its own
report framing (no partner comparison, since there's no partner). See
`docs/PILLARS.md`'s "readiness track" section.

Every participant — married, premarital, or solo — can also keep private
or Guide-shared reflections on the **Fruit of the Spirit** (Galatians
5:22-23): never scored, never ranked, just a space to be honest about
love, joy, peace, patience, kindness, goodness, faithfulness, gentleness,
and self-control as they actually show up (or don't) in a marriage.

See `docs/PILLARS.md` for the eight pillars, their anchor words, and how
they map onto the ten relationship-research dimensions (Self-Awareness,
Communication, Conflict & Repair, Emotional Intimacy, Trust & Safety,
Values & Beliefs, Money & Responsibility, Family/Roles & Future, Intimacy &
Romance, Growth & Partnership) this build was shaped against.

See `docs/VERIFICATION.md` for exactly what was built, tested, and
deliberately left out of this v1 — read that before assuming any
unlisted feature exists.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (password + magic link) |
| AI (optional) | Anthropic Claude — written-answer scoring + personalised report portraits. The platform works fully without it; it falls back to a deterministic keyword scorer and a full offline report (see `docs/OFFLINE-REPORT.md`). |
| Email | Resend (report-ready notice, unsubscribe) |
| Deployment | Vercel |

No payment provider, no cloud file storage, and no cron jobs are wired
into this v1 — see `docs/VERIFICATION.md` for why and what that means.

---

## 1. Install

```bash
npm install
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase project values (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), a Resend API
key and verified from-address, `NEXT_PUBLIC_APP_URL` (your real deployed
domain — report-ready/unsubscribe email links are built from this), and an
`INTERNAL_API_SECRET` (`openssl rand -hex 32`). `ANTHROPIC_API_KEY` is
optional — see `.env.example` for what changes if it's left blank.

## 3. Database setup

Run all six migrations, **in order, each as its own execution** — one
file, run, confirmed, then the next. This matters more than it sounds: if
you're using the Supabase SQL editor, paste and run one file at a time,
not the whole folder concatenated together. Migration 004 adds a new
database enum value, and Postgres refuses to let a brand-new enum value be
referenced anywhere else — including in migration 005's CHECK constraint —
inside the same transaction that creates it. `psql` run file-by-file
handles this safely by default; the Supabase SQL editor runs a pasted
script as a single implicit transaction, so pasting 004 and 005 together
(or the whole folder in one paste) will fail with
`ERROR: 55P04: unsafe use of new value "readiness" of enum type assessment_track`.
Running each file as its own SQL editor execution avoids this entirely.

1. `supabase/migrations/001_initial_schema.sql` — tables, enums, indexes.
2. `supabase/migrations/002_rls_and_guards.sql` — Row Level Security
   policies, the signup-role-hardening trigger, and the column-guard
   triggers that stop a participant from writing to server-only columns
   (role, scores, status, etc.) directly.
3. `supabase/migrations/003_questions_seed_married.sql` — the 50-question
   married-track question bank (8 pillars × 6 questions + 2 cross-pillar).
   The premarital track is supported architecturally but has no seeded
   questions yet — see `docs/VERIFICATION.md`.
4. `supabase/migrations/004_readiness_track_enum.sql` — adds the solo
   `'readiness'` value to the `assessment_track` enum. Kept as its own
   migration, and must be run and committed before migration 005, for the
   Postgres reason explained above.
5. `supabase/migrations/005_readiness_and_fruit.sql` — the solo
   `readiness` track's schema (nullable `couple_id` on `assessments`,
   guarded by a CHECK constraint so every other track still requires a
   couple) and the `fruit_reflections` table for the unscored Fruit of the
   Spirit layer.
6. `supabase/migrations/006_questions_seed_readiness.sql` — the
   32-question readiness-track question bank (8 pillars × 4 questions),
   separate from the married bank.

All six have been run clean, in order (each as its own execution, exactly
as described above), against a real local Postgres 16 instance as part of
this build (not just read by eye) — see `docs/VERIFICATION.md` for what
that testing covered, including the v1.1 section for migrations 004–006
specifically.

## 4. Supabase Auth configuration

In the Supabase Dashboard, under **Authentication → URL Configuration**:
- Site URL: your real deployed domain
- Redirect URLs: add `<your-domain>/auth/callback`

## 5. Deploy to Vercel

```bash
vercel
```

Set every variable from `.env.example` in the Vercel project settings
before deploying.

## 6. Creating the first admin account

1. Register normally at `/register`.
2. In the Supabase SQL editor:
   `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`
3. Sign back in — you'll land on `/admin`.

From `/admin`, promote other accounts to Formation Guide via
**Admin → Guides → Add Guide** (by email — the person must already have a
Covenant Formation account).

---

## How a couple moves through the platform

1. **Partner A registers**, which creates a `couples` row in `pending`
   status with a generated invite code, and can start their own
   assessment immediately — they don't have to wait for Partner B.
2. **Partner B joins** using the invite code; the couple becomes `active`.
3. Each partner answers all 50 questions **independently** — neither sees
   the other's answers.
4. On completion, the scoring engine (`lib/scoring/engine.ts`) scores each
   partner's responses into the 8 pillar scores (`lib/scoring/aggregate.ts`).
5. The report (`GET /api/report/[assessmentId]/html`, rendered fresh on
   every request — never cached) shows each partner their own pillar
   scores plus the **Perception Gap** against their spouse
   (`lib/scoring/gap.ts`) — computed fresh every time, never stored, so it
   can never drift from what each partner actually sees.
6. The assigned **Formation Guide** sees both partners' full results and a
   briefing to prepare for their next conversation with the couple.

## How a single person moves through the platform

1. At onboarding, a single person chooses "go solo" instead of inviting or
   joining a partner — no `couples` row is created; `profiles.intended_track`
   is set to `'readiness'` instead.
2. They answer the 32-question readiness bank independently — there's no
   one else's answers to wait on.
3. Their report shows their own pillar scores and priority areas, framed
   around their own readiness rather than a Perception Gap (there's no
   partner to compare against yet).
4. The same assigned Formation Guide can still see their results and begin
   a conversation with them, same as for a married/premarital couple.
5. They can add Fruit of the Spirit reflections at any point, same as
   anyone else on the platform.

---

## God's Kingdom Malak Ministries

Covenant Formation — a sibling platform to EIKON, built for couples rather
than individuals, on the same conviction: *the two shall become one
flesh* (Genesis 2:24).
