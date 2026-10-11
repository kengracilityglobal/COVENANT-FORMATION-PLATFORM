// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/(guide)/guide/participant/[participantId]/page.tsx
//
// Rewritten for the dyadic couple model. The route param is still
// `participantId` (one profile) because that's what every link into this
// page passes — the dashboard links from a couple row via either partner's
// id, and the admin participant list links from a single profile row — but
// the page itself resolves the COUPLE that profile belongs to and renders
// a couple detail view: both partners, both assessment statuses, both
// score summaries once available, and the dyadic Perception Gap once both
// partners have completed. There is no cohort, pathway, discipline,
// journal, or Fruit-of-the-Spirit content here — none of that exists in
// this schema (see supabase/migrations/001_initial_schema.sql).

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PILLAR_DISPLAY_NAMES, DESCRIPTOR_COLORS, DESCRIPTOR_LABELS, GAP_BAND_COLORS, GAP_BAND_LABELS, CORE_PILLAR_ORDER } from '@/types'
import { formatDate } from '@/lib/utils'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'
import { computeCoupleGap } from '@/lib/scoring/gap'
import ScoreOverrideRow from './ScoreOverrideRow'

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

export default async function CoupleDetailPage({
  params,
}: {
  params: Promise<{ participantId: string }>
}) {
  const { participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Resolve the profile this param points at, then the couple it belongs
  // to — either side. The param may name either partner; the page always
  // shows the whole couple.
  const { data: namedProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', participantId)
    .maybeSingle()

  if (!namedProfile) notFound()

  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .or(`partner_a_id.eq.${participantId},partner_b_id.eq.${participantId}`)
    .maybeSingle()

  if (!couple) notFound()

  const isAssignedGuide = couple.guide_id === user.id
  const isAdmin = viewer?.role === 'admin'
  if (!isAssignedGuide && !isAdmin) {
    redirect('/guide/dashboard')
  }

  // Fetch both partner profiles (whichever exist) and both assessments.
  const partnerIds = [couple.partner_a_id, couple.partner_b_id].filter(Boolean) as string[]

  const [{ data: profiles }, { data: assessments }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').in('id', partnerIds),
    supabase
      .from('assessments')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false }),
  ])

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))
  const partnerA = couple.partner_a_id ? profileById.get(couple.partner_a_id) : null
  const partnerB = couple.partner_b_id ? profileById.get(couple.partner_b_id) : null

  // Most recent assessment for this couple's current cycle, per partner.
  function latestAssessmentFor(partnerId: string | null) {
    if (!partnerId) return null
    return (assessments ?? []).find((a: any) => a.participant_id === partnerId) ?? null
  }
  const assessmentA = latestAssessmentFor(couple.partner_a_id)
  const assessmentB = latestAssessmentFor(couple.partner_b_id)

  const effectiveA = assessmentA?.pillar_scores
    ? computeEffectiveScores(assessmentA.pillar_scores, assessmentA.pillar_score_overrides)
    : null
  const effectiveB = assessmentB?.pillar_scores
    ? computeEffectiveScores(assessmentB.pillar_scores, assessmentB.pillar_score_overrides)
    : null

  const coupleGap = computeCoupleGap(
    assessmentA ? { pillar_scores: assessmentA.pillar_scores, pillar_score_overrides: assessmentA.pillar_score_overrides, status: assessmentA.status } : null,
    assessmentB ? { pillar_scores: assessmentB.pillar_scores, pillar_score_overrides: assessmentB.pillar_score_overrides, status: assessmentB.status } : null,
  )

  const coupleLabel = partnerA && partnerB
    ? `${firstName(partnerA.full_name)} & ${firstName(partnerB.full_name)}`
    : partnerA
      ? `${firstName(partnerA.full_name)} & (awaiting partner)`
      : 'Awaiting both partners'

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/guide/dashboard" className="text-xs font-display mb-2 block" style={{ color: 'var(--text-faint)' }}>
            ← Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {coupleLabel}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {couple.track === 'premarital' ? 'Premarital' : 'Married'} track · Cycle {couple.cycle_number}
            {' · '}Couple since {formatDate(couple.created_at)}
          </p>
        </div>
      </div>

      {/* Both partners — status + summary cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <PartnerCard
          label="Partner A"
          profile={partnerA}
          assessment={assessmentA}
          effective={effectiveA}
          participantId={couple.partner_a_id}
        />
        <PartnerCard
          label="Partner B"
          profile={partnerB}
          assessment={assessmentB}
          effective={effectiveB}
          participantId={couple.partner_b_id}
        />
      </div>

      {/* Dyadic gap table — mirrors lib/report/builder.ts's gapSection() */}
      <div className="eikon-card p-7">
        <p className="pillar-number text-xs mb-1" style={{ color: 'var(--gold-muted)' }}>THE PERCEPTION GAP</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-faint)', lineHeight: '1.6' }}>
          Each partner took the assessment independently. This table shows where their two sets
          of answers agree, and where they diverge.
        </p>

        {!coupleGap.both_complete ? (
          <div style={{ padding: '28px', textAlign: 'center', border: '1px dashed var(--bg-border)', borderRadius: '4px' }}>
            <p className="text-sm" style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
              The gap table appears once both partners have completed their assessment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th className="text-left px-3 py-2 text-xs" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>PILLAR</th>
                  <th className="text-center px-3 py-2 text-xs" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
                    {partnerA ? firstName(partnerA.full_name).toUpperCase() : 'PARTNER A'}
                  </th>
                  <th className="text-center px-3 py-2 text-xs" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
                    {partnerB ? firstName(partnerB.full_name).toUpperCase() : 'PARTNER B'}
                  </th>
                  <th className="text-center px-3 py-2 text-xs" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>GAP</th>
                </tr>
              </thead>
              <tbody>
                {coupleGap.pillars.map(g => {
                  const band = g.gap_band ?? 'aligned'
                  return (
                    <tr key={g.pillar} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                      <td className="px-3 py-2 font-display font-medium" style={{ color: 'var(--text-primary)' }}>
                        {PILLAR_DISPLAY_NAMES[g.pillar]}
                      </td>
                      <td className="px-3 py-2 text-center font-bold" style={{ color: 'var(--gold)' }}>
                        {g.partner_a_score !== null ? Math.round(g.partner_a_score) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold" style={{ color: 'var(--gold)' }}>
                        {g.partner_b_score !== null ? Math.round(g.partner_b_score) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GAP_BAND_COLORS[band] }}>
                          {GAP_BAND_LABELS[band]}
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'var(--text-faint)' }}>
                          ({g.gap !== null ? Math.round(g.gap) : '—'} pts)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {coupleGap.joint_priority_stack.length > 0 && (
              <div className="mt-5 p-4" style={{ background: 'rgba(196,122,26,0.05)', borderLeft: '3px solid #C47A1A', borderRadius: '2px' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C47A1A' }}>Where to start together</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  {coupleGap.joint_priority_stack.slice(0, 3).map(p => PILLAR_DISPLAY_NAMES[p]).join(', ')}
                  {' '}— ranked by the size of the gap between partners, not just either partner's individual score.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

function firstName(fullName: string | null | undefined): string {
  return (fullName || 'Partner').split(' ')[0]
}

function PartnerCard({
  label, profile, assessment, effective, participantId,
}: {
  label: string
  profile: { id: string; full_name: string; email: string } | null | undefined
  assessment: any
  effective: ReturnType<typeof computeEffectiveScores> | null
  participantId: string | null
}) {
  if (!profile || !participantId) {
    return (
      <div className="eikon-card p-6">
        <p className="pillar-number text-xs mb-3" style={{ color: 'var(--gold-muted)' }}>{label}</p>
        <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--bg-border)', borderRadius: '4px' }}>
          <p className="text-sm" style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
            Awaiting this partner to accept the invite.
          </p>
        </div>
      </div>
    )
  }

  const status = assessment?.status ?? 'not_started'

  return (
    <div className="eikon-card p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="pillar-number text-xs mb-1" style={{ color: 'var(--gold-muted)' }}>{label}</p>
          <h3 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{profile.email}</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-1 uppercase tracking-wider"
          style={{ color: STATUS_COLORS[status], background: 'var(--bg-elevated)', borderRadius: '3px' }}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {!effective || !assessment ? (
        <p className="text-sm" style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
          No scores yet — assessment {status === 'not_started' ? 'has not been started' : 'is still in progress'}.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Overall score</span>
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {Math.round(effective.overall_score)}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {CORE_PILLAR_ORDER.map(pillar => {
              const score = effective.pillar_scores[pillar as keyof typeof effective.pillar_scores]
              const descriptor = effective.pillar_descriptors[pillar as keyof typeof effective.pillar_descriptors]
              const color = DESCRIPTOR_COLORS[descriptor]
              const override = assessment.pillar_score_overrides?.[pillar]
              return (
                <ScoreOverrideRow
                  key={pillar}
                  participantId={participantId}
                  assessmentId={assessment.id}
                  pillar={pillar}
                  name={PILLAR_DISPLAY_NAMES[pillar]}
                  score={score}
                  color={color}
                  override={override}
                />
              )
            })}
          </div>

          <a
            href={`/guide/report/${assessment.id}`}
            className="btn-ghost text-xs inline-block"
          >
            Open full report →
          </a>
        </>
      )}
    </div>
  )
}
