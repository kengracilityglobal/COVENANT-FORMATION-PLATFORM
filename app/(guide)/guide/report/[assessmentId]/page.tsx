// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/(guide)/guide/report/[assessmentId]/page.tsx
//
// Thin wrapper around the single source of truth for report content:
// GET /api/report/[assessmentId]/html, which already authorizes the
// assessment's own participant, the couple's assigned Guide, or an admin,
// and already computes the dyadic gap internally. This page just embeds
// it, the same iframe pattern as the participant's own report page
// (app/(participant)/report/[assessmentId]/page.tsx) — no client-side
// narrative duplication, no paywall, no PDF export hook.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function GuideReportPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>
}) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // No separate authorization check here — the /api/report/[assessmentId]/html
  // route already restricts itself to the assessment's own participant, the
  // couple's assigned Guide (couple.guide_id === requester.id), or an admin,
  // via the same RLS this page's own session carries. A Guide not assigned
  // to this couple will simply get an unauthorized response from that route,
  // which the iframe will show.
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, participant_id, status, pillar_scores')
    .eq('id', assessmentId)
    .maybeSingle()

  const { data: profile } = assessment
    ? await supabase.from('profiles').select('full_name').eq('id', assessment.participant_id).maybeSingle()
    : { data: null }

  const reportUrl = `/api/report/${assessmentId}/html`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>VIEWING AS GUIDE</p>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {profile?.full_name ? `${profile.full_name}'s Formation Report` : 'Formation Report'}
          </h1>
        </div>
        {assessment?.participant_id && (
          <Link href={`/guide/participant/${assessment.participant_id}`} className="btn-ghost text-sm">
            ← Back to couple
          </Link>
        )}
      </div>

      {!assessment ? (
        <div className="eikon-card p-8 text-center">
          <p className="formation-prose">This report could not be found.</p>
        </div>
      ) : assessment.status !== 'report_generated' && !assessment.pillar_scores ? (
        <div className="eikon-card p-8 text-center">
          <p className="formation-prose">This partner&rsquo;s report has not finished generating yet. Check back shortly.</p>
        </div>
      ) : (
        <div className="eikon-card overflow-hidden" style={{ padding: 0, height: '90vh' }}>
          <iframe
            src={reportUrl}
            title="Covenant Formation Report"
            style={{ width: '100%', height: '100%', border: 'none', background: '#0D0B08' }}
          />
        </div>
      )}
    </div>
  )
}
