// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/admin/questions/route.ts — create a question (admin only).
// Mirrors app/api/admin/report-content/route.ts. jsonb fields arrive from the
// UI as raw JSON text and are parsed+validated here so a malformed rubric can
// never reach the question bank (it would silently break scoring for every
// participant who draws this question).
//
// Pillar and track match this fork's actual `questions` schema (migration
// 001): the 8 covenant pillars (not EIKON's 7), the 3 real question_type
// values, and a required `track` ('premarital' | 'married') — there is no
// extended_module_trigger or gap_profile_tags column here.

import { NextResponse } from 'next/server'
import { requireAdmin, adminServiceClient } from '@/lib/admin/require-admin'
import { z } from 'zod'
import { CORE_PILLAR_ORDER } from '@/types'

const PILLARS = [...CORE_PILLAR_ORDER, 'cross_pillar'] as const
const TYPES = ['scenario', 'frequency', 'reflective_disclosure'] as const
const TRACKS = ['premarital', 'married'] as const

const jsonField = z.string().optional().transform((val, ctx) => {
  if (!val || val.trim() === '') return null
  try {
    return JSON.parse(val)
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Must be valid JSON' })
    return z.NEVER
  }
})

const createSchema = z.object({
  code: z.string().min(2).max(40),
  pillar: z.enum(PILLARS),
  track: z.enum(TRACKS),
  question_type: z.enum(TYPES),
  sequence_order: z.number().int().min(0),
  question_text: z.string().min(1).max(5000),
  scale_reversed: z.boolean().default(false),
  active: z.boolean().default(true),
  scoring_rubric: jsonField,
  integrity_flag_logic: jsonField,
  cross_ref_questions: jsonField,
})

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })

  const supabase = await adminServiceClient()
  const { data, error } = await supabase.from('questions').insert({
    code: parsed.data.code,
    pillar: parsed.data.pillar,
    track: parsed.data.track,
    question_type: parsed.data.question_type,
    sequence_order: parsed.data.sequence_order,
    question_text: parsed.data.question_text,
    scale_reversed: parsed.data.scale_reversed,
    active: parsed.data.active,
    scoring_rubric: parsed.data.scoring_rubric ?? {},
    integrity_flag_logic: parsed.data.integrity_flag_logic,
    cross_ref_questions: parsed.data.cross_ref_questions,
  }).select().single()

  if (error) {
    // code is UNIQUE — surface a clear message rather than a raw constraint error
    if (error.code === '23505') return NextResponse.json({ error: `A question with code "${parsed.data.code}" already exists` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ question: data })
}
