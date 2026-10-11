'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function EikonLogo() {
  return (
    <Link href="/" className="flex flex-col items-center gap-2 mb-10">
      <span className="font-display font-bold tracking-[0.2em] text-3xl" style={{ color: 'var(--gold)' }}>
        COVENANT
      </span>
      <span className="text-xs tracking-[0.3em] pillar-number" style={{ color: 'var(--text-faint)' }}>
        MARRIAGE FORMATION
      </span>
    </Link>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="auth-container">
        <EikonLogo />
        <div className="eikon-card p-10 text-center">
          <div className="mb-6 text-4xl">✦</div>
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Check your email
          </h2>
          <p className="formation-prose mb-6">
            A sign-in link has been sent to <strong style={{ color: 'var(--gold)' }}>{email}</strong>.
            Open it to continue your formation journey.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="btn-ghost text-sm"
          >
            Send another link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <EikonLogo />

      <div className="eikon-card overflow-hidden">
        {/* Tab switcher */}
        <div className="flex" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          {(['password', 'magic'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-4 text-sm font-display font-medium transition-colors"
              style={{
                color: mode === m ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: mode === m ? '2px solid var(--gold)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {m === 'password' ? 'Password' : 'Magic Link'}
            </button>
          ))}
        </div>

        <div className="p-8">
          <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Continue your formation journey
          </p>

          {error && (
            <div className="mb-6 p-4 text-sm rounded" style={{ background: 'rgba(139,32,32,0.15)', border: '1px solid rgba(139,32,32,0.3)', color: '#D47070' }}>
              {error}
            </div>
          )}

          <form onSubmit={mode === 'password' ? handleLogin : handleMagicLink} className="space-y-5">
            <div>
              <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="eikon-input"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            {mode === 'password' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <Link href="/auth/reset-password" className="text-xs font-display" style={{ color: 'var(--gold-muted)' }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="eikon-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full justify-center mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? 'Please wait...'
                : mode === 'password'
                  ? 'Sign in'
                  : 'Send magic link'
              }
            </button>
          </form>

          <div className="gold-rule my-6" />

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No account yet?{' '}
            <Link href="/register" className="font-display font-medium" style={{ color: 'var(--gold)' }}>
              Begin the assessment
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
