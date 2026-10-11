// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FRUIT_ORDER } from '@/lib/formation/fruit'

// Uses the caller's own authenticated client throughout — RLS (migration
// 004's fruit_reflections_* policies) does the real enforcement here, not
// this route. A participant can only ever read/write their own rows.

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('fruit_reflections')
    .select('fruit, reflection_text, shared_with_guide, updated_at')
    .eq('participant_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reflections: data ?? [] })
}

const schema = z.object({
  fruit: z.enum(FRUIT_ORDER as [string, ...string[]]),
  reflection_text: z.string().trim().min(1).max(4000),
  shared_with_guide: z.boolean().optional(),
})

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  // One row per person per fruit (migration 005's unique index) — upsert
  // keeps this a single evolving reflection rather than a growing log.
  const { error } = await supabase
    .from('fruit_reflections')
    .upsert({
      participant_id: user.id,
      fruit: parsed.data.fruit,
      reflection_text: parsed.data.reflection_text,
      shared_with_guide: parsed.data.shared_with_guide ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'participant_id,fruit' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
