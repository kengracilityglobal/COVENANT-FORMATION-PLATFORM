// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'guide') redirect('/dashboard')

  const navItems = [
    { href: '/guide/dashboard', label: 'Dashboard',  icon: '◈' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col"
             style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)', zIndex: 40 }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <Link href="/guide/dashboard">
            <span className="font-display font-bold tracking-[0.15em] text-xl" style={{ color: 'var(--gold)' }}>COVENANT</span>
          </Link>
          <p className="text-xs mt-1 pillar-number" style={{ color: 'var(--text-faint)' }}>FORMATION GUIDE</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-display transition-colors"
                  style={{ color: 'var(--text-muted)', borderRadius: '2px' }}>
              <span style={{ color: 'var(--gold-muted)' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <p className="text-sm font-display px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
            {profile?.full_name}
          </p>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xs px-2 py-1 font-display"
                    style={{ color: 'var(--text-faint)', background: 'transparent', cursor: 'pointer' }}>
              Sign out →
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
