// scripts/e2e-report-render-test.ts
//
// Actually CALLS buildReportHTML() — not just a typecheck — for the two new
// cases introduced in this round of work: a solo Readiness-track report
// (no coupleGap, isReadiness branch) and a report carrying shared Fruit of
// the Spirit reflections. Writes both HTML files to disk so they can be
// opened and visually checked, and asserts on their content so a silent
// regression (e.g. the readiness branch accidentally rendering the dyadic
// gap section, or a fruit score leaking a number) fails loudly.
//
// Run: npx tsx scripts/e2e-report-render-test.ts

// @ts-nocheck — a standalone verification script building deliberately
// partial fixture objects (only the fields buildReportHTML() actually
// reads); not production code, same convention as the rest of this codebase.
import { writeFileSync } from 'fs'
import { buildReportHTML } from '../lib/report/builder'
import { CORE_PILLARS } from '../lib/scoring/aggregate'
import type { Profile, Assessment, Response, ReportContent } from '../types'

let failures = 0
const check = (desc: string, cond: boolean) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${desc}`)
  if (!cond) failures++
}

const now = new Date().toISOString()

const profile: Profile = {
  id: 'solo-participant',
  full_name: 'Ada',
  email: 'ada@test.com',
  role: 'participant',
} as Profile

const pillarScores: Record<string, number> = {}
const pillarDescriptors: Record<string, string> = {}
for (const p of CORE_PILLARS) {
  pillarScores[p] = 74
  pillarDescriptors[p] = 'rooted'
}

// ── Case 1: solo Readiness-track report, no couple, no gap ────────────────
const readinessAssessment: Assessment = {
  id: 'assessment-readiness-1',
  participant_id: 'solo-participant',
  couple_id: null,
  track: 'readiness',
  cycle_number: 1,
  status: 'report_generated',
  pillar_scores: pillarScores,
  pillar_descriptors: pillarDescriptors,
  priority_stack: [...CORE_PILLARS],
  overall_score: 74,
  integrity_flags: {},
  started_at: now,
  completed_at: now,
} as Assessment

const readinessHTML = buildReportHTML({
  profile,
  assessment: readinessAssessment,
  responses: [] as Response[],
  reportContent: [] as ReportContent[],
  aiPortraits: {},
  partnerName: 'Ada',
  otherPartnerName: null,
  coupleGap: null,
  fruitReflections: [],
})

writeFileSync('/tmp/rls-test-out/report-readiness.html', readinessHTML)

check('Readiness report renders non-empty HTML', readinessHTML.length > 1000)
check('Readiness report does NOT render the dyadic "Perception Gap" couple section',
  !readinessHTML.includes('Perception Gap') && !/A FIRST LOOK, TOGETHER/i.test(readinessHTML))
check('Readiness report DOES render the solo readiness framing instead',
  /WHERE YOU STAND TODAY/i.test(readinessHTML) || /no partner comparison/i.test(readinessHTML) || /not yet.*partner/i.test(readinessHTML))
check('Readiness report uses the "Readiness" track label, not "Premarital"/"Married"',
  readinessHTML.includes('Readiness') && !readinessHTML.includes('Premarital Formation') && !readinessHTML.includes('Married Formation'))
check('Readiness report contains no raw Fruit section when fruitReflections is empty',
  !/These are never scored/i.test(readinessHTML))

// ── Case 2: married-track report WITH shared Fruit of the Spirit reflections ──
const marriedAssessment: Assessment = {
  ...readinessAssessment,
  id: 'assessment-married-1',
  couple_id: 'couple-1',
  track: 'married',
} as Assessment

const fruitHTML = buildReportHTML({
  profile,
  assessment: marriedAssessment,
  responses: [] as Response[],
  reportContent: [] as ReportContent[],
  aiPortraits: {},
  partnerName: 'Ada',
  otherPartnerName: 'Ben',
  coupleGap: null,
  fruitReflections: [
    { fruit: 'patience', reflection_text: 'I notice I rush him when he is still deciding something.' },
    { fruit: 'kindness', reflection_text: 'I chose the gentler word last week instead of being sharp.' },
  ],
})

writeFileSync('/tmp/rls-test-out/report-with-fruit.html', fruitHTML)

check('Fruit-bearing report renders non-empty HTML', fruitHTML.length > 1000)
check('Fruit-bearing report includes both shared reflection texts verbatim',
  fruitHTML.includes('I notice I rush him when he is still deciding something.') &&
  fruitHTML.includes('I chose the gentler word last week instead of being sharp.'))
check('Fruit-bearing report explicitly states these are never scored',
  /never scored/i.test(fruitHTML))
check('Fruit-bearing report does not attach a numeric score next to a fruit reflection',
  // crude but meaningful: the fruit section shouldn't contain a "NN/100" or "Score:" pattern
  !/Patience[\s\S]{0,80}Score:\s*\d/i.test(fruitHTML))

// ── Case 3: report tone de-emphasis (applies to all tracks) ───────────────
check('Report no longer uses a Roman-numeral SCORE/LEVEL grading table',
  !/<table[^>]*>[\s\S]*?SCORE[\s\S]*?LEVEL/i.test(readinessHTML))
check('Report legend uses plain-language descriptor meanings, not numeric ranges like "85–100"',
  !/85\s*[-–]\s*100/.test(readinessHTML))

console.log(`\n================================================`)
console.log(`REPORT RENDER RESULT: ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
console.log(`Wrote /tmp/rls-test-out/report-readiness.html and report-with-fruit.html`)
console.log(`================================================`)
process.exit(failures === 0 ? 0 : 1)
