import { describe, it, expect } from 'vitest'
import { computeEffectiveScores } from '../effective-scores'
import { CORE_PILLARS } from '../aggregate'

function baseScores(overrides: Partial<Record<string, number>> = {}) {
  const s: Record<string, number> = {}
  for (const p of CORE_PILLARS) s[p] = 50
  return { ...s, ...overrides }
}

describe('computeEffectiveScores', () => {
  it('with no overrides, returns the computed scores unchanged', () => {
    const computed = baseScores({ covenant_faithfulness: 30, conflict_repair: 80 })
    const result = computeEffectiveScores(computed, null)
    expect(result.pillar_scores.covenant_faithfulness).toBe(30)
    expect(result.pillar_scores.conflict_repair).toBe(80)
    expect(result.overriddenPillars).toEqual([])
  })

  it('a Guide override replaces the computed score for that pillar only', () => {
    const computed = baseScores({ conflict_repair: 30 }) // computed engine said "awakening"
    const result = computeEffectiveScores(computed, {
      conflict_repair: { score: 75, reason: 'He described this exact scenario to me in person with far more honesty than the written answer showed.', overridden_by: 'guide-1', overridden_at: '2026-01-01T00:00:00Z' },
    })
    expect(result.pillar_scores.conflict_repair).toBe(75)
    expect(result.pillar_descriptors.conflict_repair).toBe('rooted')
    expect(result.overriddenPillars).toEqual(['conflict_repair'])
    // Untouched pillars are unaffected.
    expect(result.pillar_scores.covenant_faithfulness).toBe(50)
  })

  it('an override changes the priority stack — pastoral judgment actually takes precedence, not just cosmetically', () => {
    const computed = baseScores({ conflict_repair: 20, covenant_faithfulness: 60 }) // conflict_repair is computed-lowest
    const withoutOverride = computeEffectiveScores(computed, null)
    expect(withoutOverride.priority_stack[0]).toBe('conflict_repair')

    const withOverride = computeEffectiveScores(computed, {
      conflict_repair: { score: 90, reason: 'test', overridden_by: 'g', overridden_at: 'now' },
    })
    // conflict_repair no longer belongs at the top once overridden upward
    expect(withOverride.priority_stack[0]).not.toBe('conflict_repair')
  })

  it('recomputes overall_score from the effective (post-override) numbers', () => {
    const computed = baseScores() // all 50 -> overall 50
    const result = computeEffectiveScores(computed, {
      covenant_faithfulness: { score: 100, reason: 'test', overridden_by: 'g', overridden_at: 'now' },
    })
    // one pillar moved from 50 to 100 across 7 pillars: 50 + 50/7 ≈ 57
    expect(result.overall_score).toBeGreaterThan(50)
    expect(result.overall_score).toBeLessThan(60)
  })

  it('clamps an out-of-range override score rather than propagating garbage', () => {
    const result = computeEffectiveScores(baseScores(), {
      shared_vision: { score: 150, reason: 'test', overridden_by: 'g', overridden_at: 'now' },
    })
    expect(result.pillar_scores.shared_vision).toBe(100)
  })

  it('handles completely missing computed scores without throwing (defensive default)', () => {
    const result = computeEffectiveScores(null, null)
    for (const p of CORE_PILLARS) expect(result.pillar_scores[p]).toBe(50)
  })
})
