'use client'
// app/(admin)/admin/questions/QuestionForm.tsx — shared create/edit form for
// a question. jsonb columns (scoring_rubric, integrity_flag_logic,
// cross_ref_questions) are edited as raw JSON text;
// the API route parses and validates them before writing, so a typo here
// surfaces as a save error, not a silently broken rubric in production.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORE_PILLAR_ORDER, PILLAR_DISPLAY_NAMES } from '@/types'

const PILLARS = [...CORE_PILLAR_ORDER, 'cross_pillar'] as const
const TYPES = ['scenario', 'frequency', 'reflective_disclosure'] as const
const TRACKS = ['premarital', 'married'] as const

interface Question {
  id: string
  code: string
  pillar: string
  track: string
  question_type: string
  sequence_order: number
  question_text: string
  scale_reversed: boolean
  active: boolean
  scoring_rubric: unknown
  integrity_flag_logic: unknown
  cross_ref_questions: unknown
}

function jsonToText(val: unknown): string {
  if (val === null || val === undefined) return ''
  return JSON.stringify(val, null, 2)
}

export default function QuestionForm({ mode, question }: { mode: 'create' | 'edit'; question?: Question }) {
  const router = useRouter()
  const [code, setCode] = useState(question?.code ?? '')
  const [pillar, setPillar] = useState(question?.pillar ?? PILLARS[0])
  const [track, setTrack] = useState(question?.track ?? 'premarital')
  const [questionType, setQuestionType] = useState(question?.question_type ?? 'scenario')
  const [sequenceOrder, setSequenceOrder] = useState(question?.sequence_order ?? 0)
  const [questionText, setQuestionText] = useState(question?.question_text ?? '')
  const [scaleReversed, setScaleReversed] = useState(question?.scale_reversed ?? false)
  const [active, setActive] = useState(question?.active ?? true)
  const [scoringRubric, setScoringRubric] = useState(jsonToText(question?.scoring_rubric) || '{}')
  const [integrityFlagLogic, setIntegrityFlagLogic] = useState(jsonToText(question?.integrity_flag_logic))
  const [crossRefQuestions, setCrossRefQuestions] = useState(jsonToText(question?.cross_ref_questions))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)

    const payload = {
      code,
      pillar,
      track,
      question_type: questionType,
      sequence_order: Number(sequenceOrder),
      question_text: questionText,
      scale_reversed: scaleReversed,
      active,
      scoring_rubric: scoringRubric,
      integrity_flag_logic: integrityFlagLogic,
      cross_ref_questions: crossRefQuestions,
    }

    const url = mode === 'create' ? '/api/admin/questions' : `/api/admin/questions/${question!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      const detail = data.details?.fieldErrors ? Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' · ') : null
      setError(data.error ?? detail ?? 'Failed to save')
      return
    }
    router.push('/admin/questions')
    router.refresh()
  }

  const labelCls = 'text-xs pillar-number block mb-1'
  const labelStyle = { color: 'var(--text-faint)' }

  return (
    <form onSubmit={handleSubmit} className="eikon-card p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Code</label>
          <input required value={code} onChange={e => setCode(e.target.value)} className="eikon-input w-full font-mono text-sm" placeholder="H_SC_01" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Sequence Order</label>
          <input required type="number" min={0} value={sequenceOrder} onChange={e => setSequenceOrder(Number(e.target.value))} className="eikon-input w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Pillar</label>
          <select value={pillar} onChange={e => setPillar(e.target.value)} className="eikon-input w-full capitalize">
            {PILLARS.map(p => (
              <option key={p} value={p}>{PILLAR_DISPLAY_NAMES[p as keyof typeof PILLAR_DISPLAY_NAMES]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Question Type</label>
          <select value={questionType} onChange={e => setQuestionType(e.target.value)} className="eikon-input w-full capitalize">
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Track</label>
        <select value={track} onChange={e => setTrack(e.target.value)} className="eikon-input w-full capitalize">
          {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Question Text</label>
        <textarea required value={questionText} onChange={e => setQuestionText(e.target.value)} rows={4} className="eikon-input w-full text-sm" />
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
          <input type="checkbox" checked={scaleReversed} onChange={e => setScaleReversed(e.target.checked)} />
          Scale reversed
        </label>
        <label className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          Active
        </label>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs pillar-number" style={labelStyle}>Scoring & cross-reference data (JSON)</summary>
        <div className="space-y-3 mt-3">
          <div>
            <label className={labelCls} style={labelStyle}>Scoring Rubric</label>
            <textarea value={scoringRubric} onChange={e => setScoringRubric(e.target.value)} rows={4} className="eikon-input w-full font-mono text-xs" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Integrity Flag Logic</label>
            <textarea value={integrityFlagLogic} onChange={e => setIntegrityFlagLogic(e.target.value)} rows={2} className="eikon-input w-full font-mono text-xs" placeholder="null or JSON" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Cross-Reference Questions</label>
            <textarea value={crossRefQuestions} onChange={e => setCrossRefQuestions(e.target.value)} rows={2} className="eikon-input w-full font-mono text-xs" placeholder="null or JSON" />
          </div>
        </div>
      </details>

      {error && <p className="text-sm" style={{ color: '#D47070' }}>{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-gold text-sm">
          {saving ? 'Saving…' : mode === 'create' ? 'Create Question' : 'Save Changes'}
        </button>
        <Link href="/admin/questions" className="btn-ghost text-sm">Cancel</Link>
      </div>
    </form>
  )
}
