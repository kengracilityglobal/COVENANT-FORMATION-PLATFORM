'use client'
// app/(admin)/admin/participants/ParticipantRow.tsx
// Client row: lets an admin change a participant's role, via
// PATCH /api/admin/participants. Server component above re-fetches on
// navigation; this does a soft client-side refresh.
//
// Couple pairing is not admin-editable here (couples are formed through the
// invite-code flow) — this row only displays pairing/assessment status.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Assessment { id: string; status: string; track: string }
interface Participant {
  id: string; full_name: string; email: string
  role: 'participant' | 'guide' | 'admin'
  subscription_status: string
  onboarding_completed: boolean
  couple_status: 'unpaired' | 'pending_partner' | 'active'
  latest_assessment: Assessment | null
}

const COUPLE_STATUS_LABEL: Record<Participant['couple_status'], string> = {
  unpaired: 'Unpaired',
  pending_partner: 'Pending partner',
  active: 'Paired',
}

export default function ParticipantRow({ participant }: { participant: Participant }) {
  const [role, setRole] = useState(participant.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function save(patch: Record<string, unknown>) {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/participants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: participant.id, ...patch }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to update'); return }
    router.refresh()
  }

  const assessment = participant.latest_assessment
  const reportReady = assessment?.status === 'completed' || assessment?.status === 'report_generated'

  return (
    <div className="eikon-card p-4 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-[180px]">
        <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{participant.full_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{participant.email}</p>
      </div>

      <span
        className="text-xs px-2 py-0.5"
        style={{
          borderRadius: '2px',
          background: participant.couple_status === 'active' ? 'rgba(80,150,110,0.15)' : 'rgba(200,150,50,0.1)',
          color: participant.couple_status === 'active' ? '#6FB88F' : 'var(--text-faint)',
        }}
      >
        {COUPLE_STATUS_LABEL[participant.couple_status]}
      </span>

      <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>
        {assessment ? `Assessment: ${assessment.status.replace('_', ' ')}` : 'No assessment started'}
      </span>

      {reportReady && (
        <a
          href={`/api/report/${assessment!.id}/html`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-display"
          style={{ color: 'var(--gold-muted)' }}
        >
          View report →
        </a>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: 'var(--text-faint)' }}>Role</label>
        <select
          value={role}
          disabled={saving}
          onChange={e => { const v = e.target.value as typeof role; setRole(v); save({ role: v }) }}
          className="eikon-input text-xs py-1"
        >
          <option value="participant">Participant</option>
          <option value="guide">Guide</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{participant.subscription_status}</span>
      {!participant.onboarding_completed && (
        <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(200,150,50,0.15)', color: '#E0984A', borderRadius: '2px' }}>
          Onboarding incomplete
        </span>
      )}
      {error && <span className="text-xs w-full" style={{ color: '#D47070' }}>{error}</span>}
    </div>
  )
}
