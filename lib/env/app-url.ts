// lib/env/app-url.ts
//
// Every absolute URL this app builds server-side (auth redirects, payment
// callback redirects, links embedded in emails) used to read
// `process.env.NEXT_PUBLIC_APP_URL!` directly. If that variable is ever
// unset or misconfigured on the deploy target — which is exactly the kind
// of thing a first Vercel deployment gets wrong — every one of those call
// sites either throws ("Failed to construct 'URL'": NextResponse.redirect
// requires a real absolute URL) or silently embeds the literal string
// "undefined/..." into a link. The former is a 500 the person sees; the
// latter is a dead link they click days later with no idea why. This was
// the real cause of the logout 500 reported live on the deployed site —
// NEXT_PUBLIC_APP_URL was never set in Vercel's environment variables, and
// the logout route had no fallback.
//
// getAppUrl() prefers the configured env var (so the canonical production
// domain is used when it IS set, which matters for links that go out in
// emails and keep working after the request that generated them), but
// falls back to the incoming request's own origin whenever it's available
// — which is always correct for *this* deployment, configured or not — and
// only falls back to localhost when truly nothing else is known (local
// dev with no request object, e.g. a cron-only script).

export function getAppUrl(request?: Request | { url: string }): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && configured.trim() !== '') {
    return configured.replace(/\/+$/, '')
  }
  if (request) {
    try {
      return new URL(request.url).origin
    } catch {
      // fall through
    }
  }
  return 'http://localhost:3000'
}

/**
 * Same fallback behaviour as getAppUrl(), for a React Server Component,
 * which has no Request object to read a origin from. Falls back to the
 * incoming request's own Host header (via next/headers) when
 * NEXT_PUBLIC_APP_URL isn't configured — e.g. the guide-participant page's
 * server-side self-fetch of /api/guide/briefing, which previously fell back
 * to an empty string and failed silently whenever the env var was unset.
 */
export async function getAppUrlFromHeaders(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && configured.trim() !== '') {
    return configured.replace(/\/+$/, '')
  }
  try {
    const { headers } = await import('next/headers')
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (host) return `${proto}://${host}`
  } catch {
    // fall through — not in a request-scoped context
  }
  return 'http://localhost:3000'
}
