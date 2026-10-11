// lib/scoring/effective-scores.ts
//
// The single place that merges a Guide's score overrides on top of the
// engine's computed scores. Every surface that displays or ranks pillar
// scores (the live report page, the static/PDF export, the dashboard, the
// guide briefing) must go through this — never re-derive the merge, or the
// same drift that happened with the old duplicated discipline text
// (lib/report/preview-disciplines.ts's comment explains that history) will
// happen again here.
//
// Deliberately preserves the original computed values untouched: an
// override never overwrites pillar_scores itself, so there is always an
// honest record of what the engine actually found versus what a Guide's
// pastoral judgment corrected it to, and why.

import { descriptorFromScore, clampScore, CORE_PILLARS, type CorePillar } from './aggregate'
import type { FormationDescriptor, PillarName } from '@/types'

export interface ScoreOverride {
  score: number
  reason: string
  overridden_by: string
  overridden_at: string
}

export type PillarScoreOverrides = Partial<Record<CorePillar, ScoreOverride>>

export interface EffectiveScores {
  pillar_scores: Record<CorePillar, number>
  pillar_descriptors: Record<CorePillar, FormationDescriptor>
  priority_stack: CorePillar[]
  overall_score: number
  /** Which pillars carry a Guide override, for surfaces that want to visually mark them. */
  overriddenPillars: CorePillar[]
}

// integrity_flags is deliberately NOT recomputed here: it depends on the
// frequency-vs-written-answer gap in the original responses (see
// lib/scoring/aggregate.ts), which an override to a single pillar SCORE has
// no principled way to re-derive. A Guide overriding a score does not change
// what the raw answers showed about self-report honesty; it stays as
// computed. If a Guide disagrees with a flag itself, that is a pastoral
// conversation, not a number to override.

/**
 * Merge overrides onto computed scores. The priority stack and overall score
 * are RECOMPUTED from the effective (post-override) numbers — a Guide's
 * correction is meant to actually change what the participant is told is
 * most urgent, not just cosmetically relabel one pillar while the stack
 * silently still reflects the original computed order.
 */
export function computeEffectiveScores(
  computedScores: Record<string, number> | null | undefined,
  overrides: PillarScoreOverrides | null | undefined
): EffectiveScores {
  const pillar_scores = {} as Record<CorePillar, number>
  const pillar_descriptors = {} as Record<CorePillar, FormationDescriptor>
  const overriddenPillars: CorePillar[] = []

  for (const p of CORE_PILLARS) {
    const override = overrides?.[p]
    const base = computedScores?.[p] ?? 50
    const score = override ? clampScore(override.score) : clampScore(base)
    pillar_scores[p] = score
    pillar_descriptors[p] = descriptorFromScore(score)
    if (override) overriddenPillars.push(p)
  }

  const priority_stack = [...CORE_PILLARS].sort((a, b) => {
    if (pillar_scores[a] !== pillar_scores[b]) return pillar_scores[a] - pillar_scores[b]
    return CORE_PILLARS.indexOf(a) - CORE_PILLARS.indexOf(b)
  })

  const overall_score = clampScore(CORE_PILLARS.reduce((s, p) => s + pillar_scores[p], 0) / CORE_PILLARS.length)

  return { pillar_scores, pillar_descriptors, priority_stack, overall_score, overriddenPillars }
}
