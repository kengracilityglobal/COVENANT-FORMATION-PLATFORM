// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/couple/me/route.ts
//
// Returns the signed-in user's couple pairing plus just enough about their
// partner to drive the dashboard: display name and assessment status.
// Never the partner's scores, descriptors or answers — that stays private
// until both reports exist (see lib/report/**, out of scope here).

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCoupleForUser, partnerSlot, otherPartnerId } from '@/lib/couples/helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const couple = await getCoupleForUser(supabase, user.id)
  if (!couple) return NextResponse.json({ couple: null })

  const slot = partnerSlot(couple, user.id)
  const partnerId = otherPartnerId(couple, user.id)

  // RLS only lets a user read their OWN profile/assessment rows — there is
  // no "partner can read partner" policy, by design (their answers and
  // scores stay private). The service client is used here only to fetch
  // the partner's name and a coarse assessment status, never their scores.
  const service = await createServiceClient()

  let partner: { id: string; full_name: string } | null = null
  let partnerAssessmentStatus: string | null = null

  if (partnerId) {
    const [{ data: partnerProfile }, { data: partnerAssessment }] = await Promise.all([
      service.from('profiles').select('id, full_name').eq('id', partnerId).maybeSingle(),
      service.from('assessments')
        .select('status')
        .eq('participant_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    partner = partnerProfile
    partnerAssessmentStatus = partnerAssessment?.status ?? 'not_started'
  }

  return NextResponse.json({
    couple: {
      id: couple.id,
      track: couple.track,
      status: couple.status,
      invite_code: couple.invite_code,
      cycle_number: couple.cycle_number,
    },
    my_slot: slot,
    partner_joined: !!couple.partner_b_id,
    partner: partner ? { id: partner.id, full_name: partner.full_name } : null,
    partner_assessment_status: partnerAssessmentStatus,
  })
}
