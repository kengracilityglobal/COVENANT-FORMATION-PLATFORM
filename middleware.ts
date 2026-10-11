import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/auth/callback', '/auth/reset-password', '/auth/update-password', '/taster', '/privacy', '/terms']

// Server-to-server routes authenticated by a shared secret rather than a user
// session (cron sweeps, payment webhooks, internal report/email triggers, and
// the unsubscribe link clicked from an email with no logged-in session). These
// must never be redirected to the login page — the original version of this
// middleware only exempted /api/cron/ and /api/payments/, so every other
// internal-secret route (report portrait generation, the report-ready email,
// generate-for-participant) was unreachable in production: middleware
// redirected the request to a login page before the handler ever ran, so the
// server-to-server call got back an HTML redirect instead of JSON and failed.
const INTERNAL_SECRET_PATHS = [
  '/api/report/portrait',
  '/api/report/generate-for-participant',
  '/api/emails/report-ready',
]

const GUIDE_PATHS  = ['/guide']
const ADMIN_PATHS  = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Cron routes — verified by secret header only ──────────────────────────
  if (pathname.startsWith('/api/cron/')) {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return supabaseResponse
  }

  // ── Payment webhooks — verified by provider signatures ────────────────────
  if (pathname.startsWith('/api/payments/')) return supabaseResponse

  // ── Server-to-server routes verified by a shared secret, not a session ────
  if (INTERNAL_SECRET_PATHS.includes(pathname)) return supabaseResponse

  // ── Unsubscribe link — clicked from an email, no session, verified by its own token ──
  if (pathname === '/api/emails/unsubscribe') return supabaseResponse

  // ── Auth callback ─────────────────────────────────────────────────────────
  if (pathname === '/auth/callback') return supabaseResponse

  // ── Not logged in → login (preserve redirect target) ─────────────────────
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── Logged in → skip auth pages ───────────────────────────────────────────
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Role + onboarding enforcement ──────────────────────────────────────────
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    const role           = profile?.role
    const onboardingDone = profile?.onboarding_completed

    // Onboarding (including pairing with a spouse) is required before any
    // real participant feature — there is no v1 paywall, so every onboarded
    // user is fully entitled.
    const ONBOARDING_REQUIRED_PATHS = ['/dashboard', '/assessment', '/report']
    const requiresOnboarding = ONBOARDING_REQUIRED_PATHS.some(p => pathname.startsWith(p))

    if (role === 'participant' && !onboardingDone && requiresOnboarding && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Role boundary enforcement
    if (role === 'participant' && (
      GUIDE_PATHS.some(p => pathname.startsWith(p)) ||
      ADMIN_PATHS.some(p => pathname.startsWith(p))
    )) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (role === 'guide' && ADMIN_PATHS.some(p => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = '/guide/dashboard'
      return NextResponse.redirect(url)
    }

    if (role === 'guide' && pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = '/guide/dashboard'
      return NextResponse.redirect(url)
    }

    if (role === 'admin' && pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
