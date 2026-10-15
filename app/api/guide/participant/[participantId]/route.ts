// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/guide/participant/[participantId]/route.ts
// Resolves the couple a given participant belongs to, and returns both
// partners' profile + assessment data. Authorization: only that couple's
// assigned Guide (couples.guide_id === user.id) or an admin may read it —
// this schema has no cohorts table (see migration 001).

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'
import { computeCoupleGap } from '@/lib/scoring/gap'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: viewer } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .or(`partner_a_id.eq.${participantId},partner_b_id.eq.${participantId}`)
    .maybeSingle()

  if (!couple) {
    // An individual (readiness-track) participant: guide recorded on their own profile.
    const { data: solo } = await supabase
      .from('profiles').select('id, full_name, email, guide_id').eq('id', participantId).maybeSingle()
    if (!solo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (solo.guide_id !== user.id && viewer?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data: soloAssessment } = await supabase
      .from('assessments').select('*').eq('participant_id', participantId).is('couple_id', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    return NextResponse.json({ couple: null, participant: solo, assessment: soloAssessment ?? null })
  }

  const isAssignedGuide = couple.guide_id === user.id
  const isAdmin = viewer?.role === 'admin'
  if (!isAssignedGuide && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const partnerIds = [couple.partner_a_id, couple.partner_b_id].filter(Boolean) as string[]

  const [{ data: profiles }, { data: assessments }, { data: fruitRows }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').in('id', partnerIds),
    supabase
      .from('assessments')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false }),
    // RLS (fruit_reflections_select_guide) already restricts this to rows
    // the participant explicitly marked shared_with_guide — nothing private
    // reaches this response.
    supabase.from('fruit_reflections').select('participant_id, fruit, reflection_text, updated_at').in('participant_id', partnerIds),
  ])

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))
  function latestFor(partnerId: string | null) {
    if (!partnerId) return null
    return (assessments ?? []).find((a: any) => a.participant_id === partnerId) ?? null
  }

  const assessmentA = latestFor(couple.partner_a_id)
  const assessmentB = latestFor(couple.partner_b_id)

  const coupleGap = computeCoupleGap(
    assessmentA ? { pillar_scores: assessmentA.pillar_scores, pillar_score_overrides: assessmentA.pillar_score_overrides, status: assessmentA.status } : null,
    assessmentB ? { pillar_scores: assessmentB.pillar_scores, pillar_score_overrides: assessmentB.pillar_score_overrides, status: assessmentB.status } : null,
  )

  return NextResponse.json({
    couple,
    partner_a: couple.partner_a_id ? profileById.get(couple.partner_a_id) ?? null : null,
    partner_b: couple.partner_b_id ? profileById.get(couple.partner_b_id) ?? null : null,
    partner_a_assessment: assessmentA,
    partner_b_assessment: assessmentB,
    partner_a_effective: assessmentA?.pillar_scores
      ? computeEffectiveScores(assessmentA.pillar_scores, assessmentA.pillar_score_overrides)
      : null,
    partner_b_effective: assessmentB?.pillar_scores
      ? computeEffectiveScores(assessmentB.pillar_scores, assessmentB.pillar_score_overrides)
      : null,
    couple_gap: coupleGap,
    partner_a_fruit: (fruitRows ?? []).filter((r: any) => r.participant_id === couple.partner_a_id),
    partner_b_fruit: (fruitRows ?? []).filter((r: any) => r.participant_id === couple.partner_b_id),
  })
}
