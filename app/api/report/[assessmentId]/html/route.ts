// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildReportHTML } from '@/lib/report/builder'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'
import { computeCoupleGap, type PartnerAssessmentInput } from '@/lib/scoring/gap'

// Renders the full HTML report fresh on every request — no cached/stored
// export. Both the participant's own report page and the Guide's report
// view load this route in an iframe (see lib/report/generate.ts's header
// comment for why nothing here is ever cached to storage).
//
// Auth: the assessment's own participant, that couple's assigned Guide,
// or an admin. Anyone else gets 403 — this report contains one partner's
// private written answers.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: viewerProfile } = await service.from('profiles').select('id, role').eq('id', user.id).single()

  const { data: assessment } = await service.from('assessments').select('*').eq('id', assessmentId).single()
  if (!assessment) return new NextResponse('Not found', { status: 404 })

  // A readiness-track assessment has no couple at all (couple_id is null) —
  // use maybeSingle() rather than single(), which would error on zero rows.
  const { data: couple } = assessment.couple_id
    ? await service.from('couples').select('*').eq('id', assessment.couple_id).maybeSingle()
    : { data: null }

  const isOwner = assessment.participant_id === user.id
  let isGuide = Boolean(couple && couple.guide_id === user.id)
  if (!isGuide && !assessment.couple_id) {
    // Solo (readiness) participant: the guide is recorded on their own profile.
    const { data: owner } = await service.from('profiles').select('guide_id').eq('id', assessment.participant_id).maybeSingle()
    isGuide = owner?.guide_id === user.id
  }
  const isAdmin = viewerProfile?.role === 'admin'
  if (!isOwner && !isGuide && !isAdmin) return new NextResponse('Forbidden', { status: 403 })

  if (assessment.status !== 'completed' && assessment.status !== 'report_generated') {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="background:#0D0B08;color:#C4A96A;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh;"><p>This report is not ready yet.</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const { data: profile } = await service.from('profiles').select('*').eq('id', assessment.participant_id).single()
  if (!profile) return new NextResponse('Not found', { status: 404 })

  const [{ data: responses }, { data: reportContent }, { data: portraitRows }, { data: fruitRows }] = await Promise.all([
    service.from('responses').select('*').eq('assessment_id', assessmentId),
    service.from('report_content').select('*').eq('active', true),
    service.from('ai_portraits').select('*').eq('assessment_id', assessmentId),
    service.from('fruit_reflections').select('fruit, reflection_text').eq('participant_id', assessment.participant_id).order('fruit'),
  ])

  // The questions behind this person's responses. The builder uses each question's own scoring
  // rubric to show, per pillar, where their answers held and where they slipped — this is what
  // makes the offline report specific to them. Optional: if the lookup fails the report still
  // renders in full, just without those evidence panels.
  const questionIds = Array.from(new Set((responses ?? []).map((r: any) => r.question_id).filter(Boolean)))
  let questions: any[] = []
  if (questionIds.length) {
    const { data: qrows, error: qerr } = await service
      .from('questions')
      .select('id, code, pillar, question_type, question_text, scale_reversed, scoring_rubric')
      .in('id', questionIds)
    if (qerr) console.error('[report/html] question lookup failed — rendering without evidence panels:', qerr.message)
    questions = qrows ?? []
  }

  const aiPortraits: Record<string, { portrait?: string; gap_note?: string; invitation?: string }> = {}
  for (const row of portraitRows ?? []) {
    aiPortraits[row.pillar] = row.content ?? {}
  }

  // Merge any Guide score override — the live report always reflects the
  // current effective state, never a stale snapshot. See lib/scoring/effective-scores.ts.
  const effective = computeEffectiveScores(assessment.pillar_scores, assessment.pillar_score_overrides)
  const effectiveAssessment = {
    ...assessment,
    pillar_scores: effective.pillar_scores,
    pillar_descriptors: effective.pillar_descriptors,
    priority_stack: effective.priority_stack,
    overall_score: effective.overall_score,
  }

  // Dyadic gap — find the partner's assessment for the same couple+track,
  // if one exists, and compute the gap fresh. Never stored.
  let coupleGap = null
  let otherPartnerName: string | null = null
  if (couple) {
    const otherPartnerId = couple.partner_a_id === assessment.participant_id ? couple.partner_b_id : couple.partner_a_id
    if (otherPartnerId) {
      const [{ data: otherProfile }, { data: otherAssessment }] = await Promise.all([
        service.from('profiles').select('id, full_name').eq('id', otherPartnerId).single(),
        service.from('assessments').select('pillar_scores, pillar_score_overrides, status')
          .eq('couple_id', couple.id).eq('participant_id', otherPartnerId)
          .order('cycle_number', { ascending: false }).limit(1).maybeSingle(),
      ])
      otherPartnerName = otherProfile?.full_name?.split(' ')[0] ?? null
      const selfInput: PartnerAssessmentInput = {
        pillar_scores: assessment.pillar_scores, pillar_score_overrides: assessment.pillar_score_overrides, status: assessment.status,
      }
      const otherInput: PartnerAssessmentInput | null = otherAssessment ? {
        pillar_scores: otherAssessment.pillar_scores, pillar_score_overrides: otherAssessment.pillar_score_overrides, status: otherAssessment.status,
      } : null
      // Pass the report-owner's own input first regardless of which couple
      // slot (partner_a/partner_b) they actually occupy in the DB — the
      // builder's "YOU" column always reads partner_a_score, so "self first"
      // is what makes that column mean "you" for whichever partner is viewing.
      coupleGap = computeCoupleGap(selfInput, otherInput)
    }
  }

  const html = buildReportHTML({
    profile,
    assessment: effectiveAssessment,
    responses: responses ?? [],
    reportContent: reportContent ?? [],
    aiPortraits,
    partnerName: profile.full_name,
    otherPartnerName,
    coupleGap,
    fruitReflections: fruitRows ?? [],
    questions,
  })

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
