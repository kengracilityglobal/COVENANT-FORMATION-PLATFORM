// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContentRow from './ContentRow'

export default async function ReportContentAdminPage({
  searchParams,
}: { searchParams: Promise<{ type?: string; pillar?: string }> }) {
  const { type, pillar } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  let query = supabase.from('report_content').select('*').order('content_key')
  if (type) query = query.eq('content_type', type)
  if (pillar) query = query.eq('pillar', pillar)
  const { data: rows } = await query

  const { data: typesData } = await supabase.from('report_content').select('content_type')
  const types = Array.from(new Set((typesData ?? []).map(r => r.content_type))).sort()
  const pillars = ['humility', 'integrity', 'compassion', 'courage', 'purity', 'servanthood', 'wisdom']

  return (
    <div className="space-y-6">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ADMINISTRATION</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Content</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
          The static portrait and descriptor text used to build reports. AI-generated portraits (for a participant's top-3
          priority pillars) live separately and aren't editable here — this is the library everything else falls back to.
        </p>
      </div>

      <form method="GET" className="flex gap-3 flex-wrap">
        <select name="type" defaultValue={type ?? ''} className="eikon-input text-sm">
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="pillar" defaultValue={pillar ?? ''} className="eikon-input text-sm">
          <option value="">All pillars</option>
          {pillars.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" className="btn-ghost text-sm">Filter</button>
      </form>

      <div className="space-y-3">
        {(rows ?? []).map(row => <ContentRow key={row.id} row={row} />)}
        {(!rows || rows.length === 0) && (
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No content matches this filter.</p>
        )}
      </div>
    </div>
  )
}
