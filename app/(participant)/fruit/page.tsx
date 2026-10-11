'use client'
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { FRUIT_ORDER, FRUIT_DISPLAY_NAMES, FRUIT_CONTENT, type FruitName } from '@/lib/formation/fruit'

interface FruitRow {
  fruit: FruitName
  reflection_text: string
  shared_with_guide: boolean
  updated_at: string
}

export default function FruitPage() {
  const [reflections, setReflections] = useState<Record<string, FruitRow>>({})
  const [open, setOpen] = useState<FruitName>('love')
  const [draft, setDraft] = useState('')
  const [shared, setShared] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/fruit')
      .then(r => r.json())
      .then(data => {
        const byFruit: Record<string, FruitRow> = {}
        for (const row of data.reflections ?? []) byFruit[row.fruit] = row
        setReflections(byFruit)
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    const existing = reflections[open]
    setDraft(existing?.reflection_text ?? '')
    setShared(existing?.shared_with_guide ?? false)
    setSaved(false)
  }, [open, reflections])

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    const res = await fetch('/api/fruit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fruit: open, reflection_text: draft.trim(), shared_with_guide: shared }),
    })
    if (res.ok) {
      setReflections(r => ({
        ...r,
        [open]: { fruit: open, reflection_text: draft.trim(), shared_with_guide: shared, updated_at: new Date().toISOString() },
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const content = FRUIT_CONTENT[open]
  const writtenCount = Object.keys(reflections).length

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>GALATIANS 5:22–23</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Fruit of the Spirit</h1>
        <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--text-muted)' }}>
          This is never scored and never ranked. Fruit is produced by abiding, not achieved by trying
          harder — so there's no number here, on purpose. Write honestly, in your own words, whenever one
          of these is alive — or conspicuously absent — in your marriage.
        </p>
        {loaded && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            {writtenCount} of 9 reflected on so far
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {FRUIT_ORDER.map(f => {
          const has = Boolean(reflections[f])
          const isOpen = f === open
          return (
            <button
              key={f}
              onClick={() => setOpen(f)}
              className="px-3 py-2 text-xs font-display rounded text-center transition-colors"
              style={{
                background: isOpen ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${isOpen ? 'var(--gold)' : 'var(--bg-border)'}`,
                color: isOpen ? 'var(--gold)' : has ? 'var(--text-primary)' : 'var(--text-faint)',
                cursor: 'pointer',
              }}
            >
              {FRUIT_DISPLAY_NAMES[f]}
              {has && !isOpen ? ' ·' : ''}
            </button>
          )
        })}
      </div>

      <div className="eikon-card p-6 space-y-5">
        <div>
          <p className="pillar-number text-xs mb-2" style={{ color: 'var(--gold-muted)' }}>{FRUIT_DISPLAY_NAMES[open].toUpperCase()}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {content.inMarriage}
          </p>
          <p className="text-xs mt-2 italic leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            Not to be confused with: {content.notToBeConfusedWith}
          </p>
        </div>

        <div className="gold-rule" />

        <div>
          <label className="block text-sm font-display mb-2" style={{ color: 'var(--text-muted)' }}>
            {content.prompt}
          </label>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={6}
            className="eikon-input"
            placeholder="Write honestly — this is for you and, if you choose, your Formation Guide."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shared}
            onChange={e => setShared(e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Share this reflection with my Formation Guide
          </span>
        </label>

        <div className="flex items-center gap-4 justify-end">
          {saved && <span className="text-sm font-display" style={{ color: '#7ABF7C' }}>✓ Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="btn-gold"
            style={{ opacity: saving || !draft.trim() ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save reflection'}
          </button>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
        Written reflections you choose to share appear on your formation report. Nothing here is ever
        turned into a score.
      </p>
    </div>
  )
}
