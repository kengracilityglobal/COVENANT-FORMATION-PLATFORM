// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/admin/questions/[questionId]/route.ts — read/edit/retire one
// question (admin only). Mirrors app/api/admin/report-content/[id]/route.ts.
//
// Questions are never hard-deleted: a question's code may already appear in
// a participant's raw_responses/scoring_rubric history, and deleting the row
// would break re-reads of past assessments. "Retire" sets active=false
// instead (the assessment-serving path already filters on active).
//
// Pillar and track match this fork's actual `questions` schema (migration
// 001): the 8 covenant pillars, the 3 real question_type values, and
// `track` ('premarital' | 'married') — there is no extended_module_trigger
// or gap_profile_tags column here.

import { NextResponse } from 'next/server'
import { requireAdmin, adminServiceClient } from '@/lib/admin/require-admin'
import { z } from 'zod'
import { CORE_PILLAR_ORDER } from '@/types'

const PILLARS = [...CORE_PILLAR_ORDER, 'cross_pillar'] as const
const TYPES = ['scenario', 'frequency', 'reflective_disclosure'] as const
const TRACKS = ['premarital', 'married'] as const

const jsonField = z.string().optional().transform((val, ctx) => {
  if (val === undefined) return undefined
  if (val.trim() === '') return null
  try {
    return JSON.parse(val)
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Must be valid JSON' })
    return z.NEVER
  }
})

const patchSchema = z.object({
  code: z.string().min(2).max(40).optional(),
  pillar: z.enum(PILLARS).optional(),
  track: z.enum(TRACKS).optional(),
  question_type: z.enum(TYPES).optional(),
  sequence_order: z.number().int().min(0).optional(),
  question_text: z.string().min(1).max(5000).optional(),
  scale_reversed: z.boolean().optional(),
  active: z.boolean().optional(),
  scoring_rubric: jsonField,
  integrity_flag_logic: jsonField,
  cross_ref_questions: jsonField,
})

export async function GET(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { questionId } = await params

  const supabase = await adminServiceClient()
  const { data, error } = await supabase.from('questions').select('*').eq('id', questionId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ question: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { questionId } = await params

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const supabase = await adminServiceClient()
  const { data, error } = await supabase.from('questions').update(parsed.data).eq('id', questionId).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `A question with that code already exists` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ question: data })
}
