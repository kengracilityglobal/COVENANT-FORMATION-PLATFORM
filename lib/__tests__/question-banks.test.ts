import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// Parses the seed SQL itself, so these checks describe what actually ships.
const dir = path.join(__dirname, '../../supabase/migrations')
const ROW = /\('([A-Z_0-9]+)','(\w+)','(\w+)','(\w+)',(\d+),\s*'((?:[^']|'')*)',\s*(true|false),\s*'((?:[^']|'')*)'::jsonb,\s*(NULL|'(?:[^']|'')*'::jsonb),\s*(NULL|'(?:[^']|'')*'::jsonb),\s*(true|false)\)/g
interface Q { code: string; pillar: string; track: string; type: string; text: string; reversed: boolean; rubric: Record<string, string>; xref: string[] | null }
function load(...files: string[]): Q[] {
  const out: Q[] = []
  for (const f of files) {
    const sql = readFileSync(path.join(dir, f), 'utf8')
    for (const m of sql.matchAll(ROW)) {
      out.push({
        code: m[1], pillar: m[2], track: m[3], type: m[4], text: m[6].replace(/''/g, "'"), reversed: m[7] === 'true',
        rubric: JSON.parse(m[8].replace(/''/g, "'")),
        xref: m[10] === 'NULL' ? null : JSON.parse(m[10].slice(1, m[10].indexOf("'::jsonb")).replace(/''/g, "'")),
      })
    }
  }
  return out
}
const PILLARS = ['covenant_faithfulness', 'oneness', 'sacrificial_love', 'intimacy', 'truthful_communication', 'conflict_repair', 'mutual_honor', 'shared_vision']
const LEVELS = ['christformed', 'rooted', 'growing', 'awakening', 'unengaged']

const married = load('003_questions_seed_married.sql', '007_married_bank_expansion.sql')
const readiness = load('006_questions_seed_readiness.sql', '008_readiness_bank_expansion.sql')
const premarital = load('009_questions_seed_premarital.sql')
const all = [...married, ...readiness, ...premarital]

const count = (qs: Q[], pillar: string, type: string, rev?: boolean) =>
  qs.filter(q => q.pillar === pillar && q.type === type && (rev === undefined || q.reversed === rev)).length

describe('question banks', () => {
  it('have the intended sizes', () => {
    expect(married).toHaveLength(66)
    expect(readiness).toHaveLength(48)
    expect(premarital).toHaveLength(66)
  })

  it('give every area enough rated questions, with reverse-worded ones to cross-check against', () => {
    for (const p of PILLARS) {
      // married and premarital: 5 rated (3 positive + 2 reverse), 2 scenario, 1 reflective
      for (const bank of [married, premarital]) {
        expect(count(bank, p, 'frequency'), `${p} rated`).toBe(5)
        expect(count(bank, p, 'frequency', true), `${p} reverse`).toBeGreaterThanOrEqual(2)
        expect(count(bank, p, 'scenario')).toBe(2)
        expect(count(bank, p, 'reflective_disclosure')).toBe(1)
      }
      // readiness: 4 rated (2 positive + 2 reverse), 1 scenario, 1 reflective
      expect(count(readiness, p, 'frequency'), `${p} readiness rated`).toBe(4)
      expect(count(readiness, p, 'frequency', true), `${p} readiness reverse`).toBeGreaterThanOrEqual(2)
      expect(count(readiness, p, 'scenario')).toBe(1)
      expect(count(readiness, p, 'reflective_disclosure')).toBe(1)
    }
  })

  it('has unique codes, one track each, and a 5-level rubric on every question', () => {
    expect(new Set(all.map(q => q.code)).size).toBe(all.length)
    expect(new Set(premarital.map(q => q.track))).toEqual(new Set(['premarital']))
    for (const q of all) {
      expect(Object.keys(q.rubric).sort(), q.code).toEqual([...LEVELS].sort())
      for (const l of LEVELS) expect(q.rubric[l].length, `${q.code}.${l}`).toBeGreaterThan(8)
    }
  })

  it('has cross-references that point at real questions in the same track', () => {
    for (const bank of [married, readiness, premarital]) {
      const codes = new Set(bank.map(q => q.code))
      for (const q of bank) for (const c of q.xref ?? []) expect(codes.has(c), `${q.code} -> ${c}`).toBe(true)
    }
  })

  it('reverse-keys exactly the deliberately negative statements and nothing else', () => {
    const short = ['CF', 'ON', 'SL', 'IN', 'TC', 'CR', 'MH', 'SV']
    const expected = new Set<string>()
    for (const s of short) {
      for (const n of ['04', '05']) { expected.add(`${s}_FR_${n}`); expected.add(`PM_${s}_FR_${n}`) }
      for (const n of ['03', '04']) expected.add(`RD_${s}_FR_${n}`)
    }
    expect(new Set(all.filter(q => q.reversed).map(q => q.code))).toEqual(expected)
  })

  it('does not mark any positively worded statement as reverse-scored (the TC_FR_02 bug)', () => {
    const tc2 = married.find(q => q.code === 'TC_FR_02')!
    expect(tc2.reversed).toBe(false)
    // every shipped reverse-keyed question is one of the deliberately negative ones
    expect(all.filter(q => q.reversed).length).toBe(16 * 3)
  })

  it('premarital never speaks as if already married; readiness never assumes a partner', () => {
    for (const q of premarital) {
      expect(q.text, q.code).not.toMatch(/\bspouse\b|\bour children\b/i)
      // Rated and scenario items speak about the relationship as it is; only the forward-looking reflective ones may mention the marriage ahead.
      if (q.type !== 'reflective_disclosure') expect(q.text, q.code).not.toMatch(/(?<!expect physically in )\bmarriage\b/i)
      for (const v of Object.values(q.rubric)) expect(v, q.code).not.toMatch(/\bspouse\b/i)
    }
    for (const q of readiness) expect(q.text, q.code).not.toMatch(/\bmy spouse\b|my partner|our marriage/i)
  })

  it('gives the premarital reflective questions a forward-looking frame', () => {
    const re = premarital.filter(q => q.type === 'reflective_disclosure' && q.pillar !== 'cross_pillar')
    expect(re).toHaveLength(8)
    for (const q of re) expect(q.text, q.code).toMatch(/not yet|never|hope|picture|ahead|after the wedding|assum|unresolved|expect|currently|would/i)
  })
})
