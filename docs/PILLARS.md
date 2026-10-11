# The Eight Pillars of Covenant Formation — and how they hold the ten research dimensions

This platform assesses marriages and engaged couples across **eight pillars**,
not ten, even though the brief it was built against named ten well-established
relationship-research dimensions. This document records that decision
honestly: nothing from the ten was dropped — each one was mapped into the
pillar (or two) where it actually belongs, so the assessment stays short
enough to finish (50 questions, ~20–25 minutes) without turning into a thin,
half-covered 10-pillar instrument.

## Why eight pillars, not ten

Two of the ten dimensions — **Self-Awareness** and **Values & Beliefs** — are
not, on inspection, domains of a marriage in the same sense the other eight
are. They are *qualities that run through* every domain: you can't be
self-aware "about money" and unaware everywhere else, and a couple's values
alignment isn't a line item next to their conflict style — it's underneath
nearly all of it. Giving each its own pillar would have meant either hollow,
repetitive questions ("are you self-aware in a conflict? ... in intimacy?
... about money?") or a ninth and tenth pillar that scored thin because it
only lightly touched for one or two questions. Weaving them through the
pillars where they actually show up produces sharper, more specific
questions and keeps every pillar substantive.

## The mapping

| # | Research dimension | Where it lives | Why |
|---|---|---|---|
| 1 | Self-Awareness | **Conflict & Repair**, **Truthful Communication** | Self-awareness shows up concretely as: do you know your own triggers mid-argument, and can you name your own part in a miscommunication rather than only the other person's? Both pillars' reflective questions probe this directly (e.g. `CF_RE_01` asks what in the participant themselves made a tested commitment harder, not just what circumstances did). |
| 2 | Communication | **Truthful Communication** | Direct match — the pillar is named for it. |
| 3 | Conflict & Repair | **Conflict & Repair** | Direct match. |
| 4 | Emotional Intimacy | **Intimacy** (*yada*) | Direct match — this pillar was deliberately split out from Oneness in the v0.1→v0.2 revision specifically to give emotional and physical intimacy its own first-class domain. |
| 5 | Trust & Safety | **Covenant Faithfulness** (*chesed*), with a secondary thread in **Truthful Communication** | Reliability and emotional safety are what covenant faithfulness actually is — keeping your word, consistency whether or not your spouse is in the room (`CF_FR_02`). Honesty under cost is the trust-and-safety half of truthful communication. |
| 6 | Values & Beliefs | **Covenant Faithfulness**, with a secondary thread in **Shared Vision & Stewardship** | A couple's shared or divergent faith and non-negotiables are the foundation a covenant is kept *on*; `SV_RE_01` also explicitly invites naming divergence in "what you each actually believe and practice as faith," alongside money, parenting, and calling. |
| 7 | Money & Responsibility | **Shared Vision & Stewardship** (*koinonia*) | Direct match — this pillar was explicitly broadened in the v0.1→v0.2 revision to name finances outright, not leave them implicit. |
| 8 | Family, Roles & Future | **Shared Vision & Stewardship** | Direct match — in-laws, children, roles, and the 5–10-year vision conversation (`SV_SC_02`) all live here. |
| 9 | Intimacy & Romance | **Intimacy** | Direct match. |
| 10 | Growth & Partnership | **Oneness** (*echad*), with a secondary thread in **Mutual Honor** | Teamwork, adaptability, and functioning as one unit is oneness itself; actively supporting the other's growth (not just tolerating it) is folded into mutual honor. |

## The readiness track's question bank (singles, v1.1)

The married track's 50 questions assume an existing marriage to report on
("how reliably do you actually show up for your spouse"). They are not
reused for the solo Readiness track added in v1.1, because a single person
has no marriage to report on yet — asking them anyway would either force
hypothetical answers or silently assume they're already partnered.

Instead, `supabase/migrations/006_questions_seed_readiness.sql` seeds a
dedicated 32-question bank (4 per pillar: 2 frequency + 1 scenario + 1
reflective_disclosure, across the same 8 pillars above) worded around the
person's own patterns and track record in their closest relationships —
what they'd actually bring into a marriage — rather than a marriage that
doesn't exist yet. Shorter than the married track (32 vs. 50 questions,
~12–15 minutes) because a solo assessment is read against fewer honest
reference points than a married one. See `docs/VERIFICATION.md`'s v1.1
section for how this bank was verified (seeded shape, real scoring-engine
run, RLS coverage) and `lib/report/builder.ts`'s `PILLAR_COST_READINESS`/
`DESCRIPTOR_FRAME_READINESS` for how report language was reworded to match
— never assuming a spouse that doesn't exist yet.

## What changed in this build because of this mapping

- `supabase/migrations/003_questions_seed_married.sql`: `SV_RE_01`'s question
  text was broadened to explicitly name "what you each actually believe and
  practice as faith" alongside money/parenting/calling/extended family — this
  was the one real gap (Values & Beliefs had no explicit textual presence
  anywhere in the original 50). `CF_RE_01` was broadened to ask what the
  participant now sees "in yourself, not just the circumstances" — bringing
  Self-Awareness explicitly into the question's own wording rather than
  leaving it implicit in the scoring rubric alone.
- `lib/report/generate.ts` (`PILLAR_PLAIN`, used to brief the AI portrait
  writer) and `lib/report/builder.ts` (`PILLAR_COST`, used in the fallback
  portrait when AI generation hasn't run yet) were both updated so every
  pillar's plain-English description explicitly names its research-dimension
  threads — this means every AI-written report section is briefed to notice
  self-awareness, trust/safety, values alignment, and partnership-growth
  patterns within the pillar it's writing about, not just the pillar's
  headline theme.
- The 50-question count and 6-questions-per-pillar structure were
  **deliberately not changed** — adding two more "dimension" pillars, or
  padding existing pillars with additional dimension-specific questions,
  would have pushed the instrument well past its intended 20–25 minute
  length. If real-world use shows a specific dimension (e.g. boundaries/
  jealousy specifically, under Trust & Safety) needs its own dedicated
  question rather than living inside an existing one, that is a natural
  candidate for the **premarital track's** question bank (not yet seeded —
  see `docs/VERIFICATION.md`), since forward-looking boundary-setting is a
  more natural premarital conversation than a married-track retrospective
  one.
