// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCoupleForUser } from '@/lib/couples/helpers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type TypedClient = SupabaseClient<Database>

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const couple = await getCoupleForUser(supabase as TypedClient, user.id)
  let track: 'premarital' | 'married' | 'readiness'
  let coupleId: string | null

  if (couple) {
    track = couple.track as 'premarital' | 'married'
    coupleId = couple.id
  } else {
    // No couple — only valid if this person chose the solo Readiness track
    // at onboarding (migration 005's profiles.intended_track).
    const { data: profile } = await supabase
      .from('profiles')
      .select('intended_track, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.intended_track !== 'readiness') {
      return NextResponse.json({ error: 'Complete onboarding (and pairing with your partner, or choosing the solo Readiness track) before starting the assessment.' }, { status: 400 })
    }
    track = 'readiness'
    coupleId = null
  }

  const { data: existing } = await supabase
    .from('assessments')
    .select('id, status, last_question_index')
    .eq('participant_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let assessmentId: string

  if (existing) {
    assessmentId = existing.id
    if (existing.status === 'not_started') {
      await supabase
        .from('assessments')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', assessmentId)
    }
  } else {
    const { data: lastAssessment } = await supabase
      .from('assessments')
      .select('cycle_number')
      .eq('participant_id', user.id)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const cycleNumber = lastAssessment ? lastAssessment.cycle_number + 1 : 1

    const { data: newAssessment, error } = await supabase
      .from('assessments')
      .insert({
        participant_id:      user.id,
        couple_id:           coupleId,
        track,
        cycle_number:        cycleNumber,
        status:              'in_progress',
        started_at:          new Date().toISOString(),
        last_question_index: 0,
      })
      .select('id')
      .single()

    if (error || !newAssessment) {
      return NextResponse.json({ error: 'Could not create assessment' }, { status: 500 })
    }

    assessmentId = newAssessment.id
  }

  const nextQuestion = await getNextQuestion(supabase as TypedClient, assessmentId, track)
  const total = await getTotalQuestions(supabase as TypedClient, track)

  return NextResponse.json({
    assessment_id:       assessmentId,
    question:            nextQuestion.question,
    progress_percentage: nextQuestion.progress,
    total_questions:     total,
  })
}

async function getNextQuestion(supabase: TypedClient, assessmentId: string, track: string) {
  const { data: answered } = await supabase
    .from('responses')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  const answeredIds = (answered ?? []).map(r => r.question_id)

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('track', track)
    .order('pillar')
    .order('sequence_order')

  if (!allQuestions || allQuestions.length === 0) return { question: null, progress: 100 }

  const remaining = allQuestions.filter(q => !answeredIds.includes(q.id))
  if (remaining.length === 0) return { question: null, progress: 100 }

  const total    = allQuestions.length
  const done     = total - remaining.length
  const progress = Math.round((done / total) * 100)

  return { question: remaining[0], progress }
}

async function getTotalQuestions(supabase: TypedClient, track: string): Promise<number> {
  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('track', track)

  return count ?? 50
}
