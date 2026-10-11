// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function GuidesAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: guides } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('role', 'guide')
    .order('created_at', { ascending: false })

  const guideIds = (guides || []).map((g) => g.id)
  const { data: couples } = guideIds.length
    ? await supabase.from('couples').select('guide_id, status, track').in('guide_id', guideIds)
    : { data: [] }

  const coupleMap = new Map<string, any[]>()
  for (const c of couples || []) {
    if (!coupleMap.has(c.guide_id)) coupleMap.set(c.guide_id, [])
    coupleMap.get(c.guide_id)!.push(c)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ADMINISTRATION</p>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Guide Manager</h1>
        </div>
        <Link href="/admin/guides/new" className="btn-gold text-sm">+ Add Guide</Link>
      </div>

      <div className="space-y-3">
        {(guides || []).map((guide) => {
          const guideCouples = coupleMap.get(guide.id) || []
          const activeCouples = guideCouples.filter((c) => c.status === 'active')
          return (
            <div key={guide.id} className="eikon-card p-5 flex items-start gap-5 flex-wrap">
              <div className="w-10 h-10 flex items-center justify-center font-display font-bold flex-shrink-0"
                   style={{ background: 'var(--bg-elevated)', color: 'var(--gold)', borderRadius: '2px' }}>
                {(guide.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                  {guide.full_name}
                </h3>
                <div className="flex gap-4 text-xs flex-wrap" style={{ color: 'var(--text-faint)' }}>
                  <span>{guide.email}</span>
                  <span>Active couples: <strong style={{ color: 'var(--gold)' }}>{activeCouples.length}</strong></span>
                  <span>Total couples: {guideCouples.length}</span>
                  <span>Joined: {formatDate(guide.created_at)}</span>
                </div>
              </div>
              <Link href={`/admin/guides/${guide.id}`} className="btn-ghost text-sm flex-shrink-0">
                View →
              </Link>
            </div>
          )
        })}

        {(!guides || guides.length === 0) && (
          <div className="eikon-card p-10 text-center">
            <p className="formation-prose mb-6">No Formation Guides yet.</p>
            <Link href="/admin/guides/new" className="btn-gold">Add First Guide</Link>
          </div>
        )}
      </div>
    </div>
  )
}
