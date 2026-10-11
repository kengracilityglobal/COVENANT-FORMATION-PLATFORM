'use client'
import { useState } from 'react'

interface Row { id: string; content_key: string; content_type: string; pillar: string | null; descriptor: string | null; content_text: string; active: boolean; version: number }

export default function ContentRow({ row }: { row: Row }) {
  const [text, setText] = useState(row.content_text)
  const [active, setActive] = useState(row.active)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedVersion, setSavedVersion] = useState(row.version)

  async function save(patch: Record<string, unknown>) {
    setSaving(true); setError(null)
    const res = await fetch(`/api/admin/report-content/${row.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
    if (data.content?.version) setSavedVersion(data.content.version)
    setEditing(false)
  }

  return (
    <div className="eikon-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono" style={{ color: 'var(--gold-muted)' }}>{row.content_key}</span>
          {row.pillar && <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{row.pillar}</span>}
          {row.descriptor && <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>· {row.descriptor}</span>}
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>v{savedVersion}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
            <input type="checkbox" checked={active} disabled={saving}
                   onChange={e => { setActive(e.target.checked); save({ active: e.target.checked }) }} />
            active
          </label>
          {!editing && <button onClick={() => setEditing(true)} className="text-xs" style={{ color: 'var(--gold-muted)' }}>Edit</button>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="eikon-input w-full text-sm" />
          {error && <p className="text-xs" style={{ color: '#D47070' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => save({ content_text: text })} disabled={saving} className="btn-gold text-xs px-3 py-1">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setText(row.content_text); setEditing(false) }} className="btn-ghost text-xs px-3 py-1">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
      )}
    </div>
  )
}
