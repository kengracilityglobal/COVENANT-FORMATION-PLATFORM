// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/env/app-url'

// Fixed: this previously built the redirect target from
// process.env.NEXT_PUBLIC_APP_URL! with no fallback. On a deployment where
// that variable isn't set (confirmed to be the case here — this was the
// real cause of the "HTTP ERROR 500 on logout" reported from the live
// site), `new URL('/login', undefined)` throws, and the thrown error is
// what the person saw as a 500. getAppUrl(request) falls back to the
// request's own origin, which is always correct regardless of env config.
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', getAppUrl(request)))
}
