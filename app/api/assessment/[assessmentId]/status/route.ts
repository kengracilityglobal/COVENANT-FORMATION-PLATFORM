// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status, report_generated_at, overall_score, pillar_scores, pillar_descriptors, priority_stack, integrity_flags, pillar_score_overrides, scoring_notes, participant_acknowledgement, completed_at, created_at')
    .eq('id', assessmentId)
    .eq('participant_id', user.id)  // ownership enforced
    .single()

  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Single source of truth for a Guide override actually taking effect for the
  // participant — see lib/scoring/effective-scores.ts and migration 013. The
  // original computed values stay in the response too (never discarded), but
  // pillar_scores/descriptors/priority_stack/overall_score are overwritten with
  // the effective (post-override) numbers so every consumer of this endpoint
  // (the report page, the dashboard) shows what the Guide's judgment actually
  // determined without each needing to know overrides exist at all.
  if (assessment.pillar_scores) {
    const effective = computeEffectiveScores(assessment.pillar_scores, assessment.pillar_score_overrides)
    assessment.computed_pillar_scores = assessment.pillar_scores
    assessment.pillar_scores = effective.pillar_scores
    assessment.pillar_descriptors = effective.pillar_descriptors
    assessment.priority_stack = effective.priority_stack
    assessment.overall_score = effective.overall_score
    assessment.overridden_pillars = effective.overriddenPillars
  }

  // Never expose the raw R2 report_url - report page links to /report/[id] which is gated
  return NextResponse.json(assessment)
}
