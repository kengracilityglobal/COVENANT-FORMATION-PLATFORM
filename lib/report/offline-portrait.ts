// lib/report/offline-portrait.ts
//
// The offline report engine. Everything in a report that does NOT need an
// AI key is produced here, deterministically, from three things only:
//   1. the person's scores and descriptors,
//   2. the question bank's own per-question scoring rubrics, matched to how
//      THEY actually answered each question, and
//   3. their own written words (a short excerpt, never paraphrased).
//
// The authored prose lives in offline-content.ts. This file only chooses
// between finished pieces and fills in evidence — it never assembles
// sentences from fragments, which is what made the earlier fallback read
// like a mail-merge. Pure functions, no I/O, safe to run on any request.
//
// Output is PLAIN TEXT. The caller (builder.ts) HTML-escapes at render.

import type { FormationDescriptor } from '@/types'
import { PILLAR_DISPLAY_NAMES } from '@/types'
import { CORE_PILLARS, descriptorFromScore, DESCRIPTOR_BANDS, type CorePillar } from '@/lib/scoring/aggregate'
import type { CoupleGapResult } from '@/lib/scoring/gap'
import {
  COUPLE_PORTRAIT, COUPLE_ACTION, READINESS_PORTRAIT, READINESS_ACTION,
  GAP_LINES, GAP_ALIGNED_STRONG, GAP_ALIGNED_MID, PATTERNS, OVERALL_OPENING,
  NEAR_NEXT, NEAR_PREV, CONSISTENT, FLAG_SIGNIFICANT, FLAG_MINOR, FLAG_DETAIL, WEEK_FOUR,
} from './offline-content'

// ── Types ──────────────────────────────────────────────────────────────

export type PortraitFamily = 'married' | 'premarital' | 'readiness'
type Copy = 'couple' | 'readiness'

/** The only question fields the engine needs. Safe to pass full rows. */
export interface QuestionLite {
  id: string
  code?: string
  pillar: string
  question_type?: string
  question_text: string
  scale_reversed?: boolean
  scoring_rubric?: Partial<Record<FormationDescriptor, string>> | null
}

/** The only response fields the engine needs. Safe to pass full rows. */
export interface ResponseLite {
  question_id: string
  response_text?: string | null
  response_scale?: number | null
  computed_score?: number | null
  descriptor_assigned?: string | null
  word_count?: number | null
}

export interface EvidenceItem {
  statement: string
  /** "frequency" answers show the chosen label; written answers don't. */
  kind: 'frequency' | 'written'
  answerLabel: string | null
  rubricLine: string | null
  score: number
}

export interface PillarEvidence {
  holds: EvidenceItem | null
  slips: EvidenceItem | null
  /** True when the person's answers in this area were all close together. */
  consistent: boolean
  /** A short excerpt of their own written words, plain text. */
  excerpt: string | null
  answered: number
}

export interface PillarPortrait {
  portrait: string
  action: string
  evidence: PillarEvidence
  flagText: string
}

// ── Small helpers ──────────────────────────────────────────────────────

const FREQ_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always']
const DESCRIPTORS: FormationDescriptor[] = ['christformed', 'rooted', 'growing', 'awakening', 'unengaged']

export function copyFor(track: string | null | undefined): Copy {
  return track === 'readiness' ? 'readiness' : 'couple'
}

function isDescriptor(v: unknown): v is FormationDescriptor {
  return typeof v === 'string' && (DESCRIPTORS as string[]).includes(v)
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function sentenceCase(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

/** Resolve {sp} / {Sp} / {mar} for couple copy. Readiness copy has no tokens. */
export function fillTokens(text: string, track: string | null | undefined): string {
  const premarital = track === 'premarital'
  const sp = premarital ? 'your partner' : 'your spouse'
  const mar = premarital ? 'your relationship' : 'your marriage'
  return text
    .replace(/\{Sp\}/g, sentenceCase(sp))
    .replace(/\{sp\}/g, sp)
    .replace(/\{mar\}/g, mar)
}

function fillOther(text: string, other: string): string {
  return text.replace(/\{other\}/g, (_m, offset: number, whole: string) => {
    const atStart = offset === 0 || /[.!?]\s$/.test(whole.slice(Math.max(0, offset - 2), offset))
    return atStart ? sentenceCase(other) : other
  })
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–—\s]+$/, '') + '…'
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/** First one or two sentences of a written answer, capped, plain text. */
export function excerptFrom(text: string, max = 240): string | null {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (wordCount(clean) < 15) return null
  const sentences = clean.split(/(?<=[.!?])\s+/)
  let out = sentences[0] ?? clean
  if (out.length < 90 && sentences[1]) out = `${out} ${sentences[1]}`
  return truncate(out, max)
}

function pluralPoints(n: number): string { return n === 1 ? 'point' : 'points' }

// ── Per-pillar evidence ────────────────────────────────────────────────

export function buildEvidence(
  pillar: CorePillar,
  responses: ResponseLite[] | undefined,
  questions: QuestionLite[] | undefined,
): PillarEvidence {
  const empty: PillarEvidence = { holds: null, slips: null, consistent: false, excerpt: null, answered: 0 }
  if (!responses?.length || !questions?.length) return empty

  const qById = new Map(questions.map(q => [q.id, q]))
  const rows = responses
    .map(r => ({ r, q: qById.get(r.question_id) }))
    .filter((x): x is { r: ResponseLite; q: QuestionLite } => !!x.q && x.q.pillar === pillar)
    .map(({ r, q }) => ({ r, q, score: num(r.computed_score) }))
    .filter((x): x is { r: ResponseLite; q: QuestionLite; score: number } => x.score !== null)

  if (!rows.length) return empty

  const toItem = (x: { r: ResponseLite; q: QuestionLite; score: number }): EvidenceItem => {
    const d = isDescriptor(x.r.descriptor_assigned) ? x.r.descriptor_assigned : descriptorFromScore(x.score)
    const isFreq = x.q.question_type === 'frequency'
    const scale = num(x.r.response_scale)
    return {
      statement: truncate(x.q.question_text, 220),
      kind: isFreq ? 'frequency' : 'written',
      answerLabel: isFreq && scale && scale >= 1 && scale <= 5 ? FREQ_LABELS[scale - 1] : null,
      rubricLine: x.q.scoring_rubric?.[d] ?? null,
      score: x.score,
    }
  }

  const sorted = [...rows].sort((a, b) => a.score - b.score)
  const lo = sorted[0]
  const hi = sorted[sorted.length - 1]

  let holds: EvidenceItem | null = null
  let slips: EvidenceItem | null = null
  let consistent = false
  if (sorted.length === 1) {
    if (lo.score >= 60) holds = toItem(lo)
    else slips = toItem(lo)
  } else if (hi.score - lo.score >= 15) {
    holds = toItem(hi)
    slips = toItem(lo)
  } else {
    consistent = true
  }

  // Their own words: the longest written answer in this pillar.
  let excerpt: string | null = null
  const written = rows
    .filter(x => x.q.question_type !== 'frequency' && typeof x.r.response_text === 'string')
    .map(x => ({ text: x.r.response_text as string, words: num(x.r.word_count) ?? wordCount(x.r.response_text as string) }))
    .sort((a, b) => b.words - a.words)
  if (written[0]) excerpt = excerptFrom(written[0].text)

  return { holds, slips, consistent, excerpt, answered: rows.length }
}

// ── Integrity-flag wording ─────────────────────────────────────────────

function frequencyVsWrittenDetail(
  pillar: CorePillar,
  responses: ResponseLite[] | undefined,
  questions: QuestionLite[] | undefined,
): string {
  if (!responses?.length || !questions?.length) return ''
  const qById = new Map(questions.map(q => [q.id, q]))
  const rows = responses
    .map(r => ({ r, q: qById.get(r.question_id), score: num(r.computed_score) }))
    .filter(x => x.q && x.q.pillar === pillar && x.score !== null) as Array<{ r: ResponseLite; q: QuestionLite; score: number }>
  const freq = rows.filter(x => x.q.question_type === 'frequency').sort((a, b) => b.score - a.score)[0]
  const wr = rows.filter(x => x.q.question_type !== 'frequency').sort((a, b) => a.score - b.score)[0]
  if (!freq || !wr || freq.score - wr.score < 30) return ''
  const scale = num(freq.r.response_scale)
  if (!scale || scale < 1 || scale > 5) return ''
  const label = FREQ_LABELS[scale - 1].toLowerCase()
  return FLAG_DETAIL.replace('{said}', truncate(freq.q.question_text, 140)).replace('{label}', label)
}

export function flagText(
  pillar: CorePillar,
  flag: string | undefined,
  responses?: ResponseLite[],
  questions?: QuestionLite[],
): string {
  if (!flag || flag === 'none') return ''
  const name = PILLAR_DISPLAY_NAMES[pillar]
  const base = (flag === 'significant' ? FLAG_SIGNIFICANT : FLAG_MINOR).replace('{name}', name)
  const detail = frequencyVsWrittenDetail(pillar, responses, questions)
  return detail ? `${base} ${detail}` : base
}

// ── Band position ──────────────────────────────────────────────────────

function positionNote(score: number, descriptor: FormationDescriptor): string {
  const idx = DESCRIPTOR_BANDS.findIndex(b => b.descriptor === descriptor)
  if (idx < 0) return ''
  const band = DESCRIPTOR_BANDS[idx]
  const upperBound = idx === 0 ? 100 : DESCRIPTOR_BANDS[idx - 1].min - 1
  if (idx > 0) {
    const toNext = DESCRIPTOR_BANDS[idx - 1].min - Math.round(score)
    if (toNext >= 1 && toNext <= 3) {
      return NEAR_NEXT.replace('{score}', String(Math.round(score))).replace('{n}', String(toNext)).replace('{points}', pluralPoints(toNext))
    }
  }
  if (idx < DESCRIPTOR_BANDS.length - 1 && Math.round(score) - band.min <= 2 && upperBound > band.min) {
    return NEAR_PREV.replace('{score}', String(Math.round(score)))
  }
  return ''
}

// ── The pillar portrait ────────────────────────────────────────────────

export interface PillarPortraitInput {
  pillar: CorePillar
  track: string | null | undefined
  score: number
  descriptor: string | null | undefined
  integrityFlag?: string
  responses?: ResponseLite[]
  questions?: QuestionLite[]
}

export function buildPillarPortrait(input: PillarPortraitInput): PillarPortrait {
  const { pillar, track } = input
  const score = num(input.score) ?? 50
  const descriptor: FormationDescriptor = isDescriptor(input.descriptor) ? input.descriptor : descriptorFromScore(score)
  const copy = copyFor(track)

  const portraitBank = copy === 'readiness' ? READINESS_PORTRAIT : COUPLE_PORTRAIT
  const actionBank = copy === 'readiness' ? READINESS_ACTION : COUPLE_ACTION

  const base = portraitBank[pillar][descriptor]
  const note = positionNote(score, descriptor)
  const evidence = buildEvidence(pillar, input.responses, input.questions)

  return {
    portrait: fillTokens([base, note].filter(Boolean).join(' '), track),
    action: fillTokens(actionBank[pillar][descriptor], track),
    evidence,
    flagText: flagText(pillar, input.integrityFlag, input.responses, input.questions),
  }
}

// ── The overview ───────────────────────────────────────────────────────

export interface Overview {
  opening: string
  ground: string
  patterns: string[]
  flagsNote: string
}

type Scores = Partial<Record<string, number>>

function scoreOf(scores: Scores, p: CorePillar): number {
  return num(scores[p]) ?? 50
}

/** Which cross-pillar patterns this person's shape triggers, most telling first. */
export function detectPatterns(scores: Scores): string[] {
  const s = (p: CorePillar) => scoreOf(scores, p)
  const all = CORE_PILLARS.map(p => s(p))
  const spread = Math.max(...all) - Math.min(...all)
  const lowCount = all.filter(v => v < 50).length
  const highCount = all.filter(v => v >= 70).length
  const overall = all.reduce((a, b) => a + b, 0) / all.length

  const out: string[] = []
  if (lowCount >= 6) out.push('low_across')
  else if (highCount >= 6 && overall >= 75) out.push('high_across')
  else if (spread >= 40) out.push('lopsided')
  else if (spread <= 12) out.push('even_shape')

  const pairs: Array<[string, CorePillar, CorePillar]> = [
    ['giving_without_saying', 'sacrificial_love', 'truthful_communication'],
    ['close_but_fragile', 'intimacy', 'conflict_repair'],
    ['reliable_not_reachable', 'covenant_faithfulness', 'intimacy'],
    ['truth_without_tenderness', 'truthful_communication', 'mutual_honor'],
    ['team_without_destination', 'oneness', 'shared_vision'],
    ['plans_without_partnership', 'shared_vision', 'oneness'],
    ['peace_by_silence', 'conflict_repair', 'truthful_communication'],
    ['polite_not_costly', 'mutual_honor', 'sacrificial_love'],
  ]
  const hits = pairs
    .filter(([, hi, lo]) => s(hi) >= 70 && s(lo) <= 55)
    .map(([id, hi, lo]) => ({ id, strength: s(hi) - s(lo) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map(h => h.id)

  return [...out, ...hits].slice(0, 3)
}

function joinNames(ps: CorePillar[]): string {
  const names = ps.map(p => PILLAR_DISPLAY_NAMES[p])
  return names.length === 2 ? `${names[0]} and ${names[1]}` : names.join(', ')
}

export interface OverviewInput {
  track: string | null | undefined
  scores: Scores
  overall: number
  integrityFlags?: Record<string, string>
}

export function buildOverview(input: OverviewInput): Overview {
  const { track, scores } = input
  const copy = copyFor(track)
  const overall = num(input.overall) ?? 50

  const opening = fillTokens(OVERALL_OPENING[copy][descriptorFromScore(overall)], track)

  const ranked = [...CORE_PILLARS].sort((a, b) => scoreOf(scores, b) - scoreOf(scores, a) || CORE_PILLARS.indexOf(a) - CORE_PILLARS.indexOf(b))
  const top = ranked.slice(0, 2)
  const bottom = ranked.slice(-2).reverse()
  const spread = scoreOf(scores, ranked[0]) - scoreOf(scores, ranked[ranked.length - 1])
  const ground = spread < 8
    ? ''
    : `Your strongest ground is ${joinNames(top)}. The areas asking most for your attention are ${joinNames(bottom)}.`

  const patterns = detectPatterns(scores).map(id => fillTokens(PATTERNS[id][copy], track))

  const flagged = CORE_PILLARS.filter(p => input.integrityFlags && input.integrityFlags[p] && input.integrityFlags[p] !== 'none')
  const flagsNote = flagged.length
    ? `${flagged.length === 1 ? 'One area carries' : `${flagged.length} areas carry`} a flag (⚑ below): a place where what you said about yourself in general did not fully match how you answered about a specific situation. These are often the most useful places to start a conversation.`
    : ''

  return { opening, ground, patterns, flagsNote }
}

// ── First thirty days ──────────────────────────────────────────────────

export interface PlanWeek { label: string; title: string; text: string }

export function buildFirstMonth(args: {
  track: string | null | undefined
  order: string[]
  descriptors: Record<string, string>
  scores: Scores
}): PlanWeek[] {
  const { track } = args
  const copy = copyFor(track)
  const actionBank = copy === 'readiness' ? READINESS_ACTION : COUPLE_ACTION
  const picks = args.order.filter((p): p is CorePillar => (CORE_PILLARS as readonly string[]).includes(p)).slice(0, 3)

  const weeks: PlanWeek[] = picks.map((p, i) => {
    const d = isDescriptor(args.descriptors[p]) ? (args.descriptors[p] as FormationDescriptor) : descriptorFromScore(scoreOf(args.scores, p))
    return { label: `Week ${i + 1}`, title: PILLAR_DISPLAY_NAMES[p], text: fillTokens(actionBank[p][d], track) }
  })
  if (weeks.length) {
    weeks.push({ label: `Week ${weeks.length + 1}`, title: 'Look back', text: fillTokens(WEEK_FOUR[copy], track) })
  }
  return weeks
}

// ── Couple gap reading ─────────────────────────────────────────────────

export interface GapReading { pillar: CorePillar; line: string }

export function readGap(
  coupleGap: CoupleGapResult | null | undefined,
  track: string | null | undefined,
  otherName: string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!coupleGap || !coupleGap.both_complete) return out
  const other = otherName && otherName.trim() ? otherName.trim() : (track === 'premarital' ? 'your partner' : 'your spouse')

  for (const g of coupleGap.pillars) {
    const a = num(g.partner_a_score)
    const b = num(g.partner_b_score)
    if (a === null || b === null) continue
    const lines = GAP_LINES[g.pillar]
    let line: string
    if (g.gap_band === 'aligned' || g.gap_band === null) {
      if (a < 50 && b < 50) line = lines.bothLow
      else if (a >= 70 && b >= 70) line = GAP_ALIGNED_STRONG
      else line = GAP_ALIGNED_MID
    } else {
      line = a > b ? lines.youHigher : lines.otherHigher
    }
    out[g.pillar] = fillOther(line, other)
  }
  return out
}

// ── HTML escaping (used by the builder for everything above) ───────────

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
