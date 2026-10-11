// scripts/e2e-readiness-scoring-test.ts
//
// End-to-end verification of the scoring pipeline against the REAL 32-question
// readiness bank seeded by supabase/migrations/006_questions_seed_readiness.sql
// into a local Postgres instance — not a hand-rolled fixture. Mirrors
// e2e-scoring-test.ts (the married-track test) but for a single solo
// participant: the readiness track has no couple, so there is no dyadic gap
// to compute, and this script proves runScoringEngine() still produces a
// complete, sane result (all 8 pillars scored, a valid priority stack) when
// it only ever sees 32 questions instead of 50.
//
// Run: npx tsx scripts/e2e-readiness-scoring-test.ts <path-to-readiness-questions.json>

import { readFileSync } from 'fs'
import { runScoringEngine } from '../lib/scoring/engine'
import { CORE_PILLARS } from '../lib/scoring/aggregate'
import type { Question, Response as EikonResponse } from '../types'

const questionsPath = process.argv[2]
if (!questionsPath) {
  console.error('Usage: tsx scripts/e2e-readiness-scoring-test.ts <readiness-questions.json>')
  process.exit(1)
}

const rawQuestions: any[] = JSON.parse(readFileSync(questionsPath, 'utf-8'))
const questions: Question[] = rawQuestions as Question[]

if (questions.length !== 32) {
  console.error(`FAIL: expected 32 seeded readiness questions, got ${questions.length}`)
  process.exit(1)
}

const RICH_ANSWER = `If I'm honest, I haven't fully worked through this yet. I know I lean toward avoiding it when it gets uncomfortable, and I can name a specific recent time I did that instead of facing it directly. I've talked to a mentor about it, not just thought about it privately, and I changed something concrete afterward rather than just feeling bad. I still have real gaps here and I'm not pretending otherwise.`

const THIN_ANSWER = `I think I'm pretty much ready for this already. I don't really see any issues here. I'll just figure it out when I get there.`

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
  console.log('=== E2E READINESS-TRACK SCORING ENGINE TEST (solo, no couple) ===')
  console.log(`Loaded ${questions.length} real seeded questions (readiness track).\n`)

  const assessmentId = 'cccccccc-0000-0000-0000-000000000001'
  const participantId = '66666666-6666-6666-6666-666666666666'

  const responsesThoughtful = buildResponses(participantId, assessmentId, questions, 'strong')
  const responsesThin = buildResponses(participantId, assessmentId, questions, 'weak')

  console.log('Running runScoringEngine() for a thoughtful, specific solo respondent...')
  const outThoughtful = await runScoringEngine(questions, responsesThoughtful)
  console.log(`  method=${outThoughtful.scoring_method}  overall=${outThoughtful.overall_score}`)

  console.log('Running runScoringEngine() for a thin, overconfident solo respondent...')
  const outThin = await runScoringEngine(questions, responsesThin)
  console.log(`  method=${outThin.scoring_method}  overall=${outThin.overall_score}`)

  let failures = 0
  const check = (desc: string, cond: boolean) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${desc}`)
    if (!cond) failures++
  }

  check('Both ran via keyword_fallback (no ANTHROPIC_API_KEY set in this env)',
    outThoughtful.scoring_method === 'keyword_fallback' && outThin.scoring_method === 'keyword_fallback')

  check('Thoughtful respondent scores meaningfully higher than thin/overconfident one',
    outThoughtful.overall_score > outThin.overall_score + 10)

  check('Every one of the 8 core pillars has a score from only 32 questions',
    CORE_PILLARS.every(p => typeof outThoughtful.pillar_scores[p] === 'number'))

  check('Priority stack is a full permutation of all 8 pillars',
    outThoughtful.priority_stack.length === 8 && new Set(outThoughtful.priority_stack).size === 8)

  check('scored_responses covers every submitted response',
    outThoughtful.scored_responses.length === responsesThoughtful.length)

  check('4 questions per pillar (2 freq + 1 scenario + 1 reflective) across all 8 pillars',
    CORE_PILLARS.every(p => questions.filter(q => q.pillar === p).length === 4))

  console.log('\nPillar scores (thoughtful respondent):')
  console.log('pillar'.padEnd(26), 'score'.padEnd(6), 'descriptor')
  for (const p of CORE_PILLARS) {
    console.log(
      p.padEnd(26),
      String(outThoughtful.pillar_scores[p]).padEnd(6),
      outThoughtful.pillar_descriptors[p]
    )
  }

  console.log('\nNo computeCoupleGap() call here by design — a solo readiness assessment')
  console.log('has no partner to compare against. lib/report/builder.ts branches on')
  console.log('assessment.track === \'readiness\' to render readinessSection() instead')
  console.log('of gapSection() for exactly this reason (see docs/VERIFICATION.md).')

  console.log(`\n================================================`)
  console.log(`E2E RESULT: ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
  console.log(`================================================`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('E2E SCRIPT THREW:', err)
  process.exit(1)
})
