'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types'
import { countWords } from '@/lib/utils'

interface AssessmentState {
  assessmentId: string | null
  question: Question | null
  progress: number
  totalQuestions: number
  startTime: number
  loading: boolean
  submitting: boolean
  error: string | null
  completed: boolean
}

const MIN_WORDS_SCENARIO = 50
const MIN_WORDS_DISCLOSURE = 100

// Messages shown when the assessment crosses into a new domain or hits a milestone.
// These are the moments where the system acknowledges the participant.
const PILLAR_ENTRY_MESSAGES: Record<string, { heading: string; body: string }> = {
  humility: {
    heading: 'The assessment is now entering Humility.',
    body: 'This section will ask about how you respond when your contribution goes unacknowledged, when someone is elevated above you, and what your instincts do when status is at stake. Answer what actually happens — not what you believe should happen.',
  },
  integrity: {
    heading: 'Moving into Integrity.',
    body: 'This section looks at the gap between how you present yourself and what is fully true. The questions are designed to reach past managed responses. Answer what is actually true — not what reads best.',
  },
  compassion: {
    heading: 'Entering Compassion.',
    body: 'This section measures not just whether you care — but who you care about, at what cost, and what happens to your compassion when it is inconvenient or distant. Be honest about the categories that produce less response in you.',
  },
  courage: {
    heading: 'Now entering Courage.',
    body: 'Parresia — free speech. Not boldness as personality. These questions probe whether you say what is true when there is a real cost for saying it. Pay attention to how your answers shift when the person in the scenario has authority over you.',
  },
  purity: {
    heading: 'Entering Purity.',
    body: 'This section is not about failure. It is about the interior life — what you love, what still has pull, whether your purity is managed by structures or formed in desire. Answer as honestly as you can. This section carries pastoral weight.',
  },
  servanthood: {
    heading: 'Moving into Servanthood.',
    body: 'The questions here are calibrated around one specific signal: whether you serve the same way when no one is watching. Notice your instincts in scenarios where the service is unglamorous, unseen, and costs you something real.',
  },
  wisdom: {
    heading: 'Entering Wisdom.',
    body: 'The final domain. These questions test not how much you know but how you hold situations before deciding — whether you stay in complexity or resolve it prematurely. Watch how quickly your judgment arrives under the pressure of the scenarios.',
  },
  cross_pillar: {
    heading: 'Cross-pillar questions.',
    body: 'These final questions do not belong to a single domain. They look at how your character holds together — where the pillars reinforce each other and where they create internal tension. Answer slowly.',
  },
}

const MILESTONE_MESSAGES: Record<number, string> = {
  25: 'You are a quarter of the way through. The system has now received your initial responses across the first two character domains. Continue at the same pace — honesty compounds.',
  50: 'Halfway. The scoring engine now has enough data to detect the primary patterns in your profile. What follows deepens the picture. The quality of what remains depends entirely on the quality of what you give it.',
  75: 'Three quarters complete. You have now answered questions in five of the seven character domains. The final two sections often produce the most significant findings. Stay with it.',
}

export default function AssessmentPage() {
  const router = useRouter()
  const startTimeRef = useRef<number>(Date.now())

  const [state, setState] = useState<AssessmentState>({
    assessmentId: null,
    question: null,
    progress: 0,
    totalQuestions: 100,
    startTime: Date.now(),
    loading: true,
    submitting: false,
    error: null,
    completed: false,
  })

  const [textResponse, setTextResponse] = useState('')
  const [scaleResponse, setScaleResponse] = useState<number | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | null>(null)

  // Pillar transition + milestone acknowledgement state
  const [pillarTransition, setPillarTransition] = useState<{ heading: string; body: string } | null>(null)
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null)
  const [lastSeenPillar, setLastSeenPillar] = useState<string | null>(null)
  const [acknowledgedMilestones, setAcknowledgedMilestones] = useState<Set<number>>(new Set())

  // Auto-save text response
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (textResponse) {
      setSaveIndicator('saving')
      saveTimeoutRef.current = setTimeout(() => setSaveIndicator('saved'), 800)
    }
    setWordCount(countWords(textResponse))
  }, [textResponse])

  // Start or restore assessment
  useEffect(() => {
    async function init() {
      const res = await fetch('/api/assessment/start', { method: 'POST' })
      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: 'Could not start assessment. Please try again.' }))
        return
      }
      const { assessment_id, question, progress_percentage, total_questions } = await res.json()
      setState(s => ({
        ...s,
        assessmentId: assessment_id,
        question,
        progress: progress_percentage || 0,
        totalQuestions: total_questions || 100,
        loading: false,
      }))
      // Seed with the first question's pillar so the first real transition fires correctly
      if (question?.pillar) setLastSeenPillar(question.pillar)
      startTimeRef.current = Date.now()
    }
    init()
  }, [])

  const handleSubmitResponse = useCallback(async () => {
    if (!state.assessmentId || !state.question) return

    const isTextQuestion = ['scenario', 'reflective_disclosure', 'extended_module', 'cross_pillar'].includes(state.question.question_type)
    const isScaleQuestion = state.question.question_type === 'frequency'

    if (isTextQuestion && !textResponse.trim()) {
      setState(s => ({ ...s, error: 'Please enter a response before continuing.' }))
      return
    }
    if (isScaleQuestion && scaleResponse === null) {
      setState(s => ({ ...s, error: 'Please select a response before continuing.' }))
      return
    }

    const responseTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000)

    setState(s => ({ ...s, submitting: true, error: null }))

    const res = await fetch(`/api/assessment/${state.assessmentId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: state.question.id,
        response_text: isTextQuestion ? textResponse : null,
        response_scale: isScaleQuestion ? scaleResponse : null,
        response_time_seconds: responseTimeSec,
      }),
    })

    if (!res.ok) {
      setState(s => ({ ...s, submitting: false, error: 'Could not save response. Please try again.' }))
      return
    }

    const data = await res.json()

    if (data.completed) {
      setState(s => ({ ...s, submitting: true, completed: true }))
      await fetch(`/api/assessment/${state.assessmentId}/complete`, { method: 'POST' })
      router.push(`/report/${state.assessmentId}`)
      return
    }

    setTextResponse('')
    setScaleResponse(null)
    setSaveIndicator(null)
    startTimeRef.current = Date.now()

    const nextQuestion = data.question
    const nextProgress = data.progress_percentage
    const nextPillar = nextQuestion?.pillar

    // Check for pillar transition
    if (nextPillar && nextPillar !== lastSeenPillar && lastSeenPillar !== null) {
      const msg = PILLAR_ENTRY_MESSAGES[nextPillar]
      if (msg) setPillarTransition(msg)
    }
    setLastSeenPillar(nextPillar ?? lastSeenPillar)

    // Check for progress milestones (25, 50, 75)
    const milestone = [25, 50, 75].find(
      m => nextProgress >= m && state.progress < m && !acknowledgedMilestones.has(m)
    )
    if (milestone) {
      setMilestoneMessage(MILESTONE_MESSAGES[milestone])
      setAcknowledgedMilestones(prev => new Set([...prev, milestone]))
    }

    setState(s => ({
      ...s,
      question: nextQuestion,
      progress: nextProgress,
      submitting: false,
    }))
  }, [state.assessmentId, state.question, state.progress, textResponse, scaleResponse, router, lastSeenPillar, acknowledgedMilestones])

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="font-display text-4xl mb-4" style={{ color: 'var(--gold)' }}>✦</div>
          <p className="formation-prose">Preparing your assessment...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-sm mb-4" style={{ color: '#D47070' }}>{state.error}</p>
        <button onClick={() => setState(s => ({ ...s, error: null }))} className="btn-ghost">
          Try again
        </button>
      </div>
    )
  }

  // ── Pillar transition screen ──────────────────────────────────────────────
  // Shown once when the assessment enters a new character domain.
  // Prepares the participant for what the domain is actually measuring.
  if (pillarTransition) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="text-center mb-10">
          <div className="font-display text-3xl mb-6" style={{ color: 'var(--gold)', opacity: 0.6 }}>✦</div>
          <p className="pillar-number tracking-[0.3em] mb-5" style={{ color: 'var(--gold-muted)' }}>
            DOMAIN TRANSITION
          </p>
          <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)', lineHeight: '1.2' }}>
            {pillarTransition.heading}
          </h2>
          <p className="formation-prose text-base max-w-lg mx-auto" style={{ lineHeight: '1.9' }}>
            {pillarTransition.body}
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => setPillarTransition(null)}
            className="btn-gold px-12 py-3"
          >
            Continue →
          </button>
        </div>
        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-faint)' }}>
          {Math.round(state.progress)}% complete
        </p>
      </div>
    )
  }

  // ── Progress milestone screen ─────────────────────────────────────────────
  // Shown at 25%, 50%, and 75%. Acknowledges the participant without flattery.
  if (milestoneMessage) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="text-center mb-10">
          <p className="pillar-number tracking-[0.3em] mb-5" style={{ color: 'var(--gold-muted)' }}>
            {Math.round(state.progress)}% COMPLETE
          </p>
          <div className="h-px w-full mb-8" style={{ background: 'var(--bg-border)' }}>
            <div
              className="h-px"
              style={{ width: `${state.progress}%`, background: 'var(--gold)', opacity: 0.6 }}
            />
          </div>
          <p className="formation-prose text-base max-w-lg mx-auto" style={{ lineHeight: '1.9' }}>
            {milestoneMessage}
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => setMilestoneMessage(null)}
            className="btn-gold px-12 py-3"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  if (!state.question) return null

  const isTextQuestion = ['scenario', 'reflective_disclosure', 'extended_module', 'cross_pillar'].includes(state.question.question_type)
  const isScaleQuestion = state.question.question_type === 'frequency'
  const minWords = state.question.question_type === 'reflective_disclosure' ? MIN_WORDS_DISCLOSURE : MIN_WORDS_SCENARIO
  const wordsMet = !isTextQuestion || wordCount >= minWords

  const SCALE_LABELS = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'Almost Always' },
  ]

  const pillarLabel = state.question.pillar.charAt(0).toUpperCase() + state.question.pillar.slice(1)

  return (
    <div className="max-w-3xl mx-auto py-8">

      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="pillar-number text-xs" style={{ color: 'var(--gold-muted)' }}>
              {pillarLabel.toUpperCase()} PILLAR
            </span>
            <span style={{ color: 'var(--bg-border)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {state.question.question_type.replace('_', ' ')}
            </span>
          </div>
          <span className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>
            {Math.round(state.progress)}% complete
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${state.progress}%`,
              background: 'linear-gradient(to right, var(--gold), var(--gold-light))',
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="eikon-card p-10 mb-6">

        {/* Question type badge */}
        <div className="mb-6">
          <span
            className="text-xs pillar-number px-3 py-1"
            style={{
              border: '1px solid var(--bg-border)',
              color: 'var(--text-faint)',
              borderRadius: '2px',
            }}
          >
            {isTextQuestion ? 'WRITTEN RESPONSE' : 'FREQUENCY SCALE'}
          </span>
        </div>

        {/* Question text */}
        <p
          className="font-display text-xl leading-relaxed mb-8"
          style={{ color: 'var(--text-primary)', fontWeight: 500 }}
        >
          {state.question.question_text}
        </p>

        {/* Response area */}
        {isTextQuestion && (
          <div>
            <textarea
              value={textResponse}
              onChange={e => setTextResponse(e.target.value)}
              className="eikon-input eikon-textarea w-full"
              rows={8}
              placeholder={
                state.question.question_type === 'reflective_disclosure'
                  ? 'Take your time. Be specific. This is between you and God — and the formation process that serves Him.'
                  : 'Describe what actually happens — not what you believe should happen, but what does happen.'
              }
              style={{ minHeight: '200px' }}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: wordsMet ? 'var(--text-faint)' : 'var(--awakening)' }}>
                  {wordCount} words
                  {!wordsMet && ` · Suggested minimum: ${minWords}`}
                </span>
                {saveIndicator && (
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {saveIndicator === 'saving' ? 'Saving...' : '✓ Saved'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isScaleQuestion && (
          <div className="space-y-3">
            {SCALE_LABELS.map(option => (
              <button
                key={option.value}
                onClick={() => setScaleResponse(option.value)}
                className="w-full flex items-center gap-4 p-4 text-left transition-all"
                style={{
                  background: scaleResponse === option.value ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                  border: scaleResponse === option.value ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-display text-sm font-bold transition-all"
                  style={{
                    background: scaleResponse === option.value ? 'var(--gold)' : 'transparent',
                    color: scaleResponse === option.value ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: scaleResponse === option.value ? 'none' : '1px solid var(--bg-border)',
                    borderRadius: '2px',
                  }}
                >
                  {option.value}
                </div>
                <span
                  className="font-display"
                  style={{ color: scaleResponse === option.value ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {state.error && (
          <p className="mt-4 text-sm" style={{ color: '#D47070' }}>{state.error}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmitResponse}
          disabled={state.submitting || (!wordsMet && isTextQuestion) || (isScaleQuestion && scaleResponse === null)}
          className="btn-gold px-10"
          style={{
            opacity: (state.submitting || (!wordsMet && isTextQuestion) || (isScaleQuestion && scaleResponse === null)) ? 0.5 : 1,
          }}
        >
          {state.submitting ? 'Saving...' : 'Continue →'}
        </button>
      </div>

      {/* Pause note */}
      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
        Your progress is saved automatically. You can close this window and return at any time.
      </p>

    </div>
  )
}
