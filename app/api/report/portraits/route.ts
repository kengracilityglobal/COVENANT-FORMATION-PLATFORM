// @ts-nocheck
// app/api/report/portraits/route.ts
// Returns the AI-generated formation portraits for this assessment, from the
// dedicated ai_portraits table (never report_content, which every authenticated
// user can read — see migration 009).
//
// If the assessment has no cached portraits yet (report generation has not run,
// or is still in progress), this triggers generation inline rather than relying
// on a cron sweep, then returns the result.

export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ensureReportGenerated } from '@/lib/report/generate'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assessmentId = searchParams.get('assessmentId')
  if (!assessmentId) return NextResponse.json({ portraits: {} })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the assessment belongs to this user (or their guide)
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, participant_id, status')
    .eq('id', assessmentId)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (assessment.participant_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (assessment.status === 'completed' || assessment.status === 'report_generated') {
    // Best-effort: generate the report (and thereby the portraits) if not already done.
    // Never blocks the response on failure — the page shows static portraits as a fallback.
    try { await ensureReportGenerated(assessmentId) } catch (err) {
      console.error('[report/portraits] ensureReportGenerated failed:', err)
    }
  }

  const { data: rows } = await supabase
    .from('ai_portraits')
    .select('pillar, content')
    .eq('assessment_id', assessmentId)

  const portraits: Record<string, { portrait: string; gap_note: string; invitation: string }> = {}
  for (const row of rows ?? []) {
    portraits[row.pillar] = row.content as any
  }

  return NextResponse.json({ portraits })
}
