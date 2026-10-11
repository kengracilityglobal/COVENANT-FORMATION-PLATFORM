// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/admin/guides/route.ts
// GET: list guides. POST: promote an EXISTING registered user to guide, by
// email. A guide must already have a EIKON account (they sign up like anyone
// else) — this only grants the role. This mirrors how role changes actually
// work post-009: only an admin session (or the service role) may set
// profiles.role, so this endpoint is the only supported way to create a guide.

import { NextResponse } from 'next/server'
import { requireAdmin, adminServiceClient } from '@/lib/admin/require-admin'
import { z } from 'zod'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const supabase = await adminServiceClient()
  const { data, error } = await supabase
    .from('profiles').select('id, full_name, email, created_at').eq('role', 'guide').order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ guides: data ?? [] })
}

const promoteSchema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = promoteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

  const supabase = await adminServiceClient()
  const { data: target } = await supabase.from('profiles').select('id, role').eq('email', parsed.data.email).maybeSingle()

  if (!target) {
    return NextResponse.json({
      error: 'No account found for that email. The person must register at /register first, then you can promote them here.',
    }, { status: 404 })
  }
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'That user is an admin; demote them to guide from Participants instead.' }, { status: 400 })
  }
  if (target.role === 'guide') {
    return NextResponse.json({ error: 'That user is already a guide.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('profiles').update({ role: 'guide' }).eq('id', target.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ guide: data })
}
