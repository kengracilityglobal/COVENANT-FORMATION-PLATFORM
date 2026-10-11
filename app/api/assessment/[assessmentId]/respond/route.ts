// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { countWords } from '@/lib/utils'

const schema = z.object({
  question_id: z.string().uuid(),
  response_text: z.string().nullable().optional(),
  response_scale: z.number().int().min(1).max(5).nullable().optional(),
  response_time_seconds: z.number().int().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, participant_id, status, track')
    .eq('id', assessmentId)
    .eq('participant_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  if (assessment.status === 'completed') return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { question_id, response_text, response_scale, response_time_seconds } = parsed.data

  const wc = response_text ? countWords(response_text) : null

  const { error: responseError } = await supabase
    .from('responses')
    .upsert({
      assessment_id: assessmentId,
      participant_id: user.id,
      question_id,
      response_text: response_text || null,
      response_scale: response_scale || null,
      word_count: wc,
      response_time_seconds: response_time_seconds || null,
      answered_at: new Date().toISOString(),
    }, { onConflict: 'assessment_id,question_id' })

  if (responseError) return NextResponse.json({ error: responseError.message }, { status: 500 })

  const { data: answered } = await supabase
    .from('responses')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  const answeredIds = (answered || []).map(r => r.question_id)

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('track', assessment.track)
    .order('pillar')
    .order('sequence_order')

  const remaining = (allQuestions || []).filter(q => !answeredIds.includes(q.id))

  if (remaining.length === 0) {
    return NextResponse.json({ completed: true })
  }

  const total = (allQuestions || []).length
  const done = total - remaining.length
  const progress = Math.round((done / total) * 100)

  return NextResponse.json({
    completed: false,
    question: remaining[0],
    progress_percentage: progress,
  })
}
