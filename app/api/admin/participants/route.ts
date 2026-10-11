// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/admin/participants/route.ts
// List/search participants (GET) and update a participant's role (PATCH).
// All writes go through the service role after requireAdmin() — profiles.role
// is otherwise locked by the column-guard trigger in migration 009, so this
// route is the only way to change it.
//
// Adapted for the couples model: there is no cohort_id/subscription_tier on
// profiles in this fork. Pairing status instead comes from the `couples`
// table (a profile sits in partner_a_id or partner_b_id), and assessment
// progress comes from `assessments`.

import { NextResponse } from 'next/server'
import { requireAdmin, adminServiceClient } from '@/lib/admin/require-admin'
import { z } from 'zod'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const role = searchParams.get('role') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = 25
  const offset = (page - 1) * limit

  const supabase = await adminServiceClient()
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, subscription_status, onboarding_completed, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  if (role) query = query.eq('role', role)

  const { data: profiles, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (profiles ?? []).map((p: any) => p.id)

  const [{ data: couples }, { data: assessments }] = ids.length
    ? await Promise.all([
        supabase
          .from('couples')
          .select('id, partner_a_id, partner_b_id, status, track')
          .or(`partner_a_id.in.(${ids.join(',')}),partner_b_id.in.(${ids.join(',')})`),
        supabase
          .from('assessments')
          .select('id, participant_id, status, track, created_at')
          .in('participant_id', ids)
          .order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }]

  const coupleByParticipant = new Map<string, any>()
  for (const c of couples ?? []) {
    if (c.partner_a_id) coupleByParticipant.set(c.partner_a_id, c)
    if (c.partner_b_id) coupleByParticipant.set(c.partner_b_id, c)
  }
  const latestAssessmentByParticipant = new Map<string, any>()
  for (const a of assessments ?? []) {
    if (!latestAssessmentByParticipant.has(a.participant_id)) {
      latestAssessmentByParticipant.set(a.participant_id, a)
    }
  }

  const participants = (profiles ?? []).map((p: any) => {
    const couple = coupleByParticipant.get(p.id) ?? null
    const coupleStatus = !couple
      ? 'unpaired'
      : couple.status === 'active'
        ? 'active'
        : 'pending_partner'
    return {
      ...p,
      couple_status: coupleStatus,
      couple_id: couple?.id ?? null,
      latest_assessment: latestAssessmentByParticipant.get(p.id) ?? null,
    }
  })

  return NextResponse.json({ participants, total: count ?? 0, page, limit })
}

const patchSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['participant', 'guide', 'admin']).optional(),
})

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  const { id, role } = parsed.data

  if (role === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = await adminServiceClient()

  // Guard against removing the platform's last admin.
  if (role !== 'admin') {
    const { data: target } = await supabase.from('profiles').select('role').eq('id', id).single()
    if (target?.role === 'admin') {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last remaining admin.' }, { status: 400 })
      }
    }
  }

  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ participant: data })
}
