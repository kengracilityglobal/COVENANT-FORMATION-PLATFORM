// app/api/emails/report-ready/route.ts
// Called internally when report generation finishes — see
// lib/report/generate.ts's ensureReportGenerated(), the single real
// trigger for this. (This comment previously pointed at
// app/api/assessment/[assessmentId]/generate-report/route.ts, which does
// not exist in this codebase — fixed during the v20 audit.)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { reportReadyEmail, type EmailTemplateData } from '../templates/eikon-email-templates'
import { getAppUrl } from '@/lib/env/app-url'

export async function POST(req: NextRequest) {
  const resend   = new Resend(process.env.RESEND_API_KEY)
  const supabase  = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assessment_id, user_id } = await req.json()
  if (!assessment_id || !user_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Idempotency: don't double-send
  const { data: existing } = await supabase
    .from('email_log')
    .select('id')
    .eq('recipient_id', user_id)
    .eq('email_type', 'report_ready')
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, skipped: 'already_sent' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', user_id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, overall_score, pillar_descriptors, priority_stack')
    .eq('id', assessment_id)
    .single()

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  const priorityStack   = assessment.priority_stack as string[] | null
  const topPillar       = priorityStack?.[0] ?? null
  const topDescriptor   = topPillar
    ? (assessment.pillar_descriptors as Record<string, string>)?.[topPillar]
    : null

  const firstName = (profile.full_name as string)?.split(' ')[0] ?? 'Friend'

  const templateData: EmailTemplateData = {
    full_name:               profile.full_name as string,
    first_name:              firstName,
    assessment_id,
    overall_score:           assessment.overall_score,
    top_priority_pillar:     topPillar ?? undefined,
    top_priority_descriptor: topDescriptor ?? undefined,
    // Fixed: these were built from process.env.NEXT_PUBLIC_APP_URL with no
    // fallback — an unset var meant every link in this email literally read
    // "undefined/report/...". getAppUrl(req) uses this request's own origin
    // when the env var isn't configured.
    report_url:              `${getAppUrl(req)}/report/${assessment_id}`,
    subscribe_url:           `${getAppUrl(req)}/subscribe?reason=report_ready_email`,
    unsubscribe_url:         `${getAppUrl(req)}/api/emails/unsubscribe?uid=${user_id}`,
  }

  const { subject, html, text } = reportReadyEmail(templateData)

  try {
    await resend.emails.send({
      from:    'Ken Ojiri · Covenant Formation <formation@gkmm.org>',
      to:      profile.email as string,
      subject,
      html,
      text,
    })

    await supabase.from('email_log').insert({
      recipient_id: user_id,
      email_type:   'report_ready',
      sent_at:      new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
