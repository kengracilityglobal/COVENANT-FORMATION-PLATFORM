// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

async function ParticipantNav({ profile, reportAssessmentId }: { profile: Profile; reportAssessmentId: string | null }) {
  const navItems = [
    { href: '/dashboard',    label: 'Dashboard',   icon: '◈' },
    { href: '/assessment',   label: 'Assessment',  icon: '◇' },
    ...(reportAssessmentId ? [{ href: `/report/${reportAssessmentId}`, label: 'Report', icon: '❖' }] : []),
    { href: '/fruit',        label: 'Fruit of the Spirit', icon: '✦' },
    { href: '/settings',     label: 'Settings',    icon: '⊕' },
  ]

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div className="p-6" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <Link href="/dashboard">
          <span className="font-display font-bold tracking-[0.2em] text-2xl" style={{ color: 'var(--gold)' }}>
            COVENANT
          </span>
        </Link>
        <p className="text-xs mt-1 pillar-number" style={{ color: 'var(--text-faint)' }}>
          MARRIAGE FORMATION
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded transition-colors text-sm font-display"
            style={{
              color: 'var(--text-muted)',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--gold-muted)', fontSize: '0.9rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Profile footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--gold)' }}
          >
            {(profile.full_name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {profile.full_name}
            </p>
            <p className="text-xs truncate capitalize" style={{ color: 'var(--text-faint)' }}>
              {profile.role}
            </p>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button
            type="submit"
            className="w-full text-left px-4 py-2 text-xs font-display transition-colors"
            style={{ color: 'var(--text-faint)', background: 'transparent', cursor: 'pointer' }}
          >
            Sign out →
          </button>
        </form>
      </div>
    </aside>
  )
}

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Only link to the report from the nav once one actually exists to view.
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('participant_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const reportAssessmentId =
    assessment && (assessment.status === 'completed' || assessment.status === 'report_generated')
      ? assessment.id
      : null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <ParticipantNav profile={profile as Profile} reportAssessmentId={reportAssessmentId} />

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
