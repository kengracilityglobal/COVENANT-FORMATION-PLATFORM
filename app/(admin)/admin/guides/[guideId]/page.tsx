// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function GuideDetailPage({ params }: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: guide }, { data: couples }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', guideId).eq('role', 'guide').single(),
    supabase.from('couples').select('id, track, status, partner_a:profiles!couples_partner_a_id_fkey(full_name), partner_b:profiles!couples_partner_b_id_fkey(full_name)').eq('guide_id', guideId).order('created_at', { ascending: false }),
  ])

  if (!guide) notFound()

  return (
    <div className="space-y-6">
      <Link href="/admin/guides" className="text-xs" style={{ color: 'var(--gold-muted)' }}>← All Guides</Link>
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>ADMINISTRATION</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{guide.full_name}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>{guide.email} · Joined {formatDate(guide.created_at)}</p>
      </div>

      <div className="eikon-card p-6">
        <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>ASSIGNED COUPLES</p>
        <div className="space-y-2">
          {(couples ?? []).map((c: any) => {
            const nameA = c.partner_a?.full_name ?? 'Partner A'
            const nameB = c.partner_b?.full_name ?? '(awaiting partner)'
            return (
              <div key={c.id} className="flex items-center justify-between p-3"
                   style={{ background: 'var(--bg-elevated)', borderRadius: '2px', border: '1px solid var(--bg-border)' }}>
                <span className="text-sm font-display" style={{ color: 'var(--text-primary)' }}>{nameA} &amp; {nameB}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{c.track} · {c.status}</span>
                </div>
              </div>
            )
          })}
          {(!couples || couples.length === 0) && (
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              No couples assigned to this guide yet.
            </p>
          )}
        </div>
      </div>

      <div className="eikon-card p-5">
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          To remove this person's guide role, use <Link href={`/admin/participants?q=${encodeURIComponent(guide.email)}`} style={{ color: 'var(--gold-muted)' }}>Participants</Link> and change their role there.
        </p>
      </div>
    </div>
  )
}
