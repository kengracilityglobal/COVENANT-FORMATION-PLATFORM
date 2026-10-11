// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// app/(guide)/guide/dashboard/page.tsx
//
// Rewritten for the couple model: a Guide is assigned per-couple via
// couples.guide_id — this schema has no cohorts table (see
// supabase/migrations/001_initial_schema.sql). Lists the Guide's couples,
// each partner's assessment status, and links into the couple detail page.

import { createClient } from '@/lib/supabase/server'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  report_generated: 'Report ready',
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'var(--text-faint)',
  in_progress: '#D4AA4A',
  completed: '#7ABF7C',
  report_generated: '#7ABF7C',
}

function firstName(fullName: string | null | undefined): string {
  return (fullName || 'Partner').split(' ')[0]
}

export default async function GuideDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: guide } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (guide?.role !== 'guide' && guide?.role !== 'admin') redirect('/dashboard')

  const { data: couples } = await supabase
    .from('couples')
    .select('id, partner_a_id, partner_b_id, track, status, cycle_number, created_at')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })

  const partnerIds = Array.from(
    new Set((couples ?? []).flatMap(c => [c.partner_a_id, c.partner_b_id].filter(Boolean)))
  ) as string[]

  const [{ data: profiles }, { data: assessments }] = await Promise.all([
    partnerIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', partnerIds)
      : { data: [] as any[] },
    partnerIds.length
      ? supabase.from('assessments')
          .select('participant_id, status, created_at')
          .in('participant_id', partnerIds)
          .order('created_at', { ascending: false })
      : { data: [] as any[] },
  ])

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))
  const latestStatusByParticipant = new Map<string, string>()
  for (const a of assessments ?? []) {
    if (!latestStatusByParticipant.has(a.participant_id)) {
      latestStatusByParticipant.set(a.participant_id, a.status)
    }
  }

  const bothCompleteCount = (couples ?? []).filter(c => {
    const aStatus = c.partner_a_id ? latestStatusByParticipant.get(c.partner_a_id) : null
    const bStatus = c.partner_b_id ? latestStatusByParticipant.get(c.partner_b_id) : null
    return (aStatus === 'completed' || aStatus === 'report_generated')
      && (bStatus === 'completed' || bStatus === 'report_generated')
  }).length

  const unpairedCount = (couples ?? []).filter(c => !c.partner_b_id).length

  return (
    <div className="space-y-8">

      {/* Guide navigation */}
      <div className="flex gap-3 flex-wrap mb-6">
        {[
          { label: 'Dashboard', href: '/guide/dashboard' },
        ].map(link => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs font-bold px-3 py-1.5"
            style={{ background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--bg-border)', borderRadius: '4px', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>FORMATION GUIDE</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {(guide.full_name || 'Your').split(' ')[0]}&rsquo;s Dashboard
        </h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Assigned Couples', value: couples?.length || 0, color: 'var(--text-primary)' },
          { label: 'Both Complete', value: bothCompleteCount, color: '#7ABF7C' },
          { label: 'Awaiting Partner', value: unpairedCount, color: '#D4AA4A' },
        ].map(stat => (
          <div key={stat.label} className="eikon-card p-5 text-center">
            <div className="font-display text-4xl font-bold mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <p className="text-xs pillar-number" style={{ color: 'var(--text-faint)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Couples list */}
      <div className="eikon-card p-6">
        <p className="pillar-number text-xs mb-5" style={{ color: 'var(--gold-muted)' }}>YOUR COUPLES</p>

        {couples && couples.length > 0 ? (
          <div className="space-y-2">
            {couples.map((c) => {
              const partnerA = c.partner_a_id ? profileById.get(c.partner_a_id) : null
              const partnerB = c.partner_b_id ? profileById.get(c.partner_b_id) : null
              const statusA = c.partner_a_id ? latestStatusByParticipant.get(c.partner_a_id) ?? 'not_started' : 'not_started'
              const statusB = c.partner_b_id ? latestStatusByParticipant.get(c.partner_b_id) ?? 'not_started' : null

              const label = partnerA && partnerB
                ? `${firstName(partnerA.full_name)} & ${firstName(partnerB.full_name)}`
                : partnerA
                  ? `${firstName(partnerA.full_name)} & (awaiting partner)`
                  : 'Awaiting both partners'

              // Link via whichever partner id exists — the couple page resolves the couple from either.
              const linkId = c.partner_a_id ?? c.partner_b_id
              if (!linkId) return null

              return (
                <Link
                  key={c.id}
                  href={`/guide/participant/${linkId}`}
                  className="flex items-center gap-4 p-4 transition-colors block flex-wrap"
                  style={{ background: 'var(--bg-elevated)', borderRadius: '2px', border: '1px solid var(--bg-border)' }}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
                       style={{ background: 'var(--bg-card)', color: 'var(--gold)', borderRadius: '2px' }}>
                    {label.charAt(0).toUpperCase()}
                  </div>
                  <p className="flex-1 min-w-[160px] font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {label}
                  </p>
                  <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>
                    {c.track} · Cycle {c.cycle_number}
                  </span>
                  <span className="text-xs font-bold" style={{ color: STATUS_COLORS[statusA] }}>
                    A: {STATUS_LABELS[statusA] ?? statusA}
                  </span>
                  {statusB && (
                    <span className="text-xs font-bold" style={{ color: STATUS_COLORS[statusB] }}>
                      B: {STATUS_LABELS[statusB] ?? statusB}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--gold-muted)' }}>View →</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
            No couples assigned yet.
          </p>
        )}
      </div>

    </div>
  )
}
