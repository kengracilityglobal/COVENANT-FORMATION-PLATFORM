// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ParticipantRow from './ParticipantRow'

export default async function ParticipantsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Query directly with the admin's own session (RLS allows admins to read
  // every profile — see migration 002) rather than round-tripping through the
  // API route, which keeps this page working even if cookie-forwarding to an
  // internal fetch is unreliable in a given runtime.
  //
  // This fork's core construct is couples, not cohorts — pairing status
  // comes from the `couples` table (a profile sits in partner_a_id or
  // partner_b_id) and assessment progress from `assessments`, not from a
  // cohort_id/subscription_tier on profiles (neither column exists here).
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, guide_id, subscription_status, onboarding_completed, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 25, page * 25 - 1)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: participants, count: total } = await query

  const ids = (participants ?? []).map((p: any) => p.id)
  const [{ data: couples }, { data: assessments }] = ids.length
    ? await Promise.all([
        supabase
          .from('couples')
          .select('id, partner_a_id, partner_b_id, status, track, guide_id')
          .or(`partner_a_id.in.(${ids.join(',')}),partner_b_id.in.(${ids.join(',')})`),
        supabase
          .from('assessments')
          .select('id, participant_id, status, track, created_at')
          .in('participant_id', ids)
          .order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }]

  const { data: guides } = await supabase
    .from('profiles').select('id, full_name, email').in('role', ['guide', 'admin']).order('full_name', { ascending: true })

  const coupleByParticipant = new Map<string, any>()
  for (const c of couples ?? []) {
    if (c.partner_a_id) coupleByParticipant.set(c.partner_a_id, c)
    if (c.partner_b_id) coupleByParticipant.set(c.partner_b_id, c)
  }
  const latestAssessmentByParticipant = new Map<string, any>()
  for (const a of assessments ?? []) {
    if (!latestAssessmentByParticipant.has(a.participant_id)) {
      latestAssessmentByParticipant.set(a.participant_id, a)
    }
  }

  const rows = (participants ?? []).map((p: any) => {
    const couple = coupleByParticipant.get(p.id) ?? null
    const coupleStatus = !couple ? 'unpaired' : couple.status === 'active' ? 'active' : 'pending_partner'
    return {
      ...p,
      couple_status: coupleStatus,
      assigned_guide_id: couple ? (couple.guide_id ?? null) : (p.guide_id ?? null),
      guide_scope: couple ? 'couple' : 'individual',
      latest_assessment: latestAssessmentByParticipant.get(p.id) ?? null,
    }
  })

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / 25))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ADMINISTRATION</p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Participants</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{total ?? 0} total</p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            type="text" name="q" defaultValue={q}
            placeholder="Search name or email…"
            className="eikon-input text-sm"
          />
          <button type="submit" className="btn-ghost text-sm">Search</button>
        </form>
      </div>

      <div className="space-y-2">
        {rows.map((p: any) => (
          <ParticipantRow key={p.id} participant={p} guides={guides ?? []} />
        ))}
        {rows.length === 0 && (
          <div className="eikon-card p-10 text-center">
            <p className="formation-prose">No participants found{q ? ` for "${q}"` : ''}.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`/admin/participants?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`}
              className="text-xs px-3 py-1.5 font-display"
              style={{
                borderRadius: '2px',
                border: '1px solid var(--bg-border)',
                color: p === page ? 'var(--gold)' : 'var(--text-faint)',
                background: p === page ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
