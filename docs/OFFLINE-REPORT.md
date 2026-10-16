# The offline report

Everything in a report that does not need an AI key is built by two files:

- `lib/report/offline-content.ts` holds all the authored wording. Edit prose here.
- `lib/report/offline-portrait.ts` chooses between finished pieces and adds the
  person's own evidence. It never builds sentences from fragments.

## Depth layers (taster and full report)

Each area shows the short authored portrait, then two more paragraphs written
by hand for every area at every level, in `lib/report/offline-depth.ts`:

| Layer | What it says |
|---|---|
| `UNDERNEATH` | What usually sits beneath the portrait. The root, told with grace. Written once for every family, so it never names a spouse, partner or marriage. |
| `AHEAD_COUPLE` / `AHEAD_READINESS` | What the next season looks like. Couple copy uses the `{sp}` `{Sp}` `{mar}` tokens. Readiness copy is written separately for a single reader. |
| `LEAN` | One sentence on where the score sits in its level (lower or upper third), for every family. Skipped when the edge note already speaks. |

The engine returns these as `depth` on each pillar portrait. The taster shows
them for its free areas, because the taster decides whether someone goes on.
The full report shows them for every area, but only when the portrait came from
the engine: an AI portrait or an admin edited row is left alone. Same wording
rules as everything else, plus no hyphens or dashes. The tests enforce it.

## Voice rules (same as the AI portrait prompt)

Plain English. No framework words (chesed, pillar, Christformed, perception
gap...). First sentence is something they recognise. Name what it costs.
Short sentences. The action is one specific thing, slightly uncomfortable,
simple enough not to avoid. `npx vitest run` enforces the jargon, sentence
length, duplication and token rules, so a bad edit fails loudly.

## Tokens

Couple copy (married and premarital) uses `{sp}` (your spouse / your partner),
`{Sp}` (capitalised) and `{mar}` (your marriage / your relationship). Never
write "spouse" or "marriage" directly in couple copy; a test fails if you do.
Readiness copy has no tokens and must not mention a spouse.

## What is chosen from what

| Piece | Chosen by |
|---|---|
| Portrait, action | pillar x level x (couple or readiness) |
| Band-position note | score within 3 points of a level edge |
| Evidence panel | the person's lowest and highest scoring answer in that pillar, with the question's own `scoring_rubric` line for the level they scored |
| Own words | longest written answer in that pillar, first 1-2 sentences |
| Patterns | score rules in `detectPatterns()` (e.g. sacrificial_love >= 70 and truthful_communication <= 55) |
| Gap reading | direction and size of the gap per pillar (couples, both finished) |
| First month | top three of the priority stack (joint stack when both are finished) |

AI portraits, when present, still win over the offline portrait for their
pillar. Everything else on the page stays offline.

## Adding a pattern

Add text under a new id in `PATTERNS` (both `couple` and `readiness`), then
add the rule to `detectPatterns()` and a test.

## When there is no AI scorer

Written answers are then scored by `keywordScoreWritten` (lib/scoring/engine.ts),
which counts cue words ("felt", "I said", "I regret") and length. It measures how
specific and candid the writing is, not what it says about a pillar. The report
therefore, when `scoring_notes` contains `keyword_fallback`:

- picks the "where this holds / where it slips" answers from the frequency
  ratings only,
- shows no rubric line for a written answer (nothing judged it against the rubric),
- words integrity flags as "a question to talk through, not a finding",
- still quotes the person's own words back to them, and says so plainly in the
  opening note.

Known limit: written items carry weight 1.5 against 1 for ratings, so in this
mode about 60% of each pillar score still comes from that heuristic.
