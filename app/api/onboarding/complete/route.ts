// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateInviteCode } from '@/lib/couples/helpers'

// Either joining an existing couple (invite_code, from the partner who
// registered second), starting a new one (track: premarital/married, from
// whoever registers first), or going solo (track: readiness — no couple
// at all, see migration 005). Never more than one path, never none — the
// onboarding UI enforces this before submit, this just re-checks it
// server-side.
const schema = z.object({
  relationship_history: z.object({
    years_together: z.string(),
    relationship_stage: z.string(),
    location: z.string(),
    previous_formation: z.string(),
    current_season: z.string(),
  }),
  invite_code: z.string().trim().toUpperCase().optional(),
  track: z.enum(['premarital', 'married', 'readiness']).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  const { relationship_history, invite_code, track } = parsed.data

  if (!invite_code && !track) {
    return NextResponse.json({ error: 'Either an invite code or a track selection is required' }, { status: 400 })
  }

  // Already paired from a previous onboarding attempt (e.g. a retry after a
  // network error) — don't create or join a second couple.
  const { data: existingCouple } = await serviceSupabase
    .from('couples')
    .select('id')
    .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
    .maybeSingle()

  // Solo readiness: no couple at all. Recorded on the profile so
  // /api/assessment/start knows what to create without a couples row to
  // read it from (see migration 005's profiles.intended_track column).
  if (track === 'readiness') {
    const { error: readinessErr } = await serviceSupabase
      .from('profiles')
      .update({ intended_track: 'readiness' })
      .eq('id', user.id)
    if (readinessErr) return NextResponse.json({ error: readinessErr.message }, { status: 500 })
  } else if (!existingCouple) {
    if (invite_code) {
      // Joining as partner_b. Runs as the service role deliberately — see
      // migration 002's guard_couple_columns trigger, which blocks an
      // ordinary authenticated user from setting partner_b_id on any
      // couple directly, including their own. This is the one legitimate
      // server-side path that's allowed to.
      const { data: couple, error: findErr } = await serviceSupabase
        .from('couples')
        .select('id, partner_a_id, partner_b_id, status')
        .eq('invite_code', invite_code)
        .maybeSingle()

      if (findErr || !couple) {
        return NextResponse.json({ error: 'That invite code was not found. Double-check it with your partner.' }, { status: 404 })
      }
      if (couple.partner_b_id) {
        return NextResponse.json({ error: 'That invite has already been used.' }, { status: 409 })
      }
      if (couple.partner_a_id === user.id) {
        return NextResponse.json({ error: 'That is your own invite code — share it with your partner instead.' }, { status: 400 })
      }

      const { error: joinErr } = await serviceSupabase
        .from('couples')
        .update({ partner_b_id: user.id, status: 'active' })
        .eq('id', couple.id)

      if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 })
    } else {
      // Starting a new couple as partner_a.
      const { error: createErr } = await serviceSupabase
        .from('couples')
        .insert({
          partner_a_id: user.id,
          track,
          status: 'pending',
          invite_code: generateInviteCode(),
        })

      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      relationship_history,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
