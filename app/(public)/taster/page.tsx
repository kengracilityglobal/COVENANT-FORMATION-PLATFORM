'use client'
// app/(public)/taster/page.tsx
// 6-question formation taster — no auth required, no DB writes.
// Shows a full result for 2 of the 3 areas it asks about and teases the third,
// then points at the full assessment and a public sample report.
//
// Written for three situations (married / engaged or dating / single and
// preparing). The result is built by the same offline report engine as the full
// report (lib/report/offline-portrait.ts), so the taster is a genuine slice of
// the real thing: a portrait, the person's own answers shown back to them, and
// one thing to do this week. Married and premarital questions are drawn from
// the married-track bank (supabase/migrations/003); readiness questions from
// the readiness bank (006).

import { useState } from 'react'
import Link from 'next/link'
import { scoreFrequency, descriptorFromScore, type CorePillar } from '@/lib/scoring/aggregate'
import { buildPillarPortrait, type QuestionLite, type ResponseLite } from '@/lib/report/offline-portrait'
import { questionsFor, splitFirstSentence, TRACK_CHOICES, type Track } from '@/lib/taster'

// Same five labelled choices, and the same 1-5 -> 0/25/50/75/100 mapping, as the
// real assessment (app/(participant)/assessment/page.tsx + lib/scoring/aggregate.ts),
// so a taster result and the full assessment agree. No slider: a 0-100 drag implies
// precision nobody has about "I keep promises when it's inconvenient", and a default
// position records an answer the person never gave.
const SCALE_LABELS = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Almost always' },
]

const PILLAR_NAMES: Record<string, string> = {
  covenant_faithfulness: 'Covenant Faithfulness',
  truthful_communication: 'Truthful Communication',
  conflict_repair: 'Conflict & Repair',
}

const PILLAR_ANCHOR: Record<string, string> = {
  covenant_faithfulness: 'Chesed (Hebrew)',
  truthful_communication: 'Aletheia (Greek)',
  conflict_repair: 'Eirene (Greek)',
}

const DESCRIPTOR_COLORS: Record<string, string> = {
  christformed: '#2C5F2E',
  rooted: '#4A7A4A',
  growing: '#B8972A',
  awakening: '#C47A1A',
  unengaged: '#8B2020',
}

const FREE_PILLARS: CorePillar[] = ['covenant_faithfulness', 'truthful_communication']
const GATED_PILLAR: CorePillar = 'conflict_repair'

type Phase = 'intro' | 'questions' | 'result'

export default function TasterPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [track, setTrack] = useState<Track | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})   // question id -> 1..5
  const [selected, setSelected] = useState<number | null>(null)

  const QUESTIONS = questionsFor(track ?? 'married')
  const isReadiness = track === 'readiness'
  const sampleHref = isReadiness ? '/sample-report?track=readiness' : '/sample-report'

  function handleNext() {
    if (selected === null) return
    const q = QUESTIONS[current]
    setAnswers(prev => ({ ...prev, [q.id]: selected }))
    setSelected(null)
    if (current + 1 >= QUESTIONS.length) setPhase('result')
    else setCurrent(c => c + 1)
  }

  // 0-100 score per pillar, the same mapping the real assessment uses.
  function pillarScore(pillar: CorePillar): number {
    const vals = QUESTIONS.filter(q => q.pillar === pillar && answers[q.id] !== undefined).map(q => scoreFrequency(answers[q.id], false))
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50
  }

  function portraitFor(pillar: CorePillar) {
    const score = pillarScore(pillar)
    const questions: QuestionLite[] = QUESTIONS.map(q => ({ id: q.id, pillar: q.pillar, question_type: 'frequency', question_text: q.text }))
    const responses: ResponseLite[] = QUESTIONS.filter(q => answers[q.id] !== undefined).map(q => ({
      question_id: q.id, response_scale: answers[q.id], computed_score: scoreFrequency(answers[q.id], false),
    }))
    return {
      score,
      descriptor: descriptorFromScore(score),
      out: buildPillarPortrait({ pillar, track: track ?? 'married', score, descriptor: descriptorFromScore(score), responses, questions }),
    }
  }

  // ── Intro ────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-2xl w-full text-center">
          <p className="pillar-number tracking-[0.4em] mb-6" style={{ color: 'var(--gold-muted)' }}>
            FORMATION DIAGNOSTIC
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)', lineHeight: '1.05' }}>
            Six questions.<br />Two areas revealed.
          </h1>
          <p className="formation-prose text-lg mb-8 max-w-xl mx-auto" style={{ lineHeight: '1.9' }}>
            A free taste of the real Covenant Formation assessment, drawn from its actual questions.
            You will answer six, about three of the eight areas. At the end you get a full written
            portrait for two of them, your own answers shown back to you, and one thing to try this
            week. The third is previewed, and the rest is in the full report.
          </p>

          <p className="text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--text-faint)' }}>
            Which of these is closest to you?
          </p>
          <div role="radiogroup" aria-label="Your situation" className="space-y-2 mb-10 text-left">
            {TRACK_CHOICES.map(c => {
              const on = track === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTrack(c.value)}
                  className="w-full p-4 transition-all"
                  style={{
                    background: on ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                    border: on ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <span className="block font-display text-base font-semibold" style={{ color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.title}</span>
                  <span className="block text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{c.sub}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => track && setPhase('questions')}
            disabled={!track}
            className="btn-gold text-lg px-12 py-4"
            style={!track ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            Begin →
          </button>
          <p className="mt-5 text-xs" style={{ color: 'var(--text-faint)' }}>
            Free · No card · No account · About 2 minutes
          </p>
          <p className="mt-3 text-xs">
            <Link href={sampleHref} style={{ color: 'var(--gold-muted)', textDecoration: 'underline' }}>
              Or look at a sample full report first
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Result ───────────────────────────────────────────────────────────
  if (phase === 'result') {
    const gated = portraitFor(GATED_PILLAR)
    const gatedColor = DESCRIPTOR_COLORS[gated.descriptor]
    const gatedHead = splitFirstSentence(gated.out.portrait).head

    const fullReportAdds = isReadiness
      ? [
          'All eight areas, each with its own portrait and what it predicts for a future marriage',
          'Your own answers shown back to you in every area, and where your words and your ratings disagree',
          'One specific thing to do this week in each area, and a first-month plan in priority order',
          'Patterns across areas that no single question can show',
        ]
      : [
          'All eight areas, each with its own portrait, not just three',
          'Your own answers shown back to you in every area, and where your words and your ratings disagree',
          'One specific thing to do this week in each area, and a first-month plan in priority order',
          `The comparison between you and your ${track === 'premarital' ? 'partner' : 'spouse'}: where you see it the same way, and where you do not`,
        ]

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">

          <div className="text-center">
            <p className="pillar-number tracking-widest mb-3" style={{ color: 'var(--gold-muted)' }}>
              TASTER RESULTS
            </p>
            <h1 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Your portrait, so far.
            </h1>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Two areas are shown in full below, with what your own answers said. A third is
              previewed. The full report covers all eight.
            </p>
          </div>

          {FREE_PILLARS.map(pillar => {
            const { score, descriptor, out } = portraitFor(pillar)
            const color = DESCRIPTOR_COLORS[descriptor]
            const { head, rest } = splitFirstSentence(out.portrait)
            const ev = out.evidence
            const contrast = [
              ev.holds ? { label: ev.holds.score >= 60 ? 'Where this holds' : 'Your strongest answer here', statement: ev.holds.statement, answerLabel: ev.holds.answerLabel } : null,
              ev.slips ? { label: ev.slips.score >= 70 ? 'Where there is most room to grow' : 'Where it slips', statement: ev.slips.statement, answerLabel: ev.slips.answerLabel } : null,
            ].filter((r): r is { label: string; statement: string; answerLabel: string | null } => r !== null)
            // Two answers in the same place: show both as they are, rather than invent a contrast.
            const rows = contrast.length > 0 ? contrast : QUESTIONS
              .filter(qq => qq.pillar === pillar && answers[qq.id] !== undefined)
              .map(qq => ({ label: '', statement: qq.text, answerLabel: SCALE_LABELS[answers[qq.id] - 1]?.label ?? null }))

            return (
              <div key={pillar} className="eikon-card p-8" style={{ borderTop: `2px solid ${color}` }}>
                <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                  <div>
                    <p className="pillar-number text-xs mb-1" style={{ color: 'var(--gold-muted)' }}>
                      {PILLAR_NAMES[pillar].toUpperCase()} · {PILLAR_ANCHOR[pillar].toUpperCase()}
                    </p>
                    <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {PILLAR_NAMES[pillar]}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-4xl font-bold" style={{ color }}>{score}</p>
                    <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color }}>
                      {descriptor}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-8" style={{ background: 'var(--bg-border)' }}>
                  <div className="h-full" style={{ width: `${score}%`, background: color, opacity: 0.8 }} />
                </div>

                <p className="text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--text-faint)' }}>
                  What your answers revealed
                </p>
                <p className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {head}
                </p>
                {rest && (
                  <p className="formation-prose text-base mb-6" style={{ lineHeight: '1.9' }}>
                    {rest}
                  </p>
                )}

                <div className="mb-6 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--text-faint)' }}>
                      What usually sits underneath
                    </p>
                    <p className="formation-prose text-base" style={{ lineHeight: '1.9' }}>{out.depth.underneath}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--text-faint)' }}>
                      What the next season looks like
                    </p>
                    <p className="formation-prose text-base" style={{ lineHeight: '1.9' }}>{out.depth.ahead}</p>
                  </div>
                </div>

                {rows.length > 0 && (
                  <div className="mb-6 px-5 pt-4 pb-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: 'var(--text-faint)' }}>
                      From your own answers
                    </p>
                    {rows.map(r => (
                      <div key={r.statement} className="py-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
                        {r.label && <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--gold-muted)' }}>{r.label}</p>}
                        <p className="text-sm italic mb-1" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>&ldquo;{r.statement}&rdquo;</p>
                        {r.answerLabel && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You answered <strong>{r.answerLabel}</strong>.</p>
                        )}
                      </div>
                    ))}
                    {ev.consistent && (
                      <p className="text-xs italic py-3" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--bg-border)', lineHeight: '1.7' }}>
                        Your two answers here point the same way, which makes the picture above easier to trust.
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4" style={{ background: 'rgba(74,122,74,0.06)', borderLeft: '3px solid #4A7A4A' }}>
                  <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#4A7A4A' }}>
                    {isReadiness ? 'One thing to do this week' : 'Together this week'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.75' }}>{out.action}</p>
                </div>
              </div>
            )
          })}

          {/* Preview of the third area, then the way in */}
          <div className="eikon-card p-8" style={{ borderTop: '2px solid var(--bg-border)' }}>
            <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
              PREVIEW — {PILLAR_NAMES[GATED_PILLAR].toUpperCase()}, PLUS 5 MORE AREAS IN THE FULL REPORT
            </p>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-display font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {PILLAR_NAMES[GATED_PILLAR]}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: gatedColor }}>
                  {gated.descriptor}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: 'var(--bg-border)' }}>
                <div className="h-full" style={{ width: `${gated.score}%`, background: gatedColor, opacity: 0.8 }} />
              </div>
              <p className="font-display text-lg font-semibold mb-3" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {gatedHead}
              </p>
              <div aria-hidden="true" className="space-y-2 select-none" style={{ filter: 'blur(5px)' }}>
                <div className="h-3 rounded" style={{ background: 'var(--bg-border)', width: '100%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--bg-border)', width: '92%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--bg-border)', width: '78%' }} />
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
                The rest of this area, what it costs, and what to do about it are in the full report.
              </p>
            </div>

            <div className="gold-rule mb-8" />

            <p className="font-display text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              This was six questions. The full assessment goes much further.
            </p>
            <ul className="space-y-2 mb-8">
              {fullReportAdds.map(t => (
                <li key={t} className="text-sm flex gap-3" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  <span style={{ color: 'var(--gold)' }}>›</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              {isReadiness
                ? 'The readiness assessment is 48 questions and takes about 15 to 18 minutes. It is free to take, and no card is needed.'
                : 'The full assessment is 66 questions and takes about 25 to 30 minutes. It is free to take, and no card is needed. Each of you answers on your own account, so neither of you is performing for the other.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register?from=taster" className="btn-gold text-base px-8 py-3">
                Complete the Full Assessment →
              </Link>
              <Link href={sampleHref} className="btn-ghost">
                See a sample full report
              </Link>
            </div>
            <p className="mt-6 text-xs">
              <Link href="/" style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}>
                Learn more about Covenant Formation
              </Link>
            </p>
          </div>

        </div>
      </div>
    )
  }

  // ── Questions ────────────────────────────────────────────────────────
  const q = QUESTIONS[current]
  const progress = ((current + 1) / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <p className="pillar-number text-xs" style={{ color: 'var(--gold-muted)' }}>
              {PILLAR_NAMES[q.pillar]?.toUpperCase() ?? q.pillar.toUpperCase()} · QUESTION {current + 1} OF {QUESTIONS.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {Math.round(progress)}%
            </p>
          </div>
          <div className="h-px w-full" style={{ background: 'var(--bg-border)' }}>
            <div
              className="h-px transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--gold)', opacity: 0.7 }}
            />
          </div>
        </div>

        <div className="eikon-card p-8">
          <p className="formation-prose text-lg mb-8" style={{ lineHeight: '1.85', color: 'var(--text-secondary)' }}>
            {q.text}
          </p>

          <div className="flex justify-between gap-6 text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            <span>{q.low}</span>
            <span className="text-right">{q.high}</span>
          </div>
          <div role="radiogroup" aria-label="How true is this for you?" className="space-y-2 mb-8">
            {SCALE_LABELS.map(option => {
              const on = selected === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(option.value)}
                  className="w-full flex items-center gap-4 p-3.5 text-left transition-all"
                  style={{
                    background: on ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                    border: on ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-display text-sm font-bold transition-all"
                    style={{
                      background: on ? 'var(--gold)' : 'transparent',
                      color: on ? 'var(--bg-primary)' : 'var(--text-muted)',
                      border: on ? 'none' : '1px solid var(--bg-border)',
                      borderRadius: '2px',
                    }}
                  >
                    {option.value}
                  </span>
                  <span style={{ color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{option.label}</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={handleNext}
            disabled={selected === null}
            className="btn-gold w-full py-3"
            style={selected === null ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            Next →
          </button>
        </div>

      </div>
    </div>
  )
}
