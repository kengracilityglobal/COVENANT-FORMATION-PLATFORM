// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/admin/report-content/[id]/route.ts — edit one report_content row.
// Bumps version on every change so a future report build could diff against
// prior versions if needed; content is otherwise served by pillar+descriptor
// key lookups in lib/report/builder.ts.

import { NextResponse } from 'next/server'
import { requireAdmin, adminServiceClient } from '@/lib/admin/require-admin'
import { z } from 'zod'

const patchSchema = z.object({
  content_text: z.string().min(1).max(20000).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const supabase = await adminServiceClient()
  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
  if (parsed.data.content_text !== undefined) {
    const { data: current } = await supabase.from('report_content').select('version').eq('id', id).single()
    update.version = (current?.version ?? 1) + 1
  }

  const { data, error } = await supabase.from('report_content').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ content: data })
}
