// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PILLAR_DISPLAY_NAMES } from '@/types'

export default async function QuestionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string; type?: string; track?: string }>
}) {
  const { pillar, type, track } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('questions')
    .select('*')
    .order('track')
    .order('pillar')
    .order('sequence_order')

  if (pillar) query = query.eq('pillar', pillar)
  if (type)   query = query.eq('question_type', type)
  if (track)  query = query.eq('track', track)

  const { data: questions } = await query
  const { count: total } = await supabase
    .from('questions').select('id', { count: 'exact', head: true })

  const pillars = Object.entries(PILLAR_DISPLAY_NAMES).filter(([k]) => k !== 'cross_pillar')

  const typeColors: Record<string, string> = {
    scenario: '#2C5F2E',
    frequency: '#1B3A6B',
    reflective_disclosure: '#5C2E1B',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>QUESTION BANK</p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Questions <span className="font-light text-xl" style={{ color: 'var(--text-faint)' }}>({total || 0})</span>
          </h1>
        </div>
        <Link href="/admin/questions/new" className="btn-gold text-sm">+ Add Question</Link>
      </div>

      {/* Filters */}
      <div className="eikon-card p-4 flex gap-3 flex-wrap">
        <Link href="/admin/questions" className={`text-xs px-3 py-1.5 font-display border transition-colors ${!pillar && !type ? 'border-gold text-gold' : 'border-bg-border'}`}
           style={{ borderRadius: '2px', borderColor: !pillar && !type ? 'var(--gold)' : 'var(--bg-border)', color: !pillar && !type ? 'var(--gold)' : 'var(--text-faint)' }}>
          All
        </Link>
        {pillars.map(([key, label]) => (
          <Link key={key} href={`/admin/questions?pillar=${key}${track ? `&track=${track}` : ''}`}
             className="text-xs px-3 py-1.5 font-display transition-colors"
             style={{ borderRadius: '2px', border: `1px solid ${pillar === key ? 'var(--gold)' : 'var(--bg-border)'}`, color: pillar === key ? 'var(--gold)' : 'var(--text-faint)' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Track filter */}
      <div className="eikon-card p-4 flex gap-3 flex-wrap">
        <span className="text-xs pillar-number self-center" style={{ color: 'var(--text-faint)' }}>TRACK</span>
        <Link href={`/admin/questions${pillar ? `?pillar=${pillar}` : ''}`}
           className="text-xs px-3 py-1.5 font-display transition-colors"
           style={{ borderRadius: '2px', border: `1px solid ${!track ? 'var(--gold)' : 'var(--bg-border)'}`, color: !track ? 'var(--gold)' : 'var(--text-faint)' }}>
          All
        </Link>
        {(['premarital', 'married'] as const).map(t => (
          <Link key={t} href={`/admin/questions?track=${t}${pillar ? `&pillar=${pillar}` : ''}`}
             className="text-xs px-3 py-1.5 font-display capitalize transition-colors"
             style={{ borderRadius: '2px', border: `1px solid ${track === t ? 'var(--gold)' : 'var(--bg-border)'}`, color: track === t ? 'var(--gold)' : 'var(--text-faint)' }}>
            {t}
          </Link>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {(questions || []).map((q) => (
          <div key={q.id} className="eikon-card p-5 flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="font-display font-bold text-xs" style={{ color: 'var(--gold)' }}>
                {q.code}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 font-display capitalize"
                      style={{ background: `${typeColors[q.question_type]}22`, color: typeColors[q.question_type] || 'var(--text-muted)', borderRadius: '2px', border: `1px solid ${typeColors[q.question_type]}44` }}>
                  {q.question_type.replace('_', ' ')}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {PILLAR_DISPLAY_NAMES[q.pillar as keyof typeof PILLAR_DISPLAY_NAMES]} · #{q.sequence_order}
                </span>
                <span className="text-xs px-2 py-0.5 font-display capitalize" style={{ background: 'rgba(184,151,42,0.08)', color: 'var(--text-faint)', borderRadius: '2px' }}>
                  {q.track}
                </span>
                {!q.active && (
                  <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(139,32,32,0.2)', color: '#D47070', borderRadius: '2px' }}>
                    Inactive
                  </span>
                )}
                {q.scale_reversed && (
                  <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(184,151,42,0.1)', color: 'var(--gold-muted)', borderRadius: '2px' }}>
                    Reverse scored
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {q.question_text.slice(0, 180)}{q.question_text.length > 180 ? '...' : ''}
              </p>
            </div>
            <Link href={`/admin/questions/${q.id}`}
               className="text-xs font-display flex-shrink-0" style={{ color: 'var(--gold-muted)' }}>
              Edit →
            </Link>
          </div>
        ))}

        {(!questions || questions.length === 0) && (
          <div className="eikon-card p-10 text-center">
            <p className="formation-prose">No questions found. Import questions from the Question Bank document.</p>
          </div>
        )}
      </div>
    </div>
  )
}
