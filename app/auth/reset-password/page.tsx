'use client'
// app/auth/reset-password/page.tsx
// Request a password reset email. Supabase sends a link that lands on
// /auth/callback (already handled) and then redirects into /auth/update-password
// to set the new password, since a recovery link signs the user in.

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    // Always show the same success state, whether or not the email exists —
    // otherwise this endpoint becomes a way to check which emails have accounts.
    if (error) {
      console.error('resetPasswordForEmail failed:', error.message)
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md eikon-card p-8">
        <Link href="/" className="block text-center mb-8">
          <span className="font-display font-bold tracking-[0.2em] text-2xl" style={{ color: 'var(--gold)' }}>COVENANT</span>
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
            <p className="formation-prose text-sm">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way. It expires in 1 hour.
            </p>
            <Link href="/login" className="btn-ghost text-sm inline-block mt-2">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-faint)' }}>
              Enter the email on your account and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="eikon-input w-full"
                autoFocus
              />
              {error && <p className="text-sm" style={{ color: '#C0392B' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full text-sm">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
              <Link href="/login" style={{ color: 'var(--gold-muted)' }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
