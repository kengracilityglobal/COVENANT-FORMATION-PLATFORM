// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/guide/participants/route.ts
// Returns the Guide's assigned COUPLES — this schema has no cohorts table;
// a Guide is assigned per-couple via couples.guide_id (see
// supabase/migrations/001_initial_schema.sql).

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: guide } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (guide?.role !== 'guide' && guide?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: couples } = await supabase
    .from('couples')
    .select('id, partner_a_id, partner_b_id, track, status, cycle_number, created_at')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })

  // Individual (readiness-track) participants assigned directly on their profile.
  const { data: soloRows } = await supabase
    .from('profiles').select('id, full_name, email').eq('guide_id', user.id)
  const coupledIds = new Set((couples ?? []).flatMap(c => [c.partner_a_id, c.partner_b_id].filter(Boolean)))
  const solo = (soloRows ?? []).filter(p => !coupledIds.has(p.id))

  if (!couples?.length) return NextResponse.json({ couples: [], solo })

  const partnerIds = Array.from(
    new Set(couples.flatMap(c => [c.partner_a_id, c.partner_b_id].filter(Boolean)))
  ) as string[]

  const [{ data: profiles }, { data: assessments }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', partnerIds),
    supabase
      .from('assessments')
      .select('id, participant_id, couple_id, status, overall_score, created_at')
      .in('couple_id', couples.map(c => c.id))
      .order('created_at', { ascending: false }),
  ])

  const profileById = new Map((profiles ?? []).map(p => [p.id, p]))
  const latestAssessmentByParticipant = new Map<string, any>()
  for (const a of assessments ?? []) {
    if (!latestAssessmentByParticipant.has(a.participant_id)) {
      latestAssessmentByParticipant.set(a.participant_id, a)
    }
  }

  const enriched = couples.map(c => ({
    ...c,
    partner_a: c.partner_a_id ? profileById.get(c.partner_a_id) ?? null : null,
    partner_b: c.partner_b_id ? profileById.get(c.partner_b_id) ?? null : null,
    partner_a_assessment: c.partner_a_id ? latestAssessmentByParticipant.get(c.partner_a_id) ?? null : null,
    partner_b_assessment: c.partner_b_id ? latestAssessmentByParticipant.get(c.partner_b_id) ?? null : null,
  }))

  return NextResponse.json({ couples: enriched, solo })
}
