'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 'pairing',  title: 'You and Your Partner' },
  { id: 'context',  title: 'Relationship Context' },
  { id: 'season',   title: 'Current Season' },
  { id: 'orient',   title: 'Assessment Orientation' },
  { id: 'commit',   title: 'Commitment' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pairing — exactly one of these three paths is taken. 'solo' needs no
  // partner at all: no couple is created, and the track is always
  // 'readiness' (see docs/VERIFICATION.md for what that track does and
  // doesn't include).
  const [pairingMode, setPairingMode] = useState<'start' | 'join' | 'solo' | ''>('')
  const [track, setTrack] = useState<'premarital' | 'married' | ''>('')
  const [inviteCode, setInviteCode] = useState('')

  const [data, setData] = useState({
    years_together: '',
    relationship_stage: '',
    location: '',
    previous_formation: '',
    current_season: '',
  })

  function update(key: string, value: string) {
    setData(d => ({ ...d, [key]: value }))
  }

  const pairingValid =
    pairingMode === 'start' ? Boolean(track) :
    pairingMode === 'join'  ? inviteCode.trim().length >= 6 :
    pairingMode === 'solo'  ? true :
    false

  async function handleComplete() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relationship_history: data,
        ...(pairingMode === 'join' ? { invite_code: inviteCode.trim() }
          : pairingMode === 'solo' ? { track: 'readiness' }
          : { track }),
      }),
    })
    if (res.ok) {
      router.push('/assessment')
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body?.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const isLast = step === STEPS.length - 1
  const canAdvance = step === 0 ? pairingValid : true

  return (
    <div className="max-w-2xl mx-auto py-8">

      <div className="text-center mb-12">
        <p className="pillar-number tracking-widest mb-3" style={{ color: 'var(--gold-muted)' }}>
          BEFORE THE ASSESSMENT BEGINS
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          A Diagnostic for Two
        </h1>
      </div>

      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-display font-bold transition-all"
              style={{
                background: i < step ? 'var(--gold)' : i === step ? 'rgba(184,151,42,0.2)' : 'var(--bg-elevated)',
                color: i < step ? 'var(--bg-primary)' : i === step ? 'var(--gold)' : 'var(--text-faint)',
                border: i === step ? '1px solid var(--gold)' : '1px solid transparent',
              }}
            >
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px" style={{ background: i < step ? 'var(--gold)' : 'var(--bg-border)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="eikon-card p-8">
        <h2 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--gold)' }}>
          {STEPS[step].title}
        </h2>

        {step === 0 && (
          <div className="space-y-5">
            <p className="formation-prose text-sm mb-2">
              {pairingMode === 'solo'
                ? 'Not paired with anyone yet? That\'s fine — you can take a shorter, solo Readiness assessment on your own, with no partner required.'
                : 'Each of you takes this assessment on your own account — never side by side — so neither of you is answering for the other\'s benefit. Your report shows both scores and the gap between them, side by side, once you\'ve both finished.'}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPairingMode('start')}
                className="w-full text-left p-4 transition-all"
                style={{
                  background: pairingMode === 'start' ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                  border: pairingMode === 'start' ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                  borderRadius: '2px',
                }}
              >
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  I'm the first of us to start
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  You'll get an invite code afterward to share with your partner.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPairingMode('join')}
                className="w-full text-left p-4 transition-all"
                style={{
                  background: pairingMode === 'join' ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                  border: pairingMode === 'join' ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                  borderRadius: '2px',
                }}
              >
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  My partner already started
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Enter the invite code they shared with you.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPairingMode('solo')}
                className="w-full text-left p-4 transition-all"
                style={{
                  background: pairingMode === 'solo' ? 'rgba(184,151,42,0.1)' : 'var(--bg-elevated)',
                  border: pairingMode === 'solo' ? '1px solid var(--gold)' : '1px solid var(--bg-border)',
                  borderRadius: '2px',
                }}
              >
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  I'm not paired with anyone yet
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Take a shorter Readiness assessment on your own — no partner needed. You can invite a
                  partner later if things move toward marriage.
                </p>
              </button>
            </div>

            {pairingMode === 'start' && (
              <div className="pt-2">
                <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                  Where are you and your partner right now?
                </label>
                <select value={track} onChange={e => setTrack(e.target.value as any)} className="eikon-input">
                  <option value="">Select</option>
                  <option value="premarital">Preparing for marriage — not yet married</option>
                  <option value="married">Already married</option>
                </select>
              </div>
            )}

            {pairingMode === 'join' && (
              <div className="pt-2">
                <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                  Invite code from your partner
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="eikon-input"
                  placeholder="e.g. H7K2MPQ9"
                  style={{ letterSpacing: '0.15em', fontFamily: 'monospace' }}
                />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                {pairingMode === 'solo' ? 'If you\'re seeing someone, how long has that been?' : 'How long have you and your partner been together?'}
              </label>
              <select
                value={data.years_together}
                onChange={e => update('years_together', e.target.value)}
                className="eikon-input"
              >
                <option value="">Select</option>
                {pairingMode === 'solo' && <option value="not_applicable">Not currently seeing anyone</option>}
                <option value="less_than_1">Less than 1 year</option>
                <option value="1_to_3">1 to 3 years</option>
                <option value="3_to_5">3 to 5 years</option>
                <option value="5_to_10">5 to 10 years</option>
                <option value="over_10">More than 10 years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                {pairingMode === 'solo' ? 'Where are you right now?' : 'Relationship stage'}
              </label>
              <select
                value={data.relationship_stage}
                onChange={e => update('relationship_stage', e.target.value)}
                className="eikon-input"
              >
                <option value="">Select</option>
                {pairingMode === 'solo' ? (
                  <>
                    <option value="single_not_dating">Single, not currently dating</option>
                    <option value="dating">Dating, not yet discussing marriage</option>
                    <option value="dating_discerning">Dating and discerning marriage</option>
                    <option value="engaged_no_date">Engaged, no date yet</option>
                  </>
                ) : (
                  <>
                    <option value="engaged">Engaged, date set</option>
                    <option value="engaged_no_date">Engaged, no date yet</option>
                    <option value="seriously_dating">Seriously dating, considering marriage</option>
                    <option value="newly_married">Married, within the first 2 years</option>
                    <option value="married">Married, more than 2 years</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Country or region
              </label>
              <input
                type="text"
                value={data.location}
                onChange={e => update('location', e.target.value)}
                className="eikon-input"
                placeholder="e.g. Lagos, Nigeria"
              />
            </div>
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Previous marriage or relationship formation experience
              </label>
              <textarea
                value={data.previous_formation}
                onChange={e => update('previous_formation', e.target.value)}
                className="eikon-input eikon-textarea"
                placeholder="Premarital counseling, mentoring couples, retreats, prior formation programs..."
                rows={4}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="formation-prose text-sm mb-4">
              The assessment will be most useful if we understand the season you're
              currently in, as a couple.
            </p>
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Describe your current relational season honestly
              </label>
              <textarea
                value={data.current_season}
                onChange={e => update('current_season', e.target.value)}
                className="eikon-input eikon-textarea"
                placeholder="What is going well? What is difficult right now? What is uncertain? Write freely, about the relationship, not just yourself."
                rows={6}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="formation-prose space-y-4">
              {pairingMode === 'solo' ? (
                <>
                  <p>The Readiness assessment contains thirty-two questions across the same eight covenant-formation domains.</p>
                  <p>
                    It asks how you actually behave in your closest relationships right now — not
                    theory, but specific recent moments — because that is the clearest predictor of how
                    you will show up once you are married.
                  </p>
                  <p>
                    It takes about twelve to fifteen minutes. You can pause and return at any point —
                    your progress is saved automatically after each question.
                  </p>
                </>
              ) : (
                <>
                  <p>The assessment contains fifty questions across eight covenant-formation domains.</p>
                  <p>
                    You and your partner each take it on your own account, separately. Some
                    questions ask you to describe specific recent moments in your marriage
                    or relationship — not the theory of how it should go, but what actually
                    happened the last time it was tested.
                  </p>
                  <p>
                    It takes about twenty to twenty-five minutes. You can pause and return
                    at any point — your progress is saved automatically after each question.
                  </p>
                </>
              )}
            </div>
            <div className="scripture-block">
              <p>Can two walk together, except they be agreed?</p>
              <cite>Amos 3:3</cite>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              The value of this assessment is proportional to your honesty, and to your
              partner's. A managed answer produces a managed report — and hides exactly
              the gap this is designed to find.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <p className="formation-prose">
              You're about to answer questions about your actual marriage or
              relationship — not the version you'd present to others. Before you
              proceed, take a moment to bring yourself before God and make this
              declaration.
            </p>

            <div className="eikon-card-elevated p-6" style={{ border: '1px solid rgba(184,151,42,0.2)' }}>
              <p className="font-display text-lg italic leading-relaxed text-center" style={{ color: 'var(--text-secondary)' }}>
                &ldquo;Before God and the covenant I'm forming or keeping, I commit to
                complete honesty in this assessment. I will describe what is actually
                true in my relationship rather than what I believe it ought to be.&rdquo;
              </p>
            </div>

            {error && (
              <div className="p-4 text-sm rounded"
                   style={{ background: 'rgba(139,32,32,0.15)', border: '1px solid rgba(139,32,32,0.3)', color: '#D47070' }}>
                {error}
              </div>
            )}

            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              When you are ready, click below to begin.
            </p>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1">
              ← Back
            </button>
          )}
          <button
            onClick={isLast ? handleComplete : () => setStep(s => s + 1)}
            disabled={loading || !canAdvance}
            className="btn-gold flex-1 justify-center"
            style={{ opacity: (loading || !canAdvance) ? 0.5 : 1 }}
          >
            {loading ? 'Saving...' : isLast ? 'Begin the Assessment →' : 'Continue →'}
          </button>
        </div>
      </div>

    </div>
  )
}
