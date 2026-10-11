// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/guide/participant/[participantId]/override-score/route.ts
//
// The real feature behind the Guide participant page's claim "you can
// override any computed score... your judgment takes precedence" — see
// migration 013 and docs/VERIFICATION.md v18 for why this had to be built
// rather than just described.
//
// A reason is REQUIRED, not optional: an override with no accountability
// trail is not pastoral judgment, it's an unexplained edit. The original
// computed score is never touched — see lib/scoring/effective-scores.ts.

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  assessment_id: z.string().uuid(),
  pillar: z.enum([
    'covenant_faithfulness', 'oneness', 'sacrificial_love', 'intimacy',
    'truthful_communication', 'conflict_repair', 'mutual_honor', 'shared_vision',
  ]),
  score: z.number().int().min(0).max(100),
  reason: z.string().trim().min(20, 'Explain your pastoral reasoning in at least a sentence — this is recorded alongside the override.'),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isGuide } = await supabase.rpc('is_guide_of_participant', { p_participant_id: participantId })
  if (!isGuide) return NextResponse.json({ error: "You are not this participant's Guide" }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid data' }, { status: 400 })
  }
  const { assessment_id, pillar, score, reason } = parsed.data

  const serviceSupabase = await createServiceClient()
  const { data: assessment } = await serviceSupabase
    .from('assessments')
    .select('id, participant_id, pillar_score_overrides')
    .eq('id', assessment_id)
    .eq('participant_id', participantId)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  const overrides = { ...(assessment.pillar_score_overrides ?? {}) }
  overrides[pillar] = { score, reason, overridden_by: user.id, overridden_at: new Date().toISOString() }

  const { data: updated, error } = await serviceSupabase
    .from('assessments')
    .update({ pillar_score_overrides: overrides })
    .eq('id', assessment_id)
    .select('pillar_score_overrides')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pillar_score_overrides: updated.pillar_score_overrides })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const { searchParams } = new URL(request.url)
  const assessmentId = searchParams.get('assessment_id')
  const pillar = searchParams.get('pillar')
  if (!assessmentId || !pillar) return NextResponse.json({ error: 'assessment_id and pillar required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isGuide } = await supabase.rpc('is_guide_of_participant', { p_participant_id: participantId })
  if (!isGuide) return NextResponse.json({ error: "You are not this participant's Guide" }, { status: 403 })

  const serviceSupabase = await createServiceClient()
  const { data: assessment } = await serviceSupabase
    .from('assessments')
    .select('pillar_score_overrides')
    .eq('id', assessmentId)
    .eq('participant_id', participantId)
    .single()
  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  const overrides = { ...(assessment.pillar_score_overrides ?? {}) }
  delete overrides[pillar]

  const { error } = await serviceSupabase
    .from('assessments')
    .update({ pillar_score_overrides: Object.keys(overrides).length ? overrides : null })
    .eq('id', assessmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
