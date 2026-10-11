// @ts-nocheck
// lib/admin/require-admin.ts
// Shared guard for admin-only API routes. Verifies the caller is logged in
// and has role='admin' on their profile, using their own session (not the
// service role) so this check itself is subject to normal RLS.

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AdminContext {
  userId: string
  fullName: string
}

export async function requireAdmin(): Promise<{ ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, ctx: { userId: user.id, fullName: profile.full_name ?? '' } }
}

/** Service-role client for admin write operations, after requireAdmin() has passed. */
export async function adminServiceClient() {
  return createServiceClient()
}
