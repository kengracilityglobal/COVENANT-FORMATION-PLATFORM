// lib/taster.ts
// Question data and small pure helpers for the free taster (app/(public)/taster).
// Kept out of the page so they can be tested. Married and premarital questions
// come from the married-track bank (supabase/migrations/003); readiness
// questions from the readiness bank (006).

import type { CorePillar } from '@/lib/scoring/aggregate'

export type Track = 'married' | 'premarital' | 'readiness'
export type Question = { id: string; pillar: CorePillar; text: string; low: string; high: string }

// Same five labelled choices, and the same 1-5 -> 0/25/50/75/100 mapping, as the
// real assessment (app/(participant)/assessment/page.tsx + lib/scoring/aggregate.ts),
// so a taster result and the full assessment agree. No slider: a 0-100 drag implies
// precision nobody has about "I keep promises when it's inconvenient", and a default
// position records an answer the person never gave.
export const COUPLE_QUESTIONS: Question[] = [
  { id: 'cf1', pillar: 'covenant_faithfulness', text: 'When keeping a promise to my spouse becomes inconvenient, I keep it anyway.', low: 'Rarely — convenience usually wins', high: 'Always — the promise simply holds' },
  { id: 'cf2', pillar: 'covenant_faithfulness', text: 'When our marriage is difficult, my commitment to stay and work on it does not waver.', low: 'When it is hard, I start to wonder', high: 'It does not waver, even when it is hard' },
  { id: 'tc1', pillar: 'truthful_communication', text: 'What I tell my spouse matches what I actually think and feel, even when the truth is uncomfortable.', low: 'I often soften or withhold it', high: 'I say the true thing, even at real cost' },
  { id: 'tc2', pillar: 'truthful_communication', text: 'I bring up problems in our marriage directly with my spouse rather than venting to someone else first.', low: 'Problems usually go to someone else first', high: 'My spouse is reliably the first person I bring it to' },
  { id: 'cr1', pillar: 'conflict_repair', text: 'After my spouse and I argue, we actually resolve it — not just stop talking about it.', low: 'We mostly settle into an unspoken truce', high: 'We reliably reach real repair, not just a ceasefire' },
  { id: 'cr2', pillar: 'conflict_repair', text: 'I am the one who initiates repair after a conflict at least as often as my spouse is.', low: 'I usually wait for my spouse to go first', high: 'I initiate readily, regardless of who "should"' },
]

export const READINESS_QUESTIONS: Question[] = [
  { id: 'cf1', pillar: 'covenant_faithfulness', text: 'When I make a promise to someone I’m close to, I follow through even after my feelings about it change.', low: 'Rarely — my feelings usually decide', high: 'Almost always — my word holds regardless' },
  { id: 'cf2', pillar: 'covenant_faithfulness', text: 'I tend to stay committed to people and decisions even when the relationship or situation becomes difficult or inconvenient.', low: 'I tend to step back when it gets hard', high: 'I stay, even when it costs me' },
  { id: 'tc1', pillar: 'truthful_communication', text: 'When something is bothering me in a relationship, I say so directly rather than going quiet or dropping hints.', low: 'I usually go quiet or hint', high: 'I say it plainly and kindly' },
  { id: 'tc2', pillar: 'truthful_communication', text: 'I can hear honest feedback about myself without becoming defensive or shutting down.', low: 'I get defensive or shut down', high: 'I can take it in and think about it' },
  { id: 'cr1', pillar: 'conflict_repair', text: 'After an argument, I’m usually the one who reaches out first to repair things, rather than waiting the other person out.', low: 'I usually wait them out', high: 'I reach out first, readily' },
  { id: 'cr2', pillar: 'conflict_repair', text: 'I can stay in a hard conversation without withdrawing, shutting down, or walking away.', low: 'I withdraw when it gets heated', high: 'I stay in the room, even when it is hard' },
]

/** Premarital reuses the married wording with partner / relationship. */
export function toPremarital(s: string): string {
  return s
    .replace(/\b([Mm])y spouse/g, (_m, c: string) => `${c}y partner`)
    .replace(/\bspouse\b/g, 'partner')
    .replace(/\bmarriage\b/g, 'relationship')
}

export function questionsFor(track: Track): Question[] {
  if (track === 'readiness') return READINESS_QUESTIONS
  if (track === 'premarital') {
    return COUPLE_QUESTIONS.map(q => ({ ...q, text: toPremarital(q.text), low: toPremarital(q.low), high: toPremarital(q.high) }))
  }
  return COUPLE_QUESTIONS
}

export const TRACK_CHOICES: Array<{ value: Track; title: string; sub: string }> = [
  { value: 'married', title: 'I’m married', sub: 'You and your spouse each take it, then compare.' },
  { value: 'premarital', title: 'I’m engaged or seriously dating', sub: 'Look at the relationship before you commit to it.' },
  { value: 'readiness', title: 'I’m single and preparing', sub: 'See how you show up in close relationships today.' },
]

/** First sentence as a headline, the rest as body. */
export function splitFirstSentence(text: string): { head: string; rest: string } {
  const m = text.match(/^(.+?[.!?])(\s+|$)/)
  if (!m) return { head: text, rest: '' }
  return { head: m[1], rest: text.slice(m[0].length) }
}

