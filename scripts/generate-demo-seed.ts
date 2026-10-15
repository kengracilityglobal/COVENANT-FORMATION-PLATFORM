// scripts/generate-demo-seed.ts
//
// Builds the demo data set: ten login-able accounts across every role and track, with
// finished, in-progress and not-started assessments, couples (active and pending),
// guide assignments (couple and individual) and fruit reflections. All people, scores
// and written answers are invented.
//
// The ANSWERS are authored (scripts/demo-answer-pool.ts); everything computed from them
// (per-question scores, pillar scores, descriptors, integrity flags, priority stack, overall)
// is produced by the app's real scoring code (lib/scoring/aggregate.ts), so the demo
// accounts show exactly what real ones would.
//
//   npx tsx scripts/generate-demo-seed.ts       -> writes supabase/demo/*.sql
//
// The question banks are read from the migration files, so regenerate after changing them.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { aggregate, scoreFrequency, descriptorFromScore, CORE_PILLARS } from '../lib/scoring/aggregate'
import POOL, { SV_SOLO, type Level } from './demo-answer-pool'

export const DEMO_DOMAIN = 'demo.covenant.test'
export const DEMO_PASSWORD = 'DemoPass!2026'
const MIG = path.join(__dirname, '../supabase/migrations')

// ── Question banks (parsed from the seed migrations) ─────────────────────────
export interface BankQ {
  code: string; pillar: string; track: string; type: string; text: string; reversed: boolean
  rubric: Record<string, string>; integrity: any; xref: string[] | null
}
const ROW = /\('([A-Z_0-9]+)','(\w+)','(\w+)','(\w+)',(\d+),\s*'((?:[^']|'')*)',\s*(true|false),\s*'((?:[^']|'')*)'::jsonb,\s*(NULL|'(?:[^']|'')*'::jsonb),\s*(NULL|'(?:[^']|'')*'::jsonb),\s*(true|false)\)/g
const jv = (v: string) => v === 'NULL' ? null : JSON.parse(v.slice(1, v.indexOf("'::jsonb")).replace(/''/g, "'"))
function load(...files: string[]): BankQ[] {
  const out: BankQ[] = []
  for (const f of files) {
    const sql = readFileSync(path.join(MIG, f), 'utf8')
    for (const m of sql.matchAll(ROW)) {
      out.push({
        code: m[1], pillar: m[2], track: m[3], type: m[4], text: m[6].replace(/''/g, "'"), reversed: m[7] === 'true',
        rubric: JSON.parse(m[8].replace(/''/g, "'")), integrity: jv(m[9]), xref: jv(m[10]),
      })
    }
  }
  return out
}
export const BANKS: Record<string, BankQ[]> = {
  married: load('003_questions_seed_married.sql', '007_married_bank_expansion.sql'),
  readiness: load('006_questions_seed_readiness.sql', '008_readiness_bank_expansion.sql'),
  premarital: load('009_questions_seed_premarital.sql'),
}

/** The order the app serves questions in (mirrors the renumbering in migrations 007-009). */
function ordered(bank: BankQ[]): BankQ[] {
  const rank = (q: BankQ) => /_FR_\d+$/.test(q.code) && !/(^|_)X_FR/.test(q.code) ? 1 : /(^|_)X_FR/.test(q.code) ? 2
    : /_SC_\d+$/.test(q.code) ? 3 : /_RE_\d+$/.test(q.code) && !/(^|_)X_RE/.test(q.code) ? 4 : 5
  const n = (q: BankQ) => parseInt(q.code.match(/_(\d+)$/)![1], 10)
  const p = (q: BankQ) => CORE_PILLARS.indexOf(q.pillar as any)
  return [...bank].sort((a, b) => rank(a) - rank(b) || n(a) - n(b) || p(a) - p(b) || a.code.localeCompare(b.code))
}

// ── Deterministic helpers ────────────────────────────────────────────────────
export function uuid(s: string): string {
  const h = createHash('sha1').update('covenant-demo:' + s).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}
function rng(seed: string) {
  let a = parseInt(createHash('md5').update(seed).digest('hex').slice(0, 8), 16)
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const sq = (s: string) => "'" + s.replace(/'/g, "''") + "'"
const sj = (o: unknown) => sq(JSON.stringify(o)) + '::jsonb'
const email = (k: string) => `${k}@${DEMO_DOMAIN}`
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

// ── The people ───────────────────────────────────────────────────────────────
type Track = 'married' | 'premarital' | 'readiness'
interface Persona {
  key: string; name: string; role: 'participant' | 'guide'
  track?: Track; sp?: string
  /** Target 0-100 per pillar, in CORE_PILLARS order. The scores that come out are computed, not these. */
  targets?: number[]
  status?: 'report_generated' | 'completed' | 'in_progress' | 'not_started'
  answered?: number
  straightline?: boolean
  tweaks?: Record<string, { scale?: number; score?: number }>
  xre?: string
  daysAgo?: number
  fruit?: Array<{ fruit: string; text: string; shared: boolean }>
}
export const PERSONAS: Persona[] = [
  { key: 'guide.naomi', name: 'Naomi Okafor (Guide)', role: 'guide' },
  { key: 'guide.emeka', name: 'Emeka Nwosu (Guide)', role: 'guide' },
  { key: 'daniel', name: 'Daniel Adeyemi', role: 'participant', track: 'married', sp: 'my wife', status: 'report_generated', daysAgo: 12,
    targets: [84, 66, 78, 47, 61, 38, 72, 55],
    tweaks: { TC_FR_01: { scale: 5 }, TC_SC_01: { score: 25 } },
    xre: 'If Grace answered honestly, I think our biggest difference would be in how close we feel. She probably feels more distance than I do, because I tend to keep the hard things to myself.' },
  { key: 'grace', name: 'Grace Adeyemi', role: 'participant', track: 'married', sp: 'my husband', status: 'report_generated', daysAgo: 11,
    targets: [88, 49, 70, 74, 58, 66, 80, 52],
    xre: 'I think Daniel would say we are closer than I would. I have learned not to push when he withdraws, and I miss being let in more than I say.',
    fruit: [
      { fruit: 'patience', text: 'I am learning to wait for Daniel to open up instead of filling the silence myself. Some days that works.', shared: true },
      { fruit: 'gentleness', text: 'I have been trying to ask questions instead of pointing out what he has not told me.', shared: true },
      { fruit: 'peace', text: 'Private: I still go quiet for days after a hard conversation and call it peace.', shared: false },
    ] },
  { key: 'tunde', name: 'Tunde Bakare', role: 'participant', track: 'premarital', sp: 'my fiancée', status: 'completed', daysAgo: 9,
    targets: [78, 72, 64, 58, 81, 52, 70, 60],
    xre: 'Amaka will probably say I am more certain about our future than I really am. I say yes quickly, and I have not always checked whether I mean it.' },
  { key: 'amaka', name: 'Amaka Ugwu', role: 'participant', track: 'premarital', sp: 'my fiancé', status: 'report_generated', daysAgo: 8,
    targets: [74, 60, 80, 66, 55, 70, 76, 48],
    xre: 'Tunde will probably rate us higher on talking about hard things. I tend to keep things smooth and then carry the rest quietly.' },
  { key: 'kelechi', name: 'Kelechi Obi', role: 'participant', track: 'premarital', sp: 'my fiancée', status: 'report_generated', daysAgo: 5,
    targets: [66, 58, 72, 44, 50, 41, 63, 57],
    xre: 'I think we agree on the big things. I am less sure we have talked about the uncomfortable details, like money and where we will live.' },
  { key: 'chidi', name: 'Chidi Eze', role: 'participant', track: 'readiness', sp: 'my brother', status: 'report_generated', daysAgo: 7,
    targets: [74, 58, 81, 52, 66, 44, 69, 47],
    xre: 'The biggest difference would show in how I handle conflict. I think I handle it better in my head than I do when I am actually in the middle of it.',
    fruit: [
      { fruit: 'faithfulness', text: 'I told my brother I would help with his shop opening and then cut it short for a trip. I want to keep my word when it is inconvenient.', shared: true },
      { fruit: 'self_control', text: 'I notice I go quiet when I am annoyed and let it sit. I am practising saying it the same day.', shared: true },
    ] },
  { key: 'sam', name: 'Sam Bello', role: 'participant', track: 'readiness', sp: 'my roommate', status: 'report_generated', daysAgo: 3,
    straightline: true, targets: [50, 50, 50, 50, 50, 50, 50, 50],
    xre: 'Everything is good. I would say the same to anyone who asked.' },
  { key: 'ife', name: 'Ife Lawal', role: 'participant', track: 'readiness', sp: 'my sister', status: 'in_progress', answered: 20, daysAgo: 1,
    targets: [60, 55, 65, 50, 58, 48, 62, 52] },
  { key: 'bola', name: 'Bola Hassan', role: 'participant', track: 'readiness', status: 'not_started' },
]
const COUPLES = [
  { key: 'adeyemi', a: 'daniel', b: 'grace', track: 'married', guide: 'guide.naomi', status: 'active', code: 'DEMOMARRIED' },
  { key: 'ugwu', a: 'tunde', b: 'amaka', track: 'premarital', guide: 'guide.naomi', status: 'active', code: 'DEMOPREMARITAL' },
  { key: 'obi', a: 'kelechi', b: null, track: 'premarital', guide: null, status: 'pending', code: 'DEMOPENDING' },
] as const
const SOLO_GUIDE: Record<string, string> = { chidi: 'guide.naomi' }   // individual (readiness) guide assignment

// ── Answers + scoring ────────────────────────────────────────────────────────
interface GenResponse {
  id: string; code: string; qType: string; text: string | null; scale: number | null; score: number
  desc: string; flags: string[] | null; wc: number | null; rt: number; at: Date
}
interface GenAssessment {
  id: string; persona: string; track: Track; coupleKey: string | null; status: string
  startedAt: Date; completedAt: Date | null; answered: number
  result: ReturnType<typeof aggregate> | null; responses: GenResponse[]
}

function buildAssessment(p: Persona, now: Date): GenAssessment {
  const track = p.track!
  const qs = ordered(BANKS[track])
  const coupleKey = track === 'readiness' ? null : (COUPLES.find(c => c.a === p.key || c.b === p.key)?.key ?? null)
  const start = new Date(now.getTime() - (p.daysAgo ?? 3) * 86400000)
  const rand = rng(p.key)
  const targets = p.targets ?? CORE_PILLARS.map(() => 55)
  const target = (pillar: string) => targets[CORE_PILLARS.indexOf(pillar as any)] ?? Math.round(targets.reduce((a, b) => a + b, 0) / targets.length)
  const answeredN = p.status === 'in_progress' ? (p.answered ?? 0) : qs.length
  const sp = p.sp ?? 'my friend'
  let t = start.getTime()

  const responses: GenResponse[] = []
  const items: any[] = []
  for (const q of qs.slice(0, answeredN)) {
    const S = target(q.pillar)
    const id = uuid(`resp:${p.key}:${q.code}`)
    const tw = p.tweaks?.[q.code]
    let scale: number | null = null, score: number, text: string | null = null
    if (q.type === 'frequency') {
      const pos = clamp(Math.round(1 + S / 25 + (rand() * 2 - 1) * 0.7), 1, 5)
      scale = p.straightline ? 5 : tw?.scale ?? (q.reversed ? 6 - pos : pos)
      score = scoreFrequency(scale, q.reversed)
      t += (6 + Math.round(rand() * 9)) * 1000
    } else {
      score = tw?.score ?? clamp(Math.round(S + (rand() * 2 - 1) * 8), 0, 100)
      if (q.pillar === 'cross_pillar') text = p.xre ?? 'Nothing to add.'
      else if (p.straightline) text = 'Nothing in particular comes to mind. Things are generally fine.'
      else {
        const lvl = descriptorFromScore(score) as Level
        const pair = (track === 'readiness' && q.pillar === 'shared_vision') ? SV_SOLO[lvl] : POOL[q.pillar][lvl]
        const first = /_SC_01$/.test(q.code) || /_RE_/.test(q.code)
        text = (/_RE_/.test(q.code) ? `${pair[1]} ${pair[0]}` : first ? pair[0] : pair[1]).replace(/\{SP\}/g, sp)
      }
      t += (70 + Math.round(rand() * 110)) * 1000
    }
    responses.push({
      id, code: q.code, qType: q.type, text, scale, score, desc: descriptorFromScore(score),
      flags: null, wc: text ? words(text) : null, rt: q.type === 'frequency' ? 6 + Math.round(rand() * 9) : 70 + Math.round(rand() * 110), at: new Date(t),
    })
    items.push({
      responseId: id, questionId: id, code: q.code, pillar: q.pillar, kind: q.type === 'frequency' ? 'frequency' : 'written',
      score, byKeyword: false, scale: q.type === 'frequency' ? scale : null, reversed: q.type === 'frequency' ? q.reversed : undefined,
    })
  }

  let result = null as GenAssessment['result']
  if (p.status === 'completed' || p.status === 'report_generated') {
    result = aggregate(items, qs.map(q => ({ code: q.code, pillar: q.pillar, integrity_flag_logic: q.integrity, cross_ref_questions: q.xref })) as any)
    for (const r of responses) { const f = result.flags_by_response[r.id]; if (f?.length) r.flags = f }
  }
  return {
    id: uuid(`assessment:${p.key}`), persona: p.key, track, coupleKey, status: p.status!, startedAt: start,
    completedAt: result ? new Date(t + 60000) : null, answered: answeredN, result, responses,
  }
}

// ── SQL ──────────────────────────────────────────────────────────────────────
const CLEAN = `DELETE FROM couples WHERE partner_a_id IN (SELECT id FROM profiles WHERE email LIKE '%@${DEMO_DOMAIN}');
DELETE FROM assessments WHERE participant_id IN (SELECT id FROM profiles WHERE email LIKE '%@${DEMO_DOMAIN}');
DELETE FROM fruit_reflections WHERE participant_id IN (SELECT id FROM profiles WHERE email LIKE '%@${DEMO_DOMAIN}');`

export interface DemoPackage {
  personas: Persona[]; assessments: GenAssessment[]; seedSql: string; removeSql: string; logins: Array<{ email: string; name: string; role: string; note: string }>
}

export function generateDemo(now = new Date('2026-10-14T12:00:00Z')): DemoPackage {
  const assessments = PERSONAS.filter(p => p.role === 'participant' && p.status && p.status !== 'not_started').map(p => buildAssessment(p, now))
  const L: string[] = []
  const nowSql = "now()"

  L.push(`-- ============================================================
-- Covenant Formation Platform — DEMO DATA (invented people and answers)
-- Generated by scripts/generate-demo-seed.ts. Re-running this file resets
-- the demo accounts to this state; 002_remove_demo_data.sql removes them.
--
-- Every account below signs in with the password  ${DEMO_PASSWORD}
--   (email addresses end in @${DEMO_DOMAIN}; they can never receive mail)
-- Run it as ONE query in the Supabase SQL editor.
-- ============================================================
`)

  L.push(`-- ── 1. Accounts (auth.users + identities) ───────────────────────────────`)
  for (const p of PERSONAS) {
    const id = uuid('user:' + p.key), e = email(p.key)
    L.push(`INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
SELECT '00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', ${sq(e)}, crypt(${sq(DEMO_PASSWORD)}, gen_salt('bf')), ${nowSql}, '{"provider":"email","providers":["email"]}', ${sj({ full_name: p.name })}, ${nowSql}, ${nowSql}, '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = ${sq(e)});
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', u.id::text, ${nowSql}, ${nowSql}, ${nowSql}
FROM auth.users u WHERE u.email = ${sq(e)} AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');`)
  }

  L.push(`
-- ── 2. Start from a clean slate for the demo accounts, then map emails to ids ──
${CLEAN}
CREATE TEMP TABLE demo_ids ON COMMIT DROP AS SELECT email, id FROM auth.users WHERE email LIKE '%@${DEMO_DOMAIN}';
`)
  const idOf = (k: string) => `(SELECT id FROM demo_ids WHERE email = ${sq(email(k))})`

  L.push(`-- ── 3. Profiles ──────────────────────────────────────────────────────────`)
  for (const p of PERSONAS) {
    const guide = SOLO_GUIDE[p.key] ? idOf(SOLO_GUIDE[p.key]) : 'NULL'
    L.push(`UPDATE profiles SET full_name = ${sq(p.name)}, role = ${sq(p.role)}, onboarding_completed = true, subscription_status = 'active', intended_track = ${p.track ? sq(p.track) : 'NULL'}, guide_id = ${guide} WHERE email = ${sq(email(p.key))};`)
  }

  L.push(`\n-- ── 4. Couples ───────────────────────────────────────────────────────────`)
  for (const c of COUPLES) {
    L.push(`INSERT INTO couples (id, partner_a_id, partner_b_id, guide_id, track, status, invite_code, cycle_number) VALUES (${sq(uuid('couple:' + c.key))}, ${idOf(c.a)}, ${c.b ? idOf(c.b) : 'NULL'}, ${c.guide ? idOf(c.guide) : 'NULL'}, ${sq(c.track)}, ${sq(c.status)}, ${sq(c.code)}, 1);`)
  }

  L.push(`\n-- ── 5. Assessments and responses ────────────────────────────────────────`)
  for (const a of assessments) {
    const r = a.result
    const cid = a.coupleKey ? sq(uuid('couple:' + a.coupleKey)) : 'NULL'
    L.push(`INSERT INTO assessments (id, participant_id, couple_id, track, cycle_number, status, started_at, completed_at, last_question_index, pillar_scores, pillar_descriptors, integrity_flags, priority_stack, overall_score, report_generated_at, scoring_notes)
VALUES (${sq(a.id)}, ${idOf(a.persona)}, ${cid}, ${sq(a.track)}, 1, ${sq(a.status)}, ${sq(a.startedAt.toISOString())}, ${a.completedAt ? sq(a.completedAt.toISOString()) : 'NULL'}, ${a.answered}, ${r ? sj(r.pillar_scores) : 'NULL'}, ${r ? sj(r.pillar_descriptors) : 'NULL'}, ${r ? sj(r.integrity_flags) : 'NULL'}, ${r ? sj(r.priority_stack) : 'NULL'}, ${r ? r.overall_score : 'NULL'}, ${a.status === 'report_generated' && a.completedAt ? sq(new Date(a.completedAt.getTime() + 120000).toISOString()) : 'NULL'}, ${r ? sq('demo data: authored answers scored by the real aggregation code') : 'NULL'});`)
    const vals = a.responses.map(x => `(${sq(x.id)}, ${sq(x.code)}, ${x.text === null ? 'NULL' : sq(x.text)}, ${x.scale === null ? 'NULL' : x.scale}, ${x.score}, ${sq(x.desc)}, ${x.flags ? sq(JSON.stringify(x.flags)) : 'NULL'}, ${x.wc === null ? 'NULL' : x.wc}, ${x.rt}, ${sq(x.at.toISOString())})`)
    L.push(`INSERT INTO responses (id, assessment_id, participant_id, question_id, response_text, response_scale, computed_score, descriptor_assigned, flags_raised, word_count, response_time_seconds, answered_at)
SELECT v.id::uuid, ${sq(a.id)}::uuid, ${idOf(a.persona)}, q.id, v.txt, v.scale::int, v.score::numeric, v.descr::formation_descriptor, v.flags::jsonb, v.wc::int, v.rt::int, v.at::timestamptz
FROM (VALUES
${vals.join(',\n')}
) AS v(id, code, txt, scale, score, descr, flags, wc, rt, at)
JOIN questions q ON q.code = v.code;
`)
  }

  L.push(`-- ── 6. Fruit reflections ─────────────────────────────────────────────────`)
  for (const p of PERSONAS) for (const f of p.fruit ?? []) {
    L.push(`INSERT INTO fruit_reflections (participant_id, fruit, reflection_text, shared_with_guide) VALUES (${idOf(p.key)}, ${sq(f.fruit)}, ${sq(f.text)}, ${f.shared});`)
  }

  const removeSql = `-- Removes every demo account and everything attached to it. Safe to run any time.
${CLEAN}
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@${DEMO_DOMAIN}');
DELETE FROM auth.users WHERE email LIKE '%@${DEMO_DOMAIN}';
`
  const notes: Record<string, string> = {
    'guide.naomi': 'Guide with 2 couples (married + premarital) and 1 individual (Chidi)',
    'guide.emeka': 'Guide with nobody assigned: use to test the admin assign-guide control',
    daniel: 'Married, report ready, partner of Grace, has an integrity flag (Truthful Communication)',
    grace: 'Married, report ready, has fruit reflections (2 shared with guide)',
    tunde: 'Premarital, completed (report not yet generated), partner of Amaka',
    amaka: 'Premarital, report ready, partner of Tunde',
    kelechi: 'Premarital, report ready, partner has not joined yet, no guide',
    chidi: 'Readiness (single), report ready, guide = Naomi (individual assignment)',
    sam: 'Readiness, report ready, answered every rating the same way (shows the contradiction flags)',
    ife: 'Readiness, in progress (20 of 48 answered)',
    bola: 'Readiness, has not started',
  }
  const logins = PERSONAS.map(p => ({ email: email(p.key), name: p.name, role: p.role === 'guide' ? 'Guide' : 'Participant', note: notes[p.key] ?? '' }))
  return { personas: PERSONAS, assessments, seedSql: L.join('\n'), removeSql, logins }
}

if (typeof require !== 'undefined' && require.main === module) {
  const pkg = generateDemo()
  const out = path.join(__dirname, '../supabase/demo')
  mkdirSync(out, { recursive: true })
  writeFileSync(path.join(out, '001_demo_data.sql'), pkg.seedSql)
  writeFileSync(path.join(out, '002_remove_demo_data.sql'), pkg.removeSql)
  const table = pkg.logins.map(l => `| ${l.email} | ${l.name} | ${l.role} | ${l.note} |`).join('\n')
  writeFileSync(path.join(out, 'README.md'), `# Demo data

Invented people, scores and written answers for testing the admin, guide and participant sides without answering 48-66 questions each time. Everything computed from the answers (scores, flags, priority order) comes from the app's real scoring code.

## Use it
1. Run \`001_demo_data.sql\` in the Supabase SQL editor, as one query. Re-running resets the demo accounts.
2. Sign in as any account below. Password for all of them: \`${DEMO_PASSWORD}\`
3. Remove everything with \`002_remove_demo_data.sql\`.

Sign in to a different account in a private window or another browser profile; one browser holds one session.

| Email | Name | Role | What it demonstrates |
|---|---|---|---|
${table}

## If sign-in fails for the demo accounts
The accounts are inserted straight into Supabase's auth tables. If your Supabase version rejects that, register the same email addresses through /register instead (confirm the email, or confirm it by SQL), then run the file again: it fills in everything else by matching on email.

Regenerate after changing the question banks: \`npx tsx scripts/generate-demo-seed.ts\`.
`)
  console.log('wrote supabase/demo/ —', pkg.assessments.length, 'assessments,', pkg.assessments.reduce((n, a) => n + a.responses.length, 0), 'responses')
}
