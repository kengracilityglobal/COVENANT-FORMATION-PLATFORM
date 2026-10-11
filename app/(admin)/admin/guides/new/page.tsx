'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewGuidePage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/guides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to promote user'); return }
    router.push(`/admin/guides/${data.guide.id}`)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ADMINISTRATION</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Add a Formation Guide</h1>
      </div>
      <div className="eikon-card p-6 space-y-4">
        <p className="formation-prose text-sm">
          A Formation Guide must already have a Covenant Formation account. If this person hasn't registered yet,
          have them sign up at <Link href="/register" style={{ color: 'var(--gold-muted)' }}>/register</Link> first —
          then come back here and enter their email to promote them.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs pillar-number block mb-1" style={{ color: 'var(--text-faint)' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="eikon-input w-full" placeholder="guide@example.com" />
          </div>
          {error && <p className="text-sm" style={{ color: '#D47070' }}>{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-gold text-sm">{saving ? 'Promoting…' : 'Make Guide'}</button>
            <Link href="/admin/guides" className="btn-ghost text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
