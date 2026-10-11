'use client'
// app/auth/update-password/page.tsx
// Landed on after clicking a password recovery link (which signs the user in
// via a temporary session). Lets them set a new password.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // A recovery link signs the user in with a short-lived session before
    // landing here. If there's no session, the link was invalid or expired.
    supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md eikon-card p-8">
        <Link href="/" className="block text-center mb-8">
          <span className="font-display font-bold tracking-[0.2em] text-2xl" style={{ color: 'var(--gold)' }}>COVENANT</span>
        </Link>

        {!ready && !done && (
          <div className="text-center space-y-4">
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Link expired</h1>
            <p className="formation-prose text-sm">This password reset link is invalid or has expired.</p>
            <Link href="/auth/reset-password" className="btn-gold text-sm inline-block mt-2">Request a new link</Link>
          </div>
        )}

        {ready && !done && (
          <>
            <h1 className="font-display text-xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Set a new password</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password" required minLength={8} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password" className="eikon-input w-full" autoFocus
              />
              <input
                type="password" required minLength={8} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password" className="eikon-input w-full"
              />
              {error && <p className="text-sm" style={{ color: '#C0392B' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full text-sm">
                {loading ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </>
        )}

        {done && (
          <div className="text-center space-y-2">
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Password updated</h1>
            <p className="formation-prose text-sm">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  )
}
