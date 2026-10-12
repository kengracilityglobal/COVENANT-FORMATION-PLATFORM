'use client'
// app/(public)/taster/page.tsx
// 6-question formation diagnostic — no auth required, no DB writes.
// Shows a full result for 2 of the eight pillars, then gates one more
// pillar behind registration. Questions are drawn verbatim from the real
// married-track question bank (supabase/migrations/003_questions_seed_married.sql)
// so the teaser reflects the actual assessment rather than invented content.

import { useState } from 'react'
import Link from 'next/link'
import { scoreFrequency } from '@/lib/scoring/aggregate'

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

type Question = { id: string; pillar: string; text: string; low: string; high: string; invert?: boolean }

// 2 questions each for 3 of the 8 pillars — real frequency statements from
// the married-track question bank, codes CF_FR_01/CF_FR_02 analogue,
// TC_FR_01/TC_FR_02, CR_FR_01/CR_FR_02.
const QUESTIONS: Question[] = [
  {
    id: 'cf1',
    pillar: 'covenant_faithfulness',
    text: 'When keeping a promise to my spouse becomes inconvenient, I keep it anyway.',
    low: 'Rarely — convenience usually wins',
    high: 'Always — the promise simply holds',
  },
  {
    id: 'cf2',
    pillar: 'covenant_faithfulness',
    text: 'My deepest values and my spouse’s actually line up — not just our calendars.',
    low: 'We have never really talked it through',
    high: 'Yes, and we have tested it, not just assumed it',
  },
  {
    id: 'tc1',
    pillar: 'truthful_communication',
    text: 'What I tell my spouse matches what I actually think and feel, even when the truth is uncomfortable.',
    low: 'I often soften or withhold it',
    high: 'I say the true thing, even at real cost',
  },
  {
    id: 'tc2',
    pillar: 'truthful_communication',
    text: 'I bring up problems in our marriage directly with my spouse rather than venting to someone else first.',
    low: 'Problems usually go to someone else first',
    high: 'My spouse is reliably the first person I bring it to',
  },
  {
    id: 'cr1',
    pillar: 'conflict_repair',
    text: 'After my spouse and I argue, we actually resolve it — not just stop talking about it.',
    low: 'We mostly settle into an unspoken truce',
    high: 'We reliably reach real repair, not just a ceasefire',
  },
  {
    id: 'cr2',
    pillar: 'conflict_repair',
    text: 'I am the one who initiates repair after a conflict at least as often as my spouse is.',
    low: 'I usually wait for my spouse to go first',
    high: 'I initiate readily, regardless of who "should"',
  },
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

function getDescriptor(score: number): string {
  if (score >= 85) return 'christformed'
  if (score >= 70) return 'rooted'
  if (score >= 50) return 'growing'
  if (score >= 30) return 'awakening'
  return 'unengaged'
}

const DESCRIPTOR_COLORS: Record<string, string> = {
  christformed: '#2C5F2E',
  rooted: '#4A7A4A',
  growing: '#B8972A',
  awakening: '#C47A1A',
  unengaged: '#8B2020',
}

const TASTER_PORTRAITS: Record<string, Record<string, { headline: string; body: string }>> = {
  covenant_faithfulness: {
    christformed: {
      headline: 'Your word to your spouse holds regardless of what it costs.',
      body: 'That is rare, and it is the foundation everything else in a marriage is built on. The question worth sitting with now is whether your spouse experiences it that reliably too — faithfulness felt by only one side of a marriage is still a gap, even when the other side is genuinely strong.',
    },
    rooted: {
      headline: 'Your faithfulness holds in most conditions, with one place it quietly bends.',
      body: 'You keep your word under ordinary pressure. The real test is the specific situation where keeping it costs something you were not expecting — that is usually where the gap actually lives, not in the general pattern.',
    },
    growing: {
      headline: 'The commitment is real. The consistency under real cost is not yet there.',
      body: 'Your answers describe a genuine intention to keep your word, and a pattern of it bending when the cost becomes real rather than hypothetical. That gap is the honest starting point — not a verdict on the marriage.',
    },
    awakening: {
      headline: 'You know what faithfulness should look like. The habit under pressure is not yet formed.',
      body: 'This is common and workable. Start smaller than feels sufficient: one specific promise, kept once, at real cost — not a general resolve to be more faithful.',
    },
    unengaged: {
      headline: 'Your answers describe promises that bend whenever keeping them is inconvenient.',
      body: 'Naming that honestly, without defending it, is the entire first step. Your Formation Guide will address this directly — it is usually not a willingness problem, it is a habit that has not been built yet.',
    },
  },
  truthful_communication: {
    christformed: {
      headline: 'What you tell your spouse is what is actually true and felt.',
      body: 'Not a managed version. Not a softened one. Watch whether that honesty has itself become something you expect credit for — that is its own subtle gap.',
    },
    rooted: {
      headline: 'You are honest with your spouse. You still edit sometimes.',
      body: 'You rarely lie outright, but you choose which true things to say and when, calibrated to avoid friction. The work is noticing the moments you are editing and asking what you are actually protecting.',
    },
    growing: {
      headline: 'You are honest when it is easy. Less so when the truth would cost something.',
      body: 'Your answers showed real transparency in low-stakes moments and something different when honesty would create real friction. That specific condition — not honesty in general — is where the work is.',
    },
    awakening: {
      headline: 'There is a real gap between what you believe about honesty and what you actually say.',
      body: 'That gap is the data, not a character verdict. The starting point is one conversation where you say the uncomfortable true thing instead of the comfortable almost-true one.',
    },
    unengaged: {
      headline: 'Your answers describe a consistent pattern of managing what your spouse hears.',
      body: 'This is common in marriages under pressure — directness starts to feel dangerous. The cost is that your spouse is responding to a version of the truth that is not fully real. Small honesty first, not a big confession.',
    },
  },
}

const GATED_PORTRAIT = 'Your answers in Conflict & Repair showed a specific pattern. The full report names what it is, what it costs the marriage, and one thing to bring to your Formation Guide. Register to complete the full assessment and unlock it.'

type Phase = 'intro' | 'questions' | 'result'

export default function TasterPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)

  function handleNext() {
    if (selected === null) return
    const q = QUESTIONS[current]
    setAnswers(prev => ({ ...prev, [q.id]: scoreFrequency(selected, false) }))
    setSelected(null)
    if (current + 1 >= QUESTIONS.length) setPhase('result')
    else setCurrent(c => c + 1)
  }

  function computeScores(): Record<string, number> {
    const byPillar: Record<string, number[]> = {}
    for (const q of QUESTIONS) {
      const v = answers[q.id]
      if (v === undefined) continue
      if (!byPillar[q.pillar]) byPillar[q.pillar] = []
      byPillar[q.pillar].push(v)
    }
    const result: Record<string, number> = {}
    for (const [p, scores] of Object.entries(byPillar)) {
      result[p] = scores.reduce((a, b) => a + b, 0) / scores.length
    }
    return result
  }

  const scores = computeScores()
  const progress = ((current + 1) / QUESTIONS.length) * 100
  const q = QUESTIONS[current]

  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-2xl w-full text-center">
          <p className="pillar-number tracking-[0.4em] mb-6" style={{ color: 'var(--gold-muted)' }}>
            FORMATION DIAGNOSTIC
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)', lineHeight: '1.05' }}>
            Six questions.<br />Two pillars revealed.
          </h1>
          <p className="formation-prose text-lg mb-4 max-w-xl mx-auto" style={{ lineHeight: '1.9' }}>
            This is a free taster of the real Covenant Formation Assessment, drawn from the actual
            question bank. It covers three of the eight pillars with two questions each. When you
            finish, you will see a full formation portrait for two of them — and a locked preview
            of the third.
          </p>
          <p className="text-sm mb-12" style={{ color: 'var(--text-faint)' }}>
            No account required. Takes about 2 minutes. This is a solo preview — the real
            assessment is taken independently by each spouse, and the report that matters is the
            comparison between the two.
          </p>
          <button onClick={() => setPhase('questions')} className="btn-gold text-lg px-12 py-4">
            Begin →
          </button>
          <p className="mt-5 text-xs" style={{ color: 'var(--text-faint)' }}>
            Free · No card · No account
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const FREE_PILLARS = ['covenant_faithfulness', 'truthful_communication']
    const GATED_PILLAR = 'conflict_repair'
    const gatedScore = scores[GATED_PILLAR] ?? 50
    const gatedDescriptor = getDescriptor(gatedScore)
    const gatedColor = DESCRIPTOR_COLORS[gatedDescriptor]

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">

          <div className="text-center">
            <p className="pillar-number tracking-widest mb-3" style={{ color: 'var(--gold-muted)' }}>
              TASTER RESULTS
            </p>
            <h1 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Your formation portrait.
            </h1>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Two pillars are shown in full below. One is locked — visible in your complete report
              after registration, alongside the other five and the Perception Gap with your spouse.
            </p>
          </div>

          {FREE_PILLARS.map(pillar => {
            const score = scores[pillar] ?? 50
            const descriptor = getDescriptor(score)
            const color = DESCRIPTOR_COLORS[descriptor]
            const portrait = TASTER_PORTRAITS[pillar]?.[descriptor]
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
                    <p className="font-display text-4xl font-bold" style={{ color }}>{Math.round(score)}</p>
                    <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color }}>
                      {descriptor}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-8" style={{ background: 'var(--bg-border)' }}>
                  <div className="h-full" style={{ width: `${score}%`, background: color, opacity: 0.8 }} />
                </div>

                {portrait && (
                  <>
                    <p className="text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: 'var(--text-faint)' }}>
                      What your answers revealed
                    </p>
                    <p className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {portrait.headline}
                    </p>
                    <p className="formation-prose text-base" style={{ lineHeight: '1.9' }}>
                      {portrait.body}
                    </p>
                  </>
                )}
              </div>
            )
          })}

          {/* Gated pillar */}
          <div className="eikon-card p-8" style={{ borderTop: '2px solid var(--bg-border)' }}>
            <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
              LOCKED — CONFLICT &amp; REPAIR, PLUS 5 MORE PILLARS
            </p>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-display font-medium" style={{ color: 'var(--text-muted)' }}>
                  {PILLAR_NAMES[GATED_PILLAR]}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: gatedColor }}>
                  {gatedDescriptor}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
                <div className="h-full blur-sm" style={{ width: `${gatedScore}%`, background: gatedColor, opacity: 0.6 }} />
              </div>
              <p className="text-xs mt-1 line-clamp-2 blur-sm select-none" style={{ color: 'var(--text-faint)' }}>
                {GATED_PORTRAIT.slice(0, 80)}…
              </p>
            </div>

            <div className="gold-rule mb-8" />

            <p className="font-display text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              The full assessment covers all eight pillars — taken independently by each spouse.
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Your complete report includes a full formation portrait for every pillar, and — once
              your spouse has also finished — the Perception Gap: a side-by-side look at where your
              two sets of answers agree, and where they don't. The assessment is free to take.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register?from=taster" className="btn-gold text-base px-8 py-3">
                Complete the Full Assessment →
              </Link>
              <Link href="/" className="btn-ghost">
                Learn more about Covenant Formation
              </Link>
            </div>
          </div>

        </div>
      </div>
    )
  }

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
