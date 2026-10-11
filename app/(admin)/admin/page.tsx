// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalParticipants },
    { count: couplesPaired },
    { count: couplesPending },
    { count: activeGuides },
    { count: newRegistrations },
    { count: reportsGenerated },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'participant'),
    supabase.from('couples').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('couples').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'guide'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'participant').gte('created_at', sevenDaysAgo),
    supabase.from('assessments').select('id', { count: 'exact', head: true }).eq('status', 'report_generated').gte('report_generated_at', sevenDaysAgo),
  ])

  const stats = [
    { label: 'Total Participants', value: totalParticipants || 0, href: '/admin/participants' },
    { label: 'Couples Paired',     value: couplesPaired || 0,     href: null },
    { label: 'Couples Pending',    value: couplesPending || 0,    href: null },
    { label: 'Formation Guides',   value: activeGuides || 0,      href: '/admin/guides' },
    { label: 'New This Week',      value: newRegistrations || 0,  href: null },
    { label: 'Reports Generated',  value: reportsGenerated || 0,  href: null },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>SYSTEM</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="eikon-card p-5">
            <div className="font-display text-4xl font-bold mb-1" style={{ color: 'var(--gold)' }}>
              {stat.value}
            </div>
            <p className="text-xs pillar-number" style={{ color: 'var(--text-faint)' }}>{stat.label}</p>
            {stat.href && (
              <Link href={stat.href} className="text-xs font-display mt-2 block" style={{ color: 'var(--gold-muted)' }}>
                View →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Participants',     href: '/admin/participants',    icon: '◉' },
          { label: 'Question Bank',    href: '/admin/questions',       icon: '◇' },
          { label: 'Report Content',   href: '/admin/report-content',  icon: '◈' },
          { label: 'Guide Manager',    href: '/admin/guides',          icon: '▲' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="eikon-card p-5 flex items-center gap-3 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <span style={{ color: 'var(--gold)', fontSize: '18px' }}>{item.icon}</span>
            <span className="font-display font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
