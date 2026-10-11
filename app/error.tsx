// @ts-nocheck
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    // Example: Sentry.captureException(error)
    // Never expose raw error details to the browser in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Dev only] Error boundary caught:', error)
    }
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center text-center p-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div>
        <p className="font-display font-bold tracking-[0.3em] text-4xl mb-6" style={{ color: 'var(--unengaged)', opacity: 0.4 }}>
          ✕
        </p>
        <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Something went wrong
        </h1>
        <p className="formation-prose mb-8 max-w-sm mx-auto">
          An unexpected error occurred. Your formation data is safe.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="btn-gold">Try again</button>
          <a href="/dashboard" className="btn-ghost">Dashboard</a>
        </div>
      </div>
    </div>
  )
}
