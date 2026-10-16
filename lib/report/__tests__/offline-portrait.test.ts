import { describe, it, expect } from 'vitest'
import { CORE_PILLARS } from '@/lib/scoring/aggregate'
import {
  COUPLE_PORTRAIT, COUPLE_ACTION, READINESS_PORTRAIT, READINESS_ACTION, GAP_LINES, PATTERNS, OVERALL_OPENING,
} from '../offline-content'
import { UNDERNEATH, AHEAD_COUPLE, AHEAD_READINESS, LEAN } from '../offline-depth'
import {
  buildPillarPortrait, buildEvidence, buildOverview, buildFirstMonth, detectPatterns, readGap,
  fillTokens, excerptFrom, escapeHtml, type QuestionLite, type ResponseLite,
} from '../offline-portrait'

const DESCRIPTORS = ['christformed', 'rooted', 'growing', 'awakening', 'unengaged'] as const
const JARGON = /chesed|echad|agape|yada|aletheia|eirene|timao|koinonia|christformed|unengaged|\bpillars?\b|perception gap|formation pathway/i

function allStrings(): Array<{ where: string; text: string; copy: 'couple' | 'readiness' }> {
  const out: Array<{ where: string; text: string; copy: 'couple' | 'readiness' }> = []
  const banks: Array<[string, any, 'couple' | 'readiness']> = [
    ['COUPLE_PORTRAIT', COUPLE_PORTRAIT, 'couple'], ['COUPLE_ACTION', COUPLE_ACTION, 'couple'],
    ['READINESS_PORTRAIT', READINESS_PORTRAIT, 'readiness'], ['READINESS_ACTION', READINESS_ACTION, 'readiness'],
    ['AHEAD_COUPLE', AHEAD_COUPLE, 'couple'], ['AHEAD_READINESS', AHEAD_READINESS, 'readiness'],
    // Written once for both families, so held to the stricter readiness rule here
    // and to the couple rule in its own test below.
    ['UNDERNEATH', UNDERNEATH, 'readiness'],
  ]
  for (const [name, bank, copy] of banks) {
    for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) out.push({ where: `${name}.${p}.${d}`, text: bank[p][d], copy })
  }
  for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
    out.push({ where: `LEAN.${p}.${d}.low`, text: LEAN[p][d].low, copy: 'readiness' }, { where: `LEAN.${p}.${d}.high`, text: LEAN[p][d].high, copy: 'readiness' })
  }
  for (const p of CORE_PILLARS) for (const k of ['youHigher', 'otherHigher', 'bothLow'] as const) out.push({ where: `GAP.${p}.${k}`, text: GAP_LINES[p][k], copy: 'couple' })
  for (const [id, t] of Object.entries(PATTERNS)) { out.push({ where: `PATTERN.${id}.couple`, text: t.couple, copy: 'couple' }); out.push({ where: `PATTERN.${id}.readiness`, text: t.readiness, copy: 'readiness' }) }
  for (const c of ['couple', 'readiness'] as const) for (const d of DESCRIPTORS) out.push({ where: `OPEN.${c}.${d}`, text: OVERALL_OPENING[c][d], copy: c })
  return out
}

describe('authored content is complete and clean', () => {
  it('has every pillar x descriptor in every bank, non-empty', () => {
    for (const bank of [COUPLE_PORTRAIT, COUPLE_ACTION, READINESS_PORTRAIT, READINESS_ACTION]) {
      for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) expect(bank[p][d]?.length ?? 0).toBeGreaterThan(40)
    }
  })

  it('never uses framework jargon (same rule as the AI portrait prompt)', () => {
    for (const s of allStrings()) expect(s.text, s.where).not.toMatch(JARGON)
  })

  it('keeps sentences short (voice rule)', () => {
    for (const s of allStrings()) {
      for (const sentence of s.text.split(/(?<=[.!?])\s+/)) {
        const words = sentence.trim().split(/\s+/).length
        expect(words, `${s.where}: "${sentence}"`).toBeLessThanOrEqual(36)
      }
    }
  })

  it('has no duplicate portraits or actions anywhere', () => {
    const seen = new Map<string, string>()
    for (const s of allStrings()) {
      const key = s.text.trim()
      expect(seen.get(key), `${s.where} duplicates ${seen.get(key)}`).toBeUndefined()
      seen.set(key, s.where)
    }
  })

  it('readiness copy never speaks as if a spouse already exists', () => {
    for (const s of allStrings().filter(x => x.copy === 'readiness')) {
      expect(s.text, s.where).not.toMatch(/your spouse|your marriage|your partner|\{sp\}|\{mar\}/i)
    }
  })

  it('couple copy uses tokens, not hard-coded spouse/marriage, so premarital reads right', () => {
    for (const s of allStrings().filter(x => x.copy === 'couple')) {
      expect(s.text, s.where).not.toMatch(/your spouse|your marriage|\bspouse\b|\bmarriage\b/i)
    }
  })

  it('resolves every token for married and premarital', () => {
    for (const track of ['married', 'premarital']) {
      for (const s of allStrings().filter(x => x.copy === 'couple')) {
        const out = fillTokens(s.text.replace(/\{other\}/g, 'Sam'), track)
        expect(out, s.where).not.toMatch(/\{[a-zA-Z]+\}/)
      }
    }
    expect(fillTokens('{Sp} and {sp} in {mar}', 'premarital')).toBe('Your partner and your partner in your relationship')
    expect(fillTokens('{Sp} and {sp} in {mar}', 'married')).toBe('Your spouse and your spouse in your marriage')
  })
})

// ── Evidence ─────────────────────────────────────────────────────────

const q = (id: string, type: string, text: string, pillar = 'oneness'): QuestionLite => ({
  id, pillar, question_type: type, question_text: text,
  scoring_rubric: { christformed: 'RUB-CF', rooted: 'RUB-RT', growing: 'RUB-GR', awakening: 'RUB-AW', unengaged: 'RUB-UN' },
})
const r = (id: string, score: number, extra: Partial<ResponseLite> = {}): ResponseLite => ({ question_id: id, computed_score: score, ...extra })

describe('buildEvidence', () => {
  const questions = [q('a', 'frequency', 'We decide things together.'), q('b', 'frequency', 'I check with my spouse first.'), q('c', 'scenario', 'Describe a recent big decision.'), q('x', 'frequency', 'Other pillar', 'intimacy')]

  it('returns holds / slips with the question\'s own rubric for how they answered', () => {
    const ev = buildEvidence('oneness', [
      r('a', 100, { response_scale: 5 }), r('b', 25, { response_scale: 2 }), r('c', 60, { response_text: 'x' }), r('x', 5),
    ], questions)
    expect(ev.holds?.statement).toBe('We decide things together.')
    expect(ev.holds?.answerLabel).toBe('Almost always')
    expect(ev.holds?.rubricLine).toBe('RUB-CF')
    expect(ev.slips?.statement).toBe('I check with my spouse first.')
    expect(ev.slips?.answerLabel).toBe('Rarely')
    expect(ev.slips?.rubricLine).toBe('RUB-UN')
    expect(ev.answered).toBe(3)
  })

  it('prefers the stored descriptor over re-deriving from score', () => {
    const ev = buildEvidence('oneness', [r('a', 90, { descriptor_assigned: 'rooted' }), r('b', 20)], questions)
    expect(ev.holds?.rubricLine).toBe('RUB-RT')
  })

  it('says "consistent" instead of inventing a contrast when answers are close', () => {
    const ev = buildEvidence('oneness', [r('a', 70), r('b', 74), r('c', 66)], questions)
    expect(ev.consistent).toBe(true)
    expect(ev.holds).toBeNull()
    expect(ev.slips).toBeNull()
  })

  it('with keyword-scored written answers: ranks frequency items only, never shows a rubric line for writing', () => {
    const ev = buildEvidence('oneness', [
      r('a', 100, { response_scale: 5 }), r('b', 25, { response_scale: 2 }), r('c', 95, { response_text: 'x', word_count: 90 }),
    ], questions, true)
    expect(ev.holds?.statement).toBe('We decide things together.')
    expect(ev.slips?.statement).toBe('I check with my spouse first.')
    expect([ev.holds, ev.slips].some(i => i?.kind === 'written')).toBe(false)
    const onlyWritten = buildEvidence('oneness', [r('c', 95, { response_text: 'x' })], questions, true)
    expect(onlyWritten.holds).toBeNull()
    expect(onlyWritten.slips).toBeNull()
  })

  it('degrades to empty with no data, never throws', () => {
    expect(buildEvidence('oneness', undefined, undefined).answered).toBe(0)
    expect(buildEvidence('oneness', [], questions).holds).toBeNull()
    expect(buildEvidence('oneness', [r('zzz', 50)], questions).answered).toBe(0)
    expect(buildEvidence('oneness', [{ question_id: 'a', computed_score: null }], questions).answered).toBe(0)
  })

  it('quotes the longest written answer, trimmed, never invented', () => {
    const long = 'We talked it through for a week before deciding, and I still think I rushed the final part. Looking back I should have asked her sooner. It was a good lesson for me about listening.'
    const ev = buildEvidence('oneness', [r('a', 80), r('c', 40, { response_text: long, word_count: 33 })], questions)
    expect(ev.excerpt).toBeTruthy()
    expect(long.startsWith(ev.excerpt!.replace(/…$/, ''))).toBe(true)
    expect(excerptFrom('too short to quote')).toBeNull()
  })
})

// ── Portraits ────────────────────────────────────────────────────────

describe('buildPillarPortrait', () => {
  it('produces a portrait and a concrete action for every pillar, level and family', () => {
    for (const track of ['married', 'premarital', 'readiness']) {
      for (const p of CORE_PILLARS) for (const [d, s] of [['christformed', 92], ['rooted', 77], ['growing', 58], ['awakening', 40], ['unengaged', 12]] as const) {
        const out = buildPillarPortrait({ pillar: p, track, score: s, descriptor: d })
        expect(out.portrait.length).toBeGreaterThan(80)
        expect(out.action.length).toBeGreaterThan(40)
        expect(out.portrait + out.action).not.toMatch(/\{[a-zA-Z]+\}/)
      }
    }
  })

  it('premarital never says spouse or marriage', () => {
    for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
      const out = buildPillarPortrait({ pillar: p, track: 'premarital', score: 55, descriptor: d })
      expect(out.portrait + ' ' + out.action).not.toMatch(/\bspouse\b|\bmarriage\b/i)
    }
  })

  it('survives bad input (unknown descriptor, NaN score)', () => {
    const out = buildPillarPortrait({ pillar: 'intimacy', track: 'married', score: NaN as any, descriptor: 'nonsense' })
    expect(out.portrait.length).toBeGreaterThan(80)
  })

  it('adds a band-position note near an edge, and none in the middle', () => {
    expect(buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 68, descriptor: 'growing' }).portrait).toMatch(/2 points from the next level up/)
    expect(buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 69, descriptor: 'growing' }).portrait).toMatch(/1 point from the next level up/)
    expect(buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 51, descriptor: 'growing' }).portrait).toMatch(/close to the line below/)
    expect(buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 60, descriptor: 'growing' }).portrait).not.toMatch(/points? from the next|close to the line/)
  })

  it('names the actual contradiction behind an integrity flag when it can', () => {
    const questions = [q('f', 'frequency', 'I keep my promises.', 'covenant_faithfulness'), q('s', 'scenario', 'A time you did not.', 'covenant_faithfulness')]
    const out = buildPillarPortrait({
      pillar: 'covenant_faithfulness', track: 'married', score: 55, descriptor: 'growing', integrityFlag: 'significant',
      questions, responses: [r('f', 100, { response_scale: 5 }), r('s', 20, { response_text: 'x' })],
    })
    expect(out.flagText).toMatch(/notable gap in Covenant Faithfulness/)
    expect(out.flagText).toMatch(/I keep my promises\./)
    expect(out.flagText).toMatch(/almost always/)
    expect(buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 50, descriptor: 'growing', integrityFlag: 'none' }).flagText).toBe('')
    const hedged = buildPillarPortrait({
      pillar: 'covenant_faithfulness', track: 'married', score: 55, descriptor: 'growing', integrityFlag: 'significant', writtenByKeyword: true,
      questions, responses: [r('f', 100, { response_scale: 5 }), r('s', 20, { response_text: 'x' })],
    }).flagText
    expect(hedged).toMatch(/simple method/)
    expect(hedged).not.toMatch(/I keep my promises|almost always/)
  })
})

// ── Overview, patterns, plan, gap ───────────────────────────────────

const scores = (o: Record<string, number>) => Object.fromEntries(CORE_PILLARS.map(p => [p, o[p] ?? 60]))

describe('overview and patterns', () => {
  it('detects the specific cross-pillar tensions', () => {
    expect(detectPatterns(scores({ sacrificial_love: 85, truthful_communication: 40 }))).toContain('giving_without_saying')
    expect(detectPatterns(scores({ intimacy: 80, conflict_repair: 45 }))).toContain('close_but_fragile')
    expect(detectPatterns(scores({ oneness: 80, shared_vision: 40 }))).toContain('team_without_destination')
    expect(detectPatterns(scores({ truthful_communication: 82, mutual_honor: 50 }))).toContain('truth_without_tenderness')
  })
  it('detects overall shapes and caps at three', () => {
    expect(detectPatterns(scores(Object.fromEntries(CORE_PILLARS.map(p => [p, 30]))))).toContain('low_across')
    expect(detectPatterns(scores(Object.fromEntries(CORE_PILLARS.map(p => [p, 90]))))).toContain('high_across')
    expect(detectPatterns(scores(Object.fromEntries(CORE_PILLARS.map(p => [p, 62]))))).toContain('even_shape')
    expect(detectPatterns(scores({ oneness: 95, intimacy: 40, sacrificial_love: 90, truthful_communication: 30, conflict_repair: 30, shared_vision: 35 })).length).toBeLessThanOrEqual(3)
  })
  it('names strongest and weakest ground and counts flags', () => {
    const o = buildOverview({
      track: 'married', overall: 62,
      scores: scores({ intimacy: 90, oneness: 85, conflict_repair: 30, mutual_honor: 35 }),
      integrityFlags: { oneness: 'minor', intimacy: 'significant' },
    })
    expect(o.ground).toMatch(/strongest ground is Intimacy and Oneness/)
    expect(o.ground).toMatch(/attention are .*Conflict & Repair/)
    expect(o.flagsNote).toMatch(/2 areas carry a flag/)
    expect(o.opening.length).toBeGreaterThan(60)
  })
  it('stays quiet about ground when everything is level', () => {
    expect(buildOverview({ track: 'readiness', overall: 60, scores: scores({}) }).ground).toBe('')
  })
})

describe('first month', () => {
  it('turns the top three into weeks plus a look-back, per family', () => {
    const w = buildFirstMonth({ track: 'married', order: ['intimacy', 'oneness', 'mutual_honor', 'shared_vision'], descriptors: { intimacy: 'growing', oneness: 'rooted', mutual_honor: 'awakening' }, scores: scores({}) })
    expect(w).toHaveLength(4)
    expect(w[0]).toMatchObject({ label: 'Week 1', title: 'Intimacy' })
    expect(w[3].title).toBe('Look back')
    expect(w[3].text).toMatch(/your spouse/)
    const ready = buildFirstMonth({ track: 'readiness', order: ['intimacy'], descriptors: { intimacy: 'growing' }, scores: scores({}) })
    expect(ready[1].text).toMatch(/mentor/)
  })
  it('returns nothing when there is no order', () => {
    expect(buildFirstMonth({ track: 'married', order: [], descriptors: {}, scores: {} })).toEqual([])
  })
})

describe('readGap', () => {
  const gap = (rows: Array<[string, number, number, 'aligned' | 'notable' | 'significant']>) => ({
    both_complete: true, joint_priority_stack: [],
    pillars: rows.map(([pillar, a, b, band]) => ({ pillar, partner_a_score: a, partner_b_score: b, partner_a_descriptor: null, partner_b_descriptor: null, gap: Math.abs(a - b), gap_band: band })),
  }) as any
  it('reads direction, alignment and shared lows', () => {
    const out = readGap(gap([['oneness', 80, 40, 'significant'], ['intimacy', 40, 80, 'significant'], ['mutual_honor', 40, 44, 'aligned'], ['shared_vision', 85, 82, 'aligned'], ['conflict_repair', 60, 62, 'aligned']]), 'married', 'Sam')
    expect(out.oneness).toMatch(/^You feel more like a team than Sam does/)
    expect(out.intimacy).toMatch(/^Sam feels closer than you do/)
    expect(out.mutual_honor).toMatch(/Both of you feel honor is thin/)
    expect(out.shared_vision).toMatch(/both see it as a strength/)
    expect(out.conflict_repair).toMatch(/see this the same way/)
  })
  it('falls back to your spouse / your partner when no name, capitalised at sentence start', () => {
    expect(readGap(gap([['intimacy', 40, 80, 'significant']]), 'married', null).intimacy).toMatch(/^Your spouse feels closer/)
    expect(readGap(gap([['intimacy', 40, 80, 'significant']]), 'premarital', '').intimacy).toMatch(/^Your partner feels closer/)
  })
  it('returns nothing until both partners are done', () => {
    expect(readGap({ both_complete: false, pillars: [], joint_priority_stack: [] } as any, 'married', 'Sam')).toEqual({})
    expect(readGap(null, 'married', 'Sam')).toEqual({})
  })
})

describe('escapeHtml', () => {
  it('neutralises markup in user-supplied text', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'y\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;')
    expect(escapeHtml(null)).toBe('')
  })
})

// ── Contradictory ratings and straight-lining ────────────────────────────
import { straightliningNote } from '../offline-portrait'

describe('contradictory-rating flags and straight-lining', () => {
  const cq = (id: string, text: string, reversed = false): QuestionLite => ({ id, pillar: 'covenant_faithfulness', question_type: 'frequency', question_text: text, scale_reversed: reversed })
  const qs = [cq('p', 'I keep my promises when it costs me.'), cq('n', 'I quietly renegotiate what I agreed to.', true), cq('o', 'Other statement.')]

  it('explains a flag that came from agreeing with a statement and its opposite', () => {
    const out = buildPillarPortrait({
      pillar: 'covenant_faithfulness', track: 'married', score: 50, descriptor: 'growing', integrityFlag: 'significant',
      questions: qs, responses: [r('p', 100, { response_scale: 5 }), r('n', 0, { response_scale: 5 })],
    })
    expect(out.flagText).toMatch(/pull against each other/)
    expect(out.flagText).toMatch(/"almost always" to "I keep my promises when it costs me\."/)
    expect(out.flagText).toMatch(/"almost always" to "I quietly renegotiate/)
    expect(out.flagText).not.toMatch(/general and how you answered when a real situation/)
  })

  it('still explains it correctly when written answers were keyword-scored', () => {
    const out = buildPillarPortrait({
      pillar: 'covenant_faithfulness', track: 'readiness', score: 50, descriptor: 'growing', integrityFlag: 'minor', writtenByKeyword: true,
      questions: qs, responses: [r('p', 0, { response_scale: 1 }), r('n', 100, { response_scale: 1 })],
    })
    expect(out.flagText).toMatch(/pull against each other/)
    expect(out.flagText).toMatch(/"never" to/)
  })

  it('does not call consistent answers a contradiction', () => {
    const out = buildPillarPortrait({
      pillar: 'covenant_faithfulness', track: 'married', score: 90, descriptor: 'christformed', integrityFlag: 'minor', writtenByKeyword: true,
      questions: qs, responses: [r('p', 100, { response_scale: 5 }), r('n', 100, { response_scale: 1 })],
    })
    expect(out.flagText).not.toMatch(/pull against each other/)
  })

  it('notes when nearly every rating was the same answer, and only then', () => {
    const many = (scales: number[]) => {
      const questions = scales.map((_, i) => ({ id: `q${i}`, pillar: 'oneness', question_type: 'frequency', question_text: `S${i}` }) as QuestionLite)
      const responses = scales.map((s, i) => r(`q${i}`, 50, { response_scale: s }))
      return straightliningNote(responses, questions)
    }
    expect(many([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5])).toMatch(/same answer to nearly every rating question/)
    expect(many([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5])).toMatch(/same answer/)
    expect(many([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4])).toBe('')
    expect(many([5, 5, 5, 5])).toBe('')
    expect(straightliningNote(undefined, undefined)).toBe('')
  })
})

describe('the taster and the full report carry more than the short paragraph', () => {
  const track = ['married', 'premarital', 'readiness'] as const

  it('has a real underneath and ahead paragraph for every area, level and family', () => {
    for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
      expect(UNDERNEATH[p][d].length, `UNDERNEATH.${p}.${d}`).toBeGreaterThan(200)
      expect(AHEAD_COUPLE[p][d].length, `AHEAD_COUPLE.${p}.${d}`).toBeGreaterThan(180)
      expect(AHEAD_READINESS[p][d].length, `AHEAD_READINESS.${p}.${d}`).toBeGreaterThan(160)
      expect(LEAN[p][d].low.length).toBeGreaterThan(40)
      expect(LEAN[p][d].high.length).toBeGreaterThan(40)
    }
  })

  it('shared copy never names a spouse or a marriage, so it reads right for every family', () => {
    for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
      for (const t of [UNDERNEATH[p][d], LEAN[p][d].low, LEAN[p][d].high]) expect(t, `${p}.${d}`).not.toMatch(/spouse|marriage|\bpartner\b|\{/i)
    }
  })

  it('uses no hyphens or dashes in the new authored wording', () => {
    const all = [UNDERNEATH, AHEAD_COUPLE, AHEAD_READINESS].flatMap(b => CORE_PILLARS.flatMap(p => DESCRIPTORS.map(d => b[p][d])))
    for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) all.push(LEAN[p][d].low, LEAN[p][d].high)
    for (const t of all) expect(t).not.toMatch(/[-\u2013\u2014]/)
  })

  it('resolves every token and never leaks a spouse into readiness depth', () => {
    for (const tr of track) for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
      const v = buildPillarPortrait({ pillar: p, track: tr, score: 60, descriptor: d })
      for (const t of [v.depth.underneath, v.depth.ahead]) {
        expect(t, `${tr}.${p}.${d}`).not.toMatch(/\{[a-zA-Z]+\}/)
        if (tr === 'readiness') expect(t, `${tr}.${p}.${d}`).not.toMatch(/your spouse|your marriage|your partner/i)
      }
    }
  })

  it('uses partner wording for premarital and spouse wording for married', () => {
    const m = buildPillarPortrait({ pillar: 'oneness', track: 'married', score: 60, descriptor: 'awakening' })
    const pm = buildPillarPortrait({ pillar: 'oneness', track: 'premarital', score: 60, descriptor: 'awakening' })
    expect(m.depth.ahead).toMatch(/your spouse/)
    expect(pm.depth.ahead).toMatch(/your partner/)
  })

  it('keeps the short portrait untouched and adds depth beside it', () => {
    const v = buildPillarPortrait({ pillar: 'conflict_repair', track: 'married', score: 60, descriptor: 'growing' })
    expect(v.portrait).toBe(fillTokens(COUPLE_PORTRAIT.conflict_repair.growing, 'married'))
    expect(v.depth.underneath).toBe(UNDERNEATH.conflict_repair.growing)
  })

  it('differs by area, level and family, with no paragraph repeated', () => {
    const seen = new Set<string>()
    for (const tr of ['married', 'readiness'] as const) for (const p of CORE_PILLARS) for (const d of DESCRIPTORS) {
      const v = buildPillarPortrait({ pillar: p, track: tr, score: 60, descriptor: d })
      for (const t of [v.portrait, v.depth.ahead, ...(tr === 'married' ? [v.depth.underneath] : [])]) {
        expect(seen.has(t), `${tr}.${p}.${d} repeats a paragraph`).toBe(false)
        seen.add(t)
      }
    }
  })

  it('says where the score sits in its level, only in the outer thirds, and not twice at an edge', () => {
    const low = buildPillarPortrait({ pillar: 'intimacy', track: 'readiness', score: 54, descriptor: 'growing' })
    expect(low.depth.ahead.startsWith(LEAN.intimacy.growing.low)).toBe(true)
    const high = buildPillarPortrait({ pillar: 'intimacy', track: 'readiness', score: 65, descriptor: 'growing' })
    expect(high.depth.ahead.startsWith(LEAN.intimacy.growing.high)).toBe(true)
    const mid = buildPillarPortrait({ pillar: 'intimacy', track: 'readiness', score: 59, descriptor: 'growing' })
    expect(mid.depth.ahead).toBe(AHEAD_READINESS.intimacy.growing)
    const edge = buildPillarPortrait({ pillar: 'intimacy', track: 'readiness', score: 68, descriptor: 'growing' })
    expect(edge.portrait).toMatch(/2 points from the next level up/)
    expect(edge.depth.ahead).toBe(AHEAD_READINESS.intimacy.growing)
  })
})
