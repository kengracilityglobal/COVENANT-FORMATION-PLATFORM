// lib/scoring/gap.ts
//
// The platform's core addition over EIKON: a Perception Gap Index between
// two partners' independently-computed scores on the same pillar.
//
// Deliberately NOT stored anywhere — always computed fresh from the two
// source assessments (the same effective, post-override scores every other
// surface uses — see lib/scoring/effective-scores.ts), so there is no
// second place this can drift from what each partner actually sees in
// their own report. A couple who both score "Rooted" on a pillar is in a
// different place than a couple averaging the same number with one
// partner Rooted and the other Unengaged — averaging would hide exactly
// what this function exists to surface.

import { CORE_PILLARS, type CorePillar } from './aggregate'
import { computeEffectiveScores, type PillarScoreOverrides } from './effective-scores'
import type { FormationDescriptor } from '@/types'
import { GAP_BANDS } from '@/types'

export interface PillarGapResult {
  pillar: CorePillar
  partner_a_score: number | null
  partner_a_descriptor: FormationDescriptor | null
  partner_b_score: number | null
  partner_b_descriptor: FormationDescriptor | null
  gap: number | null
  gap_band: 'aligned' | 'notable' | 'significant' | null
}

export interface CoupleGapResult {
  both_complete: boolean
  pillars: PillarGapResult[]
  /** Pillars ranked by what the couple should address first — a wide gap can
   *  outrank a low individual score, because an unseen gap is itself a risk. */
  joint_priority_stack: CorePillar[]
}

function gapBand(gap: number): 'aligned' | 'notable' | 'significant' {
  for (const b of GAP_BANDS) if (gap <= b.max) return b.band
  return 'significant'
}

/**
 * Minimal shape this needs from an assessment row — accepts the raw
 * computed scores plus any Guide overrides, same inputs
 * computeEffectiveScores() already takes, so this never has to know
 * about Supabase row shapes directly.
 */
export interface PartnerAssessmentInput {
  pillar_scores: Record<string, number> | null | undefined
  pillar_score_overrides: PillarScoreOverrides | null | undefined
  status: string
}

export function computeCoupleGap(
  partnerA: PartnerAssessmentInput | null,
  partnerB: PartnerAssessmentInput | null
): CoupleGapResult {
  const aComplete = Boolean(partnerA?.pillar_scores)
  const bComplete = Boolean(partnerB?.pillar_scores)
  const both_complete = aComplete && bComplete

  const effA = aComplete ? computeEffectiveScores(partnerA!.pillar_scores, partnerA!.pillar_score_overrides) : null
  const effB = bComplete ? computeEffectiveScores(partnerB!.pillar_scores, partnerB!.pillar_score_overrides) : null

  const pillars: PillarGapResult[] = CORE_PILLARS.map(p => {
    const aScore = effA ? effA.pillar_scores[p] : null
    const bScore = effB ? effB.pillar_scores[p] : null
    const gap = aScore !== null && bScore !== null ? Math.abs(aScore - bScore) : null
    return {
      pillar: p,
      partner_a_score: aScore,
      partner_a_descriptor: effA ? effA.pillar_descriptors[p] : null,
      partner_b_score: bScore,
      partner_b_descriptor: effB ? effB.pillar_descriptors[p] : null,
      gap,
      gap_band: gap !== null ? gapBand(gap) : null,
    }
  })

  // Joint priority: rank by gap size first (an unseen gap is the formation
  // risk this platform exists to catch), then by the lower of the two
  // individual scores, so a pillar both partners score poorly on without
  // disagreeing about it still surfaces near the top.
  const joint_priority_stack = both_complete
    ? [...pillars]
        .sort((x, y) => {
          const gapDiff = (y.gap ?? 0) - (x.gap ?? 0)
          if (gapDiff !== 0) return gapDiff
          const xLow = Math.min(x.partner_a_score ?? 100, x.partner_b_score ?? 100)
          const yLow = Math.min(y.partner_a_score ?? 100, y.partner_b_score ?? 100)
          return xLow - yLow
        })
        .map(p => p.pillar)
    : []

  return { both_complete, pillars, joint_priority_stack }
}
