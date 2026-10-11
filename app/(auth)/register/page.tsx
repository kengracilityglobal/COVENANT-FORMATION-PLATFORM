'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmed) {
      setError('Please confirm your commitment to complete honesty before proceeding.')
      return
    }
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'participant' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Supabase sends a confirmation email — show the holding screen.
    // The auth/callback route will handle session creation and
    // the middleware will then route to /onboarding.
    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="auth-container">
        <Link href="/" className="flex flex-col items-center gap-2 mb-10">
          <span className="font-display font-bold tracking-[0.2em] text-3xl" style={{ color: 'var(--gold)' }}>COVENANT</span>
          <span className="text-xs tracking-[0.3em] pillar-number" style={{ color: 'var(--text-faint)' }}>KINGDOM CHARACTER FORMATION</span>
        </Link>
        <div className="eikon-card p-10 text-center">
          <div className="mb-6 text-4xl" style={{ color: 'var(--gold)' }}>✦</div>
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Confirm your email
          </h2>
          <p className="formation-prose mb-2">
            A confirmation link has been sent to
          </p>
          <p className="font-display font-semibold mb-6" style={{ color: 'var(--gold)' }}>{email}</p>
          <p className="formation-prose text-sm">
            Open the email and click the link to activate your account and begin onboarding.
            The link expires in 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <Link href="/" className="flex flex-col items-center gap-2 mb-10">
        <span className="font-display font-bold tracking-[0.2em] text-3xl" style={{ color: 'var(--gold)' }}>COVENANT</span>
        <span className="text-xs tracking-[0.3em] pillar-number" style={{ color: 'var(--text-faint)' }}>KINGDOM CHARACTER FORMATION</span>
      </Link>

      <div className="eikon-card p-8">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Begin the journey
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Create your account to take the Covenant Formation assessment
        </p>

        {error && (
          <div className="mb-6 p-4 text-sm rounded"
               style={{ background: 'rgba(139,32,32,0.15)', border: '1px solid rgba(139,32,32,0.3)', color: '#D47070' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                   required className="eikon-input" placeholder="Your full name" autoComplete="name" />
          </div>
          <div>
            <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                   required className="eikon-input" placeholder="your@email.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   required minLength={8} className="eikon-input"
                   placeholder="Minimum 8 characters" autoComplete="new-password" />
          </div>

          <div className="scripture-block mt-2">
            <p className="text-sm not-italic" style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>
              The Covenant Formation assessment requires complete honesty to be useful.
              Its value is entirely proportional to the degree to which your responses
              reflect your actual interior life rather than the life you believe you ought to have.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                   className="mt-1 flex-shrink-0" style={{ accentColor: 'var(--gold)' }} />
            <span className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>
              Before God and this community, I commit to complete honesty in this assessment.
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn-gold w-full justify-center"
                  style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create my account'}
          </button>
        </form>

        <div className="gold-rule my-6" />

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-display font-medium" style={{ color: 'var(--gold)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
