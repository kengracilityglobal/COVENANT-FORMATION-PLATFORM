'use client'
export const dynamic = 'force-dynamic'
import type { Assessment } from '@/types'
import { useState, useEffect, use } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Report page — forked from EIKON's, substantially simplified.
//
// EIKON's version duplicated the entire narrative-generation layer in this
// client component (per-pillar portrait text, priority-stack rationale,
// integrity-flag narratives, a subscription paywall gate, a Fruit-of-the-
// Spirit reflection fetch, and a first-disciplines preview) so it could
// render the same content twice — once in the browser for display, once via
// client-side html2canvas capture for PDF export.
//
// This build drops that duplication: the single source of truth for the
// report's content is lib/report/builder.ts's buildReportHTML(), served
// fresh on every request by /api/report/[assessmentId]/html and shown here
// in an iframe. "Open / Print as PDF" opens that same URL in a new tab,
// where the builder's own @page/@media print CSS makes the browser's
// native print-to-PDF produce a clean result — no client PDF library, no
// DOM capture, no duplicated narrative content to keep in sync. Payments,
// subscriptions, and the Fruit-of-the-Spirit reflection layer are out of
// scope for this v1 (see docs/VERIFICATION.md) and are not referenced here.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>
}) {
  const { assessmentId } = use(params)

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const [showOrientation, setShowOrientation] = useState(true)

  // Participant review step — do the scores ring true?
  const [ackSubmitted, setAckSubmitted] = useState(false)
  const [ackSubmitting, setAckSubmitting] = useState(false)
  const [overallResonance, setOverallResonance] = useState<'yes' | 'somewhat' | 'no' | null>(null)
  const [participantNote, setParticipantNote] = useState('')

  const hasScores = Boolean(assessment?.pillar_scores)

  async function loadStatus() {
    const res = await fetch(`/api/assessment/${assessmentId}/status`)
    const data = await res.json()
    setAssessment(data)
    return data
  }

  useEffect(() => {
    async function load() {
      const statusData = await loadStatus()
      if (statusData?.participant_acknowledgement) setAckSubmitted(true)
      setLoading(false)
      if (!statusData?.pillar_scores) {
        setPolling(true)
        setPollStartedAt(Date.now())
      }
    }
    load()
  }, [assessmentId])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const data = await loadStatus()
      if (data.pillar_scores) {
        setPolling(false)
      } else if (pollStartedAt && Date.now() - pollStartedAt > 45_000) {
        setPollTimedOut(true)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling, assessmentId, pollStartedAt])

  async function retryCompletion() {
    setPollTimedOut(false)
    setPollStartedAt(Date.now())
    setPolling(true)
    try {
      await fetch(`/api/assessment/${assessmentId}/complete`, { method: 'POST' })
    } catch { /* the poll loop above will keep checking regardless */ }
  }

  async function submitAcknowledgement() {
    if (!overallResonance) return
    setAckSubmitting(true)
    try {
      await fetch(`/api/assessment/${assessmentId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_resonance: overallResonance,
          pillar_resonance: {},
          participant_note: participantNote,
        }),
      })
      setAckSubmitted(true)
    } finally {
      setAckSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <p className="formation-prose">Loading your report…</p>
    </div>
  )

  if (!hasScores || polling) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      {pollTimedOut ? (
        <>
          <div className="font-display text-5xl mb-8" style={{ color: 'var(--gold)', opacity: 0.4 }}>⟳</div>
          <h1 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            This is taking longer than expected
          </h1>
          <p className="formation-prose mb-4">
            This usually happens because of a slow or interrupted connection while your assessment was
            being scored — not because anything about your answers was a problem. Your responses are saved.
          </p>
          <p className="formation-prose mb-8">
            Tap below to pick up where this left off. If you're on a weak signal, it may take another try or two.
          </p>
          <button onClick={retryCompletion} className="btn-gold px-10 py-4">
            Try again
          </button>
        </>
      ) : (
        <>
          <div className="font-display text-5xl mb-8" style={{ color: 'var(--gold)', opacity: 0.6 }}>✦</div>
          <h1 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Your report is being prepared
          </h1>
          <p className="formation-prose mb-8">
            Scoring your responses now. This usually takes under a minute — this page will update automatically.
          </p>
          <div className="flex justify-center">
            <div className="h-1 w-48 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
              <div className="h-full rounded-full" style={{ width: '60%', background: 'var(--gold)' }} />
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (showOrientation) return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center mb-12">
        <p className="pillar-number tracking-widest mb-4" style={{ color: 'var(--gold-muted)' }}>
          YOUR REPORT IS READY
        </p>
        <h1 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          This is not a summary. It is a mirror.
        </h1>
      </div>

      <div className="eikon-card p-8 space-y-5 mb-8">
        <p className="formation-prose text-lg">
          The assessment you completed was designed to find the gap between what you believe about
          your marriage and what your actual answers reveal about it. What follows is a direct account
          of what it found — your own portrait, and, once your spouse has also finished, a side-by-side
          look at where your two answers agree and where they don't.
        </p>
        <p className="formation-prose">
          Some of it will confirm what you already suspected. Some of it will name something you
          haven't said out loud. Receive both with the same seriousness.
        </p>
      </div>

      <button onClick={() => setShowOrientation(false)} className="btn-gold w-full justify-center py-4">
        Read My Report →
      </button>
    </div>
  )

  const reportUrl = `/api/report/${assessmentId}/html`

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Your Covenant Formation Report
        </h1>
        <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          Open / Print as PDF ↗
        </a>
      </div>

      <div className="eikon-card overflow-hidden mb-10" style={{ padding: 0 }}>
        <iframe
          src={reportUrl}
          title="Covenant Formation Report"
          style={{ width: '100%', height: '85vh', border: 'none', background: '#0D0B08' }}
        />
      </div>

      {!ackSubmitted ? (
        <div className="eikon-card p-8 space-y-5">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--gold)' }}>
            Before you go — does this ring true?
          </h2>
          <p className="formation-prose text-sm">
            Your honest reaction to these results is itself useful data for your Formation Guide.
          </p>
          <div className="flex gap-3 flex-wrap">
            {(['yes', 'somewhat', 'no'] as const).map(v => (
              <button
                key={v}
                onClick={() => setOverallResonance(v)}
                className="px-5 py-2.5 text-sm font-display font-semibold transition-all"
                style={{
                  background: overallResonance === v ? 'rgba(184,151,42,0.15)' : 'var(--bg-elevated)',
                  border: overallResonance === v ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                  color: overallResonance === v ? 'var(--gold)' : 'var(--text-muted)',
                  borderRadius: '2px',
                }}
              >
                {v === 'yes' ? 'Yes, this is accurate' : v === 'somewhat' ? 'Somewhat' : 'Not really'}
              </button>
            ))}
          </div>
          <textarea
            value={participantNote}
            onChange={e => setParticipantNote(e.target.value)}
            className="eikon-input eikon-textarea"
            placeholder="Anything that surprised you, or that you'd want your Guide to know before your first session? (optional)"
            rows={3}
          />
          <button
            onClick={submitAcknowledgement}
            disabled={!overallResonance || ackSubmitting}
            className="btn-gold"
            style={{ opacity: !overallResonance || ackSubmitting ? 0.5 : 1 }}
          >
            {ackSubmitting ? 'Saving...' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className="eikon-card p-6 text-center">
          <p className="formation-prose" style={{ color: 'var(--text-muted)' }}>
            Thank you. Your Formation Guide will read this report and reach out once you're placed.
          </p>
        </div>
      )}
    </div>
  )
}
