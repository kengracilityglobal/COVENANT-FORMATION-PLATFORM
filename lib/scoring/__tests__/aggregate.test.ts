import { describe, it, expect } from 'vitest'
import {
  descriptorFromScore, scoreFrequency, clampScore, aggregate, CORE_PILLARS,
  type ScoredItem,
} from '../aggregate'
import type { Question } from '@/types'

function q(overrides: Partial<Question> & { code: string; pillar: string }): Question {
  return {
    id: overrides.code, code: overrides.code, pillar: overrides.pillar as any,
    question_text: '', question_type: 'scenario', scale_reversed: false,
    scoring_rubric: {}, cross_ref_questions: null, integrity_flag_logic: null,
    order_index: 0, active: true, created_at: '', updated_at: '',
    ...overrides,
  } as unknown as Question
}

describe('descriptorFromScore', () => {
  it('maps every documented band boundary correctly', () => {
    expect(descriptorFromScore(0)).toBe('unengaged')
    expect(descriptorFromScore(29)).toBe('unengaged')
    expect(descriptorFromScore(30)).toBe('awakening')
    expect(descriptorFromScore(49)).toBe('awakening')
    expect(descriptorFromScore(50)).toBe('growing')
    expect(descriptorFromScore(69)).toBe('growing')
    expect(descriptorFromScore(70)).toBe('rooted')
    expect(descriptorFromScore(84)).toBe('rooted')
    expect(descriptorFromScore(85)).toBe('christformed')
    expect(descriptorFromScore(100)).toBe('christformed')
  })
})

describe('scoreFrequency', () => {
  it('converts a 1-5 Likert to 0-100 linearly', () => {
    expect(scoreFrequency(1, false)).toBe(0)
    expect(scoreFrequency(3, false)).toBe(50)
    expect(scoreFrequency(5, false)).toBe(100)
  })
  it('inverts reversed-scale items', () => {
    expect(scoreFrequency(1, true)).toBe(100)
    expect(scoreFrequency(5, true)).toBe(0)
  })
  it('falls back to neutral 50 for null/out-of-range input rather than crashing', () => {
    expect(scoreFrequency(null, false)).toBe(50)
    expect(scoreFrequency(undefined, false)).toBe(50)
    expect(scoreFrequency(0, false)).toBe(50)
    expect(scoreFrequency(6, false)).toBe(50)
  })
})

describe('clampScore', () => {
  it('clamps to 0-100 and rounds', () => {
    expect(clampScore(-5)).toBe(0)
    expect(clampScore(150)).toBe(100)
    expect(clampScore(42.6)).toBe(43)
  })
  it('falls back to neutral 50 for non-finite input (NaN/Infinity) rather than propagating garbage', () => {
    expect(clampScore(NaN)).toBe(50)
    expect(clampScore(Infinity)).toBe(50)
  })
})

describe('aggregate', () => {
  it('computes a pillar score as the weighted mean of its own items only', () => {
    const items: ScoredItem[] = [
      { responseId: 'r1', questionId: 'q1', code: 'HUM_FR_001', pillar: 'covenant_faithfulness', kind: 'frequency', score: 80 },
      { responseId: 'r2', questionId: 'q2', code: 'HUM_SC_001', pillar: 'covenant_faithfulness', kind: 'written', score: 40 },
      // A different pillar's item must not leak into covenant_faithfulness's score.
      { responseId: 'r3', questionId: 'q3', code: 'INT_FR_001', pillar: 'oneness', kind: 'frequency', score: 100 },
    ]
    const result = aggregate(items, [])
    // weighted mean: (80*1 + 40*1.5) / (1+1.5) = 140/2.5 = 56
    expect(result.pillar_scores.covenant_faithfulness).toBe(56)
    expect(result.pillar_scores.oneness).toBe(100)
    // Untouched pillars default to neutral 50, not 0 — a pillar with zero
    // responses should not look like total failure.
    expect(result.pillar_scores.conflict_repair).toBe(50)
  })

  it('gives written answers more weight than frequency answers', () => {
    const writtenHigh: ScoredItem[] = [
      { responseId: 'r1', questionId: 'q1', code: 'A', pillar: 'shared_vision', kind: 'frequency', score: 0 },
      { responseId: 'r2', questionId: 'q2', code: 'B', pillar: 'shared_vision', kind: 'written', score: 100 },
    ]
    const result = aggregate(writtenHigh, [])
    // written weight 1.5 vs frequency weight 1 → pulls above the naive 50/50 midpoint of 50
    expect(result.pillar_scores.shared_vision).toBeGreaterThan(50)
  })

  it('spreads a cross_pillar item across every core pillar equally', () => {
    const items: ScoredItem[] = [
      { responseId: 'r1', questionId: 'q1', code: 'X', pillar: 'cross_pillar' as any, kind: 'written', score: 90 },
    ]
    const result = aggregate(items, [])
    for (const p of CORE_PILLARS) expect(result.pillar_scores[p]).toBe(90)
  })

  it('ranks the priority stack lowest-score-first', () => {
    const items: ScoredItem[] = CORE_PILLARS.map((p, i) => ({
      responseId: `r${i}`, questionId: `q${i}`, code: `C${i}`, pillar: p, kind: 'written' as const,
      score: (i + 1) * 10, // covenant_faithfulness=10 (lowest), shared_vision=70 (highest)
    }))
    const result = aggregate(items, [])
    expect(result.priority_stack[0]).toBe('covenant_faithfulness')
    expect(result.priority_stack[CORE_PILLARS.length - 1]).toBe('shared_vision')
  })

  it('computes overall_score as the mean of all seven pillar scores', () => {
    const items: ScoredItem[] = CORE_PILLARS.map((p, i) => ({
      responseId: `r${i}`, questionId: `q${i}`, code: `C${i}`, pillar: p, kind: 'written' as const, score: 70,
    }))
    const result = aggregate(items, [])
    expect(result.overall_score).toBe(70)
  })

  describe('oneness flags', () => {
    it('flags a large gap between self-reported frequency and written engagement in the same pillar', () => {
      const items: ScoredItem[] = [
        { responseId: 'r1', questionId: 'q1', code: 'A', pillar: 'mutual_honor', kind: 'frequency', score: 95 },
        { responseId: 'r2', questionId: 'q2', code: 'B', pillar: 'mutual_honor', kind: 'written', score: 20 },
      ]
      const result = aggregate(items, [])
      expect(result.integrity_flags.mutual_honor).toBe('significant')
    })
    it('does not flag a pillar whose frequency and written scores broadly agree', () => {
      const items: ScoredItem[] = [
        { responseId: 'r1', questionId: 'q1', code: 'A', pillar: 'mutual_honor', kind: 'frequency', score: 70 },
        { responseId: 'r2', questionId: 'q2', code: 'B', pillar: 'mutual_honor', kind: 'written', score: 65 },
      ]
      const result = aggregate(items, [])
      expect(result.integrity_flags.mutual_honor).toBe('none')
    })

    it('applies the frequency_high_scenario_low cross-reference rule regardless of which side it is attached to', () => {
      const questions: Question[] = [
        q({ code: 'A', pillar: 'intimacy', question_type: 'frequency',
            integrity_flag_logic: { condition: 'frequency_high_scenario_low', cross_ref: ['B'], flag_level: 'significant' } as any }),
        q({ code: 'B', pillar: 'intimacy', question_type: 'scenario' }),
      ]
      const items: ScoredItem[] = [
        { responseId: 'r1', questionId: 'q1', code: 'A', pillar: 'intimacy', kind: 'frequency', score: 90 },
        { responseId: 'r2', questionId: 'q2', code: 'B', pillar: 'intimacy', kind: 'written', score: 20 },
      ]
      const result = aggregate(items, questions)
      expect(result.integrity_flags.intimacy).toBe('significant')
      expect(result.flags_by_response['r1']).toContain('frequency_high_scenario_low')
      expect(result.flags_by_response['r2']).toContain('frequency_high_scenario_low')
    })

    it('does NOT apply the cross-reference rule when the written answer is not actually low', () => {
      const questions: Question[] = [
        q({ code: 'A', pillar: 'intimacy', question_type: 'frequency',
            integrity_flag_logic: { condition: 'frequency_high_scenario_low', cross_ref: ['B'], flag_level: 'significant' } as any }),
        q({ code: 'B', pillar: 'intimacy', question_type: 'scenario' }),
      ]
      const items: ScoredItem[] = [
        { responseId: 'r1', questionId: 'q1', code: 'A', pillar: 'intimacy', kind: 'frequency', score: 90 },
        { responseId: 'r2', questionId: 'q2', code: 'B', pillar: 'intimacy', kind: 'written', score: 80 },
      ]
      const result = aggregate(items, questions)
      expect(result.integrity_flags.intimacy).toBe('none')
      expect(result.flags_by_response['r1']).toBeUndefined()
    })
  })
})

// ── Offline (keyword-scored) written answers ─────────────────────────────────
import { WRITTEN_WEIGHT_KEYWORD } from '../aggregate'

const rated = (id: string, scale: number, reversed = false, pillar = 'conflict_repair'): ScoredItem => ({
  responseId: `r-${id}`, questionId: id, code: id, pillar: pillar as any, kind: 'frequency',
  score: scoreFrequency(scale, reversed), scale, reversed,
})

describe('keyword-scored written answers carry little weight', () => {
  const freq = [rated('a', 5), rated('b', 5), rated('c', 5)]
  it('an AI-scored written answer pulls the score strongly; a keyword-scored one barely moves it', () => {
    const ai = aggregate([...freq, { responseId: 'w', questionId: 'w', code: 'W', pillar: 'conflict_repair', kind: 'written', score: 20 }], [])
    const kw = aggregate([...freq, { responseId: 'w', questionId: 'w', code: 'W', pillar: 'conflict_repair', kind: 'written', score: 20, byKeyword: true }], [])
    expect(ai.pillar_scores.conflict_repair).toBe(73)          // (300 + 20*1.5) / 4.5
    expect(kw.pillar_scores.conflict_repair).toBe(94)          // (300 + 20*0.25) / 3.25
    expect(WRITTEN_WEIGHT_KEYWORD).toBeLessThan(0.5)
  })
  it('a keyword-scored answer is never used to flag a rating as inflated', () => {
    const kw = aggregate([...freq, { responseId: 'w', questionId: 'w', code: 'W', pillar: 'conflict_repair', kind: 'written', score: 10, byKeyword: true }], [])
    expect(kw.integrity_flags.conflict_repair).toBe('none')
    const ai = aggregate([...freq, { responseId: 'w', questionId: 'w', code: 'W', pillar: 'conflict_repair', kind: 'written', score: 10 }], [])
    expect(ai.integrity_flags.conflict_repair).toBe('significant')
  })
})

describe('contradictory ratings (positive and reverse-worded statements)', () => {
  it('flags tapping "Almost always" all the way down: agreeing with both a statement and its opposite', () => {
    const r = aggregate([rated('a', 5), rated('b', 5), rated('c', 5), rated('d', 5, true), rated('e', 5, true)], [])
    expect(r.integrity_flags.conflict_repair).toBe('significant')
    expect(Object.values(r.flags_by_response).flat()).toContain('contradictory_ratings')
  })
  it('flags the same pattern at the other end: disagreeing with both', () => {
    const r = aggregate([rated('a', 1), rated('b', 1), rated('c', 1), rated('d', 1, true), rated('e', 1, true)], [])
    expect(r.integrity_flags.conflict_repair).toBe('significant')
  })
  it('does not flag a consistent person, good or poor', () => {
    const good = aggregate([rated('a', 5), rated('b', 4), rated('c', 5), rated('d', 1, true), rated('e', 2, true)], [])
    const poor = aggregate([rated('a', 1), rated('b', 2), rated('c', 1), rated('d', 5, true), rated('e', 4, true)], [])
    expect(good.integrity_flags.conflict_repair).toBe('none')
    expect(poor.integrity_flags.conflict_repair).toBe('none')
    expect(good.pillar_scores.conflict_repair).toBeGreaterThan(85)
    expect(poor.pillar_scores.conflict_repair).toBeLessThan(15)
  })
  it('does not flag neutral answers, and flags a single clash only as minor', () => {
    expect(aggregate([rated('a', 3), rated('b', 3), rated('d', 3, true)], []).integrity_flags.conflict_repair).toBe('none')
    expect(aggregate([rated('a', 5), rated('b', 5), rated('d', 5, true), rated('e', 1, true)], []).integrity_flags.conflict_repair).toBe('minor')
  })
  it('does nothing when an area has no reverse-worded item to cross-check against', () => {
    expect(aggregate([rated('a', 5), rated('b', 5), rated('c', 5)], []).integrity_flags.conflict_repair).toBe('none')
  })
})
