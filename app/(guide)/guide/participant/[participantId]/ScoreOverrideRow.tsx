'use client'
// app/(guide)/guide/participant/[participantId]/ScoreOverrideRow.tsx
//
// The working control behind "your judgment takes precedence" — see
// app/api/guide/participant/[participantId]/override-score/route.ts and
// migration 013. A reason is required: an override with no explanation is
// an unexplained edit, not pastoral judgment.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Override { score: number; reason: string; overridden_at: string }

export default function ScoreOverrideRow({
  participantId, assessmentId, pillar, name, score, color, override,
}: {
  participantId: string; assessmentId: string; pillar: string; name: string
  score: number; color: string; override?: Override
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(score)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function save() {
    setSaving(true); setError(null)
    const res = await fetch(`/api/guide/participant/${participantId}/override-score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment_id: assessmentId, pillar, score: value, reason }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Could not save the override'); return }
    setEditing(false); setReason('')
    router.refresh()
  }

  async function clearOverride() {
    setSaving(true)
    await fetch(`/api/guide/participant/${participantId}/override-score?assessment_id=${assessmentId}&pillar=${pillar}`, { method: 'DELETE' })
    setSaving(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-display flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          {name}
          {override && (
            <span title={`Overridden ${new Date(override.overridden_at).toLocaleDateString()}: ${override.reason}`}
                  className="text-xs" style={{ color: 'var(--gold)' }}>✎ overridden</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color }}>{Math.round(score)}</span>
          {!editing && (
            <button onClick={() => { setEditing(true); setValue(score) }} className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {override ? 'edit' : 'override'}
            </button>
          )}
        </div>
      </div>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'var(--bg-border)' }}>
        <div className="h-full" style={{ width: `${score}%`, background: color, opacity: 0.7 }} />
      </div>

      {editing && (
        <div className="mt-2 mb-3 p-3 space-y-2" style={{ background: 'var(--bg-elevated)', borderRadius: '2px', border: '1px solid var(--bg-border)' }}>
          <input type="range" min={0} max={100} value={value} onChange={e => setValue(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-right" style={{ color: 'var(--text-faint)' }}>{value}</div>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} rows={2}
            placeholder="Required: why does your pastoral judgment differ from the computed score? (at least a sentence)"
            className="eikon-input w-full text-xs"
          />
          {error && <p className="text-xs" style={{ color: '#D47070' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || reason.trim().length < 20} className="btn-gold text-xs px-3 py-1">
              {saving ? 'Saving…' : 'Save override'}
            </button>
            <button onClick={() => { setEditing(false); setError(null) }} className="btn-ghost text-xs px-3 py-1">Cancel</button>
            {override && (
              <button onClick={clearOverride} disabled={saving} className="text-xs ml-auto" style={{ color: '#D47070' }}>
                Remove override
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
