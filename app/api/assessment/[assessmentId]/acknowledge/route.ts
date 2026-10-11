// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/assessment/[assessmentId]/acknowledge/route.ts
//
// POST — participant submits their review of the algorithmic scores.
//
// This is the "participant review step": after reading their report summary,
// participants are asked whether the pillar scores ring true to their
// experience of themselves. Their responses become data — the Guide
// sees them alongside the computed scores and can use any stated
// disagreement as a direct probe in the first session.
//
// Body: {
//   pillar_resonance: Record<string, 'yes' | 'somewhat' | 'no'>,  // per-pillar
//   overall_resonance: 'yes' | 'somewhat' | 'no',
//   participant_note?: string  // optional free text — "what surprised you?"
// }
//
// The participant_acknowledgement is stored as JSONB on the assessment row
// and surfaced to the Guide in their participant detail view.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify this assessment belongs to the participant
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, participant_id, status')
    .eq('id', assessmentId)
    .eq('participant_id', user.id)
    .single()

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  if (assessment.status !== 'report_generated') {
    return NextResponse.json({ error: 'Report not yet generated' }, { status: 409 })
  }

  const body = await request.json()
  const { pillar_resonance, overall_resonance, participant_note } = body

  // Validate
  const validValues = ['yes', 'somewhat', 'no']
  if (!overall_resonance || !validValues.includes(overall_resonance)) {
    return NextResponse.json({ error: 'Invalid overall_resonance value' }, { status: 400 })
  }

  const acknowledgement = {
    submitted_at: new Date().toISOString(),
    overall_resonance,
    pillar_resonance: pillar_resonance || {},
    participant_note: participant_note?.trim() || null,
  }

  const { error } = await supabase
    .from('assessments')
    .update({ participant_acknowledgement: acknowledgement })
    .eq('id', assessmentId)

  if (error) {
    console.error('Acknowledgement save error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
