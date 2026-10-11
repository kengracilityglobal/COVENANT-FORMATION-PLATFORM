// scripts/e2e-scoring-test.ts
//
// End-to-end verification of the real scoring pipeline (runScoringEngine →
// aggregate → computeCoupleGap) against the ACTUAL 50-question bank seeded
// by supabase/migrations/003_questions_seed_married.sql into a local
// Postgres instance — not a hand-rolled fixture. No ANTHROPIC_API_KEY is
// set in this environment, so this exercises the keyword_fallback path,
// which is deterministic and exactly what production falls back to if the
// AI call fails. Two synthetic partners answer every question: "Partner A"
// answers richly and consistently high; "Partner B" answers thinly and
// inconsistently — engineered to prove the gap mechanism actually fires,
// not just that the code runs without throwing.
//
// Run: npx tsx scripts/e2e-scoring-test.ts <path-to-questions.json>

import { readFileSync } from 'fs'
import { runScoringEngine } from '../lib/scoring/engine'
import { computeCoupleGap } from '../lib/scoring/gap'
import { CORE_PILLARS } from '../lib/scoring/aggregate'
import type { Question, Response as EikonResponse } from '../types'

const questionsPath = process.argv[2]
if (!questionsPath) {
  console.error('Usage: tsx scripts/e2e-scoring-test.ts <questions.json>')
  process.exit(1)
}

const rawQuestions: any[] = JSON.parse(readFileSync(questionsPath, 'utf-8'))
const questions: Question[] = rawQuestions as Question[]

if (questions.length !== 50) {
  console.error(`FAIL: expected 50 seeded questions, got ${questions.length}`)
  process.exit(1)
}

// A long, specific, interior-and-action-rich answer — should score well under
// the keyword heuristic (INTERIOR_SIGNALS + ACTION_SIGNALS + HONESTY_MARKERS).
const RICH_ANSWER = `If I'm honest, there was a season about a year in when I felt distant and I noticed I was avoiding real conversation. I struggled with resentment I hadn't named. I told my spouse directly instead of staying silent, even though it was uncomfortable, and I had to admit I had contributed to the gap, not just them. I chose to keep showing up in small ways — I called, I asked questions I was afraid of the answers to, and I did not pretend things were fine when they weren't. It cost me some pride to say that out loud, and I regret how long I waited.`

// A thin, deflecting, self-flattering answer — should score poorly.
const THIN_ANSWER = `I always handle it easily, no problem for me. I'm a very calm person and I never struggle with this. God is teaching me.`

function buildResponses(
  participantId: string,
  assessmentId: string,
  qs: Question[],
  mode: 'strong' | 'weak'
): EikonResponse[] {
  return qs.map((q, i) => {
    const base: any = {
      id: `${assessmentId}-r${i}`,
      assessment_id: assessmentId,
      participant_id: participantId,
      question_id: q.id,
      answered_at: new Date().toISOString(),
    }
    if (q.question_type === 'frequency') {
      // Strong partner self-reports high (5), weak partner reports low/inconsistent (2).
      base.response_scale = mode === 'strong' ? 5 : 2
      base.response_text = null
    } else {
      base.response_scale = null
      base.response_text = mode === 'strong' ? RICH_ANSWER : THIN_ANSWER
    }
    return base as EikonResponse
  })
}

async function main() {
  console.log('=== E2E SCORING ENGINE + DYADIC GAP TEST ===')
  console.log(`Loaded ${questions.length} real seeded questions (married track).\n`)

  const assessmentA = 'bbbbbbbb-0000-0000-0000-00000000000a'
  const assessmentB = 'bbbbbbbb-0000-0000-0000-00000000000b'
  const partnerA = '11111111-1111-1111-1111-111111111111'
  const partnerB = '22222222-2222-2222-2222-222222222222'

  const responsesA = buildResponses(partnerA, assessmentA, questions, 'strong')
  const responsesB = buildResponses(partnerB, assessmentB, questions, 'weak')

  console.log('Running runScoringEngine() for Partner A (strong, consistent answers)...')
  const outA = await runScoringEngine(questions, responsesA)
  console.log(`  method=${outA.scoring_method}  overall=${outA.overall_score}`)

  console.log('Running runScoringEngine() for Partner B (thin, inconsistent answers)...')
  const outB = await runScoringEngine(questions, responsesB)
  console.log(`  method=${outB.scoring_method}  overall=${outB.overall_score}`)

  let failures = 0
  const check = (desc: string, cond: boolean) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${desc}`)
    if (!cond) failures++
  }

  check('Both ran via keyword_fallback (no ANTHROPIC_API_KEY set in this env)',
    outA.scoring_method === 'keyword_fallback' && outB.scoring_method === 'keyword_fallback')

  check('Partner A overall_score is meaningfully higher than Partner B',
    outA.overall_score > outB.overall_score + 15)

  check('Every one of the 8 core pillars has a score for both partners',
    CORE_PILLARS.every(p => typeof outA.pillar_scores[p] === 'number' && typeof outB.pillar_scores[p] === 'number'))

  check('Priority stack is a permutation of all 8 pillars (A)',
    outA.priority_stack.length === 8 && new Set(outA.priority_stack).size === 8)

  check('scored_responses covers every submitted response (A)',
    outA.scored_responses.length === responsesA.length)

  console.log('\nPillar scores:')
  console.log('pillar'.padEnd(26), 'A'.padEnd(6), 'B'.padEnd(6), 'descA'.padEnd(13), 'descB')
  for (const p of CORE_PILLARS) {
    console.log(
      p.padEnd(26),
      String(outA.pillar_scores[p]).padEnd(6),
      String(outB.pillar_scores[p]).padEnd(6),
      outA.pillar_descriptors[p].padEnd(13),
      outB.pillar_descriptors[p]
    )
  }

  // ── Dyadic gap — the platform's core differentiator ──────────────────────
  console.log('\n=== computeCoupleGap() ===')
  const gapInput = (out: typeof outA, status: string) => ({
    pillar_scores: out.pillar_scores,
    pillar_score_overrides: null,
    status,
  })
  const gap = computeCoupleGap(gapInput(outA, 'completed'), gapInput(outB, 'completed'))

  check('both_complete is true when both partners have pillar_scores', gap.both_complete === true)
  check('gap.pillars has all 8 core pillars', gap.pillars.length === 8)
  check('Every pillar gap is a non-negative number', gap.pillars.every(p => typeof p.gap === 'number' && p.gap! >= 0))
  check('joint_priority_stack is a full permutation of the 8 pillars', gap.joint_priority_stack.length === 8 && new Set(gap.joint_priority_stack).size === 8)
  check('At least one pillar lands in the "significant" gap band (A/B were engineered to diverge)',
    gap.pillars.some(p => p.gap_band === 'significant'))

  console.log('\nGap by pillar:')
  console.log('pillar'.padEnd(26), 'A'.padEnd(5), 'B'.padEnd(5), 'gap'.padEnd(5), 'band')
  for (const p of gap.pillars) {
    console.log(p.pillar.padEnd(26), String(p.partner_a_score).padEnd(5), String(p.partner_b_score).padEnd(5), String(p.gap).padEnd(5), p.gap_band)
  }

  console.log('\nJoint priority stack (first 3):', gap.joint_priority_stack.slice(0, 3).join(', '))

  // ── One-sided completion ──────────────────────────────────────────────────
  const gapOneSided = computeCoupleGap(gapInput(outA, 'completed'), null)
  check('computeCoupleGap() handles a partner who has not completed yet (both_complete=false)', gapOneSided.both_complete === false)
  check('One-sided gap still reports Partner A scores with null for B', gapOneSided.pillars.every(p => p.partner_a_score !== null && p.partner_b_score === null && p.gap === null))

  console.log(`\n================================================`)
  console.log(`E2E RESULT: ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
  console.log(`================================================`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('E2E SCRIPT THREW:', err)
  process.exit(1)
})
