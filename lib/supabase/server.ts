// @ts-nocheck
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies cannot be set
          }
        },
      },
    }
  )
}

/**
 * True service-role client.
 *
 * IMPORTANT: this must NOT be built with @supabase/ssr's createServerClient and
 * request cookies. When a user session cookie is present, that library sends the
 * USER's JWT as the Authorization header instead of the service key, which means
 * Row Level Security applies and "service" writes silently fail (or, worse, run
 * with user permissions). A plain supabase-js client with no session storage
 * always authenticates with the service-role key and bypasses RLS as intended.
 *
 * Server-side only. Never import this into a client component.
 */
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('createServiceClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
