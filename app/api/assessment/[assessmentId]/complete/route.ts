// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { runScoringEngine } from '@/lib/scoring/engine'
import { ensureReportGenerated } from '@/lib/report/generate'
import type { Question, Response as CovenantResponse } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, participant_id, status, track')
    .eq('id', assessmentId)
    .eq('participant_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (assessment.status === 'completed' || assessment.status === 'report_generated') {
    return NextResponse.json({ success: true, already_complete: true })
  }

  // Fetch all responses and ONLY this assessment's track's questions — a
  // couple with one partner on the married track and one on premarital
  // (shouldn't happen, but nothing stops it at the DB level) must never
  // have the other track's questions leak into either partner's scoring.
  const [{ data: responses }, { data: questions }] = await Promise.all([
    supabase.from('responses').select('*').eq('assessment_id', assessmentId),
    supabase.from('questions').select('*').eq('active', true).eq('track', assessment.track),
  ])

  if (!responses || !questions) {
    return NextResponse.json({ error: 'Could not fetch data for scoring' }, { status: 500 })
  }

  const result = await runScoringEngine(questions as Question[], responses as CovenantResponse[])

  const scoreUpdates = result.scored_responses.map(scored =>
    serviceSupabase
      .from('responses')
      .update({
        computed_score:      scored.computed_score,
        descriptor_assigned: scored.descriptor_assigned,
        flags_raised:        scored.flags_raised ?? null,
      })
      .eq('id', scored.id)
  )
  await Promise.all(scoreUpdates)

  const { error: updateError } = await serviceSupabase
    .from('assessments')
    .update({
      status:              'completed',
      completed_at:        new Date().toISOString(),
      pillar_scores:       result.pillar_scores,
      pillar_descriptors:  result.pillar_descriptors,
      integrity_flags:     result.integrity_flags,
      priority_stack:      result.priority_stack,
      overall_score:       result.overall_score,
      scoring_notes:       result.scoring_notes,
    })
    .eq('id', assessmentId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Build the polished HTML report and any AI portraits in the background,
  // via Next's after() — this runs once the response below has already been
  // sent, so it can NEVER add latency to (or fail) the participant's own
  // completion request. pillar_scores, written above, is the actual
  // deliverable — real, complete, deterministic (falls back to keyword
  // scoring if the AI scorer is unavailable) the instant this request
  // returns. The HTML export and AI portraits are a progressive-enhancement
  // layer on top, never a gate.
  //
  // NOTE on scope: EIKON also has a daily cron sweep that retries any
  // assessment whose background generation never completed. That cron
  // subsystem is deliberately deferred in this v1 (see docs/VERIFICATION.md)
  // — the report page's own view-triggered retry (see ensureReportGenerated)
  // is the only safety net here for now.
  after(async () => {
    try {
      await ensureReportGenerated(assessmentId)
    } catch (err: any) {
      console.error('[assessment/complete] background report generation failed, will retry on report view:', err?.message ?? err)
    }
  })

  return NextResponse.json({ success: true })
}
