# The offline report

Everything in a report that does not need an AI key is built by two files:

- `lib/report/offline-content.ts` holds all the authored wording. Edit prose here.
- `lib/report/offline-portrait.ts` chooses between finished pieces and adds the
  person's own evidence. It never builds sentences from fragments.

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
