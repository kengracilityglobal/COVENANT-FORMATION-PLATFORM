// @ts-nocheck
import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center p-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div>
        <p className="font-display font-bold tracking-[0.3em] text-5xl mb-6" style={{ color: 'var(--gold)', opacity: 0.3 }}>
          404
        </p>
        <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="formation-prose mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-gold">
          Return to Dashboard →
        </Link>
      </div>
    </div>
  )
}
