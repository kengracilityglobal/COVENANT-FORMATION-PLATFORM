// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/assessment/latest-status/route.ts
// Returns the status and id of the participant's most recent assessment.
// Used by PaymentPendingBanner to poll until report_generated.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('participant_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assessment) return NextResponse.json({ status: 'none' })

  return NextResponse.json({
    assessment_id: assessment.id,
    status:        assessment.status,
  })
}
