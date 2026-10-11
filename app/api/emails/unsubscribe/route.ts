// app/api/emails/unsubscribe/route.ts
// Handles one-click unsubscribe from formation email sequence.
// Does NOT cancel subscription — only stops marketing/formation emails.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const uid = req.nextUrl.searchParams.get('uid')

  if (!uid) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 })
  }

  // profiles has no `formation_emails_opted_out` column — email preference
  // lives inside the jsonb `notification_preferences` field instead (see
  // supabase/migrations/001_initial_schema.sql). Merge the opt-out in
  // rather than overwriting the whole object, so other preferences survive.
  const { data: existing } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', uid)
    .maybeSingle()

  await supabase
    .from('profiles')
    .update({
      notification_preferences: {
        ...(existing?.notification_preferences ?? {}),
        formation_reminders: false,
      },
    })
    .eq('id', uid)

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><title>Unsubscribed</title></head>
<body style="background:#0D0B08;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;padding:40px;">
    <p style="font-size:20px;font-weight:700;color:#B8972A;letter-spacing:0.1em;margin:0 0 16px;">COVENANT FORMATION</p>
    <p style="color:#C4A96A;font-size:16px;margin:0 0 12px;">You have been unsubscribed from formation emails.</p>
    <p style="color:#8A7340;font-size:13px;margin:0;">Your assessment data and any active subscription are not affected.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
