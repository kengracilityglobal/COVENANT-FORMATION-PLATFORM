// lib/scoring/aggregate.ts
//
// Deterministic aggregation of per-question scores into pillar scores,
// descriptors, integrity flags, the priority stack and the overall score.
//
// The AI only ever judges individual WRITTEN answers. Everything below is plain,
// testable arithmetic so the same inputs always produce the same report and the
// descriptor bands can never disagree with getDescriptorFromScore().

import type { FormationDescriptor, PillarName, Question } from '@/types'

export const CORE_PILLARS = [
  'covenant_faithfulness', 'oneness', 'sacrificial_love', 'intimacy',
  'truthful_communication', 'conflict_repair', 'mutual_honor', 'shared_vision',
] as const
export type CorePillar = typeof CORE_PILLARS[number]

export type FlagLevel = 'none' | 'minor' | 'significant'

// Single source of truth for descriptor bands (used by scoring, reports, dashboard).
export const DESCRIPTOR_BANDS: Array<{ min: number; descriptor: FormationDescriptor }> = [
  { min: 85, descriptor: 'christformed' },
  { min: 70, descriptor: 'rooted' },
  { min: 50, descriptor: 'growing' },
  { min: 30, descriptor: 'awakening' },
  { min: 0,  descriptor: 'unengaged' },
]

export function descriptorFromScore(score: number): FormationDescriptor {
  for (const band of DESCRIPTOR_BANDS) if (score >= band.min) return band.descriptor
  return 'unengaged'
}

/** Weight of a written answer relative to a frequency (Likert) answer. */
export const WRITTEN_WEIGHT = 1.5
/** Written answers scored by the offline keyword heuristic (no AI). That heuristic measures how
 *  specific and candid the writing is, not what it says about the pillar, so it carries little
 *  weight: the ratings decide the score and the heuristic only nudges it. */
export const WRITTEN_WEIGHT_KEYWORD = 0.25
export const FREQUENCY_WEIGHT = 1

/** Gap (points) between self-reported frequency and written engagement that triggers a flag. */
export const MINOR_GAP = 30
export const SIGNIFICANT_GAP = 45

export interface ScoredItem {
  responseId: string
  questionId: string
  code: string
  pillar: PillarName
  kind: 'frequency' | 'written'
  score: number            // 0–100
  /** Written answer scored by the keyword heuristic rather than an AI reading. */
  byKeyword?: boolean
  /** Rated items: the raw 1-5 answer, and whether the statement is reverse-worded. */
  scale?: number | null
  reversed?: boolean
}

export interface AggregateResult {
  pillar_scores: Record<CorePillar, number>
  pillar_descriptors: Record<CorePillar, FormationDescriptor>
  integrity_flags: Record<CorePillar, FlagLevel>
  priority_stack: CorePillar[]
  overall_score: number
  flags_by_response: Record<string, string[]>
}

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** 1–5 Likert → 0–100 (reversed items inverted). Out-of-range → neutral 50. */
export function scoreFrequency(scale: number | null | undefined, reversed: boolean): number {
  if (!scale || scale < 1 || scale > 5) return 50
  const raw = ((scale - 1) / 4) * 100
  return Math.round(reversed ? 100 - raw : raw)
}

const SEVERITY: Record<FlagLevel, number> = { none: 0, minor: 1, significant: 2 }
const maxFlag = (a: FlagLevel, b: FlagLevel): FlagLevel => (SEVERITY[a] >= SEVERITY[b] ? a : b)

function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export function aggregate(items: ScoredItem[], questions: Question[]): AggregateResult {
  const sums: Record<string, number> = {}
  const weights: Record<string, number> = {}
  const freqByPillar: Record<string, number[]> = {}
  const writtenByPillar: Record<string, number[]> = {}
  for (const p of CORE_PILLARS) { sums[p] = 0; weights[p] = 0; freqByPillar[p] = []; writtenByPillar[p] = [] }

  for (const it of items) {
    const w = it.kind === 'written' ? (it.byKeyword ? WRITTEN_WEIGHT_KEYWORD : WRITTEN_WEIGHT) : FREQUENCY_WEIGHT
    if (it.pillar === 'cross_pillar') {
      // Cross-pillar items contribute equally to every pillar's score.
      for (const p of CORE_PILLARS) { sums[p] += it.score * w; weights[p] += w }
    } else if ((CORE_PILLARS as readonly string[]).includes(it.pillar)) {
      sums[it.pillar] += it.score * w
      weights[it.pillar] += w
      // Keyword-scored writing is too crude to judge a rating against, so it takes no part in flags.
      if (it.kind === 'written') { if (!it.byKeyword) writtenByPillar[it.pillar].push(it.score) }
      else freqByPillar[it.pillar].push(it.score)
    }
  }

  const pillar_scores = {} as Record<CorePillar, number>
  const pillar_descriptors = {} as Record<CorePillar, FormationDescriptor>
  const integrity_flags = {} as Record<CorePillar, FlagLevel>
  for (const p of CORE_PILLARS) {
    pillar_scores[p] = weights[p] > 0 ? clampScore(sums[p] / weights[p]) : 50
    pillar_descriptors[p] = descriptorFromScore(pillar_scores[p])

    // Integrity flag 1: self-reported frequency vs. written engagement, either direction.
    const f = avg(freqByPillar[p]); const w = avg(writtenByPillar[p])
    let flag: FlagLevel = 'none'
    if (f !== null && w !== null) {
      const gap = Math.abs(f - w)
      if (gap > SIGNIFICANT_GAP) flag = 'significant'
      else if (gap > MINOR_GAP) flag = 'minor'
    }
    integrity_flags[p] = flag
  }

  // Integrity flag 1b: contradictory ratings. Each area has positively worded rated statements
  // and reverse-worded ones. Agreeing with both ("I keep my promises: almost always" and "I let
  // promises slide: almost always"), or disagreeing with both, cannot be right, and it is the
  // signature of answering without reading. Catches tapping the same answer all the way down.
  const flags_by_response: Record<string, string[]> = {}
  for (const p of CORE_PILLARS) {
    const rated = items.filter(i => i.pillar === p && i.kind === 'frequency' && typeof i.scale === 'number')
    const pos = rated.filter(i => !i.reversed)
    const rev = rated.filter(i => i.reversed)
    if (!pos.length || !rev.length) continue
    const agree = (i: ScoredItem) => (i.scale as number) >= 4
    const disagree = (i: ScoredItem) => (i.scale as number) <= 2
    const clash = (test: (i: ScoredItem) => boolean) => ({ a: pos.filter(test), b: rev.filter(test) })
    const hi = clash(agree)
    const lo = clash(disagree)
    const n = Math.max(Math.min(hi.a.length, hi.b.length), Math.min(lo.a.length, lo.b.length))
    if (n === 0) continue
    const level: FlagLevel = n >= 2 ? 'significant' : 'minor'
    integrity_flags[p] = maxFlag(integrity_flags[p], level)
    const involved = Math.min(hi.a.length, hi.b.length) >= Math.min(lo.a.length, lo.b.length) ? [...hi.a, ...hi.b] : [...lo.a, ...lo.b]
    for (const it of involved) flags_by_response[it.responseId] = Array.from(new Set([...(flags_by_response[it.responseId] ?? []), 'contradictory_ratings']))
  }

  // Integrity flag 2: explicit per-question cross-reference logic from the question bank
  // ("frequency_high_scenario_low"): claims to do X often, but the scenario answer shows otherwise.
  const byCode = new Map(items.map(i => [i.code, i]))
  for (const q of questions) {
    const logic: any = q.integrity_flag_logic
    if (!logic || logic.condition !== 'frequency_high_scenario_low') continue
    const self = byCode.get(q.code)
    if (!self) continue
    const refs = (logic.cross_ref ?? q.cross_ref_questions ?? []) as string[]
    const pair = [self, ...refs.map(c => byCode.get(c)).filter(Boolean) as ScoredItem[]]
    // The rule can be attached to either side of the pair, so split by kind.
    const freqSide = pair.filter(i => i.kind === 'frequency')
    const writtenSide = pair.filter(i => i.kind === 'written' && !i.byKeyword)
    if (!freqSide.length || !writtenSide.length) continue
    const freqAvg = avg(freqSide.map(i => i.score)) as number
    const writtenAvg = avg(writtenSide.map(i => i.score)) as number
    if (freqAvg >= 75 && writtenAvg <= 45) {
      const level: FlagLevel = logic.flag_level === 'minor' ? 'minor' : 'significant'
      const p = q.pillar as CorePillar
      if ((CORE_PILLARS as readonly string[]).includes(p)) integrity_flags[p] = maxFlag(integrity_flags[p], level)
      for (const it of pair) {
        flags_by_response[it.responseId] = Array.from(new Set([...(flags_by_response[it.responseId] ?? []), 'frequency_high_scenario_low']))
      }
    }
  }

  // Priority stack: lowest score first; ties broken by flag severity, then canonical order.
  const priority_stack = [...CORE_PILLARS].sort((a, b) => {
    if (pillar_scores[a] !== pillar_scores[b]) return pillar_scores[a] - pillar_scores[b]
    if (SEVERITY[integrity_flags[a]] !== SEVERITY[integrity_flags[b]]) return SEVERITY[integrity_flags[b]] - SEVERITY[integrity_flags[a]]
    return CORE_PILLARS.indexOf(a) - CORE_PILLARS.indexOf(b)
  })

  const overall_score = clampScore(CORE_PILLARS.reduce((s, p) => s + pillar_scores[p], 0) / CORE_PILLARS.length)

  return { pillar_scores, pillar_descriptors, integrity_flags, priority_stack, overall_score, flags_by_response }
}
