// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCoupleForUser, partnerSlot, otherPartnerId } from '@/lib/couples/helpers'
import { RadarChart } from '@/components/ui/RadarChart'
import { CopyInviteButton } from './CopyInviteButton'
import type { AssessmentStatus } from '@/types'
import { DESCRIPTOR_COLORS, PILLAR_DISPLAY_NAMES } from '@/types'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'

const STATUS_LABEL: Record<AssessmentStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  report_generated: 'Completed',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const couple = await getCoupleForUser(supabase, user.id)

  // No couple — either a solo Readiness participant (by design, see
  // migration 004), or someone who hasn't finished onboarding/pairing yet.
  if (!couple) {
    if (profile.intended_track === 'readiness') {
      return <SoloDashboard profile={profile} supabase={supabase} userId={user.id} />
    }
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="mb-8 font-display text-6xl" style={{ color: 'var(--gold)', opacity: 0.4 }}>◇</div>
        <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Let&rsquo;s finish setting up.
        </h1>
        <p className="formation-prose text-lg mb-10 max-w-md mx-auto">
          We don&rsquo;t have you paired with your spouse yet. Complete onboarding to start
          fresh or join your spouse with an invite code.
        </p>
        <Link href="/onboarding" className="btn-gold text-lg px-10 py-4">
          Complete Onboarding →
        </Link>
      </div>
    )
  }

  const mySlot = partnerSlot(couple, user.id)
  const partnerId = otherPartnerId(couple, user.id)
  const partnerHasJoined = !!couple.partner_b_id

  // My own assessment — ordinary RLS-respecting client, this is my own row.
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status, overall_score, pillar_scores, pillar_descriptors, priority_stack, pillar_score_overrides, completed_at, report_generated_at')
    .eq('participant_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // A Guide's score override (migration 013) must be reflected here, not just
  // on the Guide's own view — see lib/scoring/effective-scores.ts.
  if (assessment?.pillar_scores) {
    const effective = computeEffectiveScores(assessment.pillar_scores, assessment.pillar_score_overrides)
    Object.assign(assessment, {
      pillar_scores: effective.pillar_scores,
      pillar_descriptors: effective.pillar_descriptors,
      priority_stack: effective.priority_stack,
      overall_score: effective.overall_score,
    })
  }

  // The partner's name and coarse assessment status only — never their
  // scores or answers, which RLS wouldn't hand us through the normal client
  // anyway. See lib/couples/helpers.ts and the Couple interface in types/index.ts.
  let partnerName: string | null = null
  let partnerStatus: AssessmentStatus | null = null
  if (partnerId) {
    const service = await createServiceClient()
    const [{ data: partnerProfile }, { data: partnerAssessment }] = await Promise.all([
      service.from('profiles').select('full_name').eq('id', partnerId).maybeSingle(),
      service.from('assessments')
        .select('status')
        .eq('participant_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    partnerName = partnerProfile?.full_name ?? null
    partnerStatus = (partnerAssessment?.status as AssessmentStatus) ?? 'not_started'
  }

  const myStatus: AssessmentStatus = assessment?.status ?? 'not_started'
  const myReportReady = myStatus === 'completed' || myStatus === 'report_generated'
  const partnerReportReady = partnerStatus === 'completed' || partnerStatus === 'report_generated'
  const bothReportReady = myReportReady && partnerReportReady

  const scores = (assessment?.pillar_scores || {}) as Record<string, number>
  const descriptors = (assessment?.pillar_descriptors || {}) as Record<string, string>
  const priorityStack = (assessment?.priority_stack || []) as string[]

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>
          FORMATION DASHBOARD
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {profile.full_name?.split(' ')[0]}&rsquo;s Journey
        </h1>
      </div>

      {/* Invite code — only while waiting for a partner to join */}
      {!partnerHasJoined && mySlot === 'partner_a' && (
        <div
          className="p-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(184,151,42,0.2)',
            borderRadius: '2px',
            borderLeft: '3px solid var(--gold)',
          }}
        >
          <p className="pillar-number text-xs mb-2" style={{ color: 'var(--gold-muted)' }}>
            WAITING FOR YOUR SPOUSE
          </p>
          <p className="formation-prose mb-4">
            Share this code with your spouse so they can join your formation journey.
            Both of you take the assessment separately — your report stays private until
            you&rsquo;ve both finished.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className="font-display text-2xl font-bold tracking-[0.3em] px-5 py-3"
              style={{ background: 'var(--bg-elevated)', color: 'var(--gold)', borderRadius: '2px' }}
            >
              {couple.invite_code}
            </span>
            <CopyInviteButton code={couple.invite_code} />
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col: my status + radar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="eikon-card p-6">
            <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
              YOUR ASSESSMENT
            </p>
            <p className="font-display text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {STATUS_LABEL[myStatus]}
            </p>

            {myStatus === 'not_started' && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  Your formation journey begins with the assessment. It takes sixty to
                  ninety minutes and requires your complete honesty.
                </p>
                <Link href="/assessment" className="btn-gold block text-center py-3">
                  Begin the Assessment →
                </Link>
              </>
            )}

            {myStatus === 'in_progress' && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  You have begun the assessment. Continue where you left off.
                </p>
                <Link href="/assessment" className="btn-gold block text-center py-3">
                  Continue Assessment →
                </Link>
              </>
            )}

            {myReportReady && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  {bothReportReady
                    ? 'Your report is ready, and includes how your answers align with your spouse’s.'
                    : 'Your report is ready. The dyadic gap will appear once your spouse completes theirs too.'}
                </p>
                <Link href={`/report/${assessment.id}`} className="btn-gold block text-center py-3">
                  View My Report →
                </Link>
              </>
            )}
          </div>

          {myReportReady && Object.keys(scores).length > 0 && (
            <div className="eikon-card p-6 flex flex-col items-center">
              <p className="pillar-number text-xs mb-4 self-start" style={{ color: 'var(--gold-muted)' }}>
                FORMATION PROFILE
              </p>
              <RadarChart scores={scores} size={260} showLabels={true} />
              <div className="mt-4 text-center">
                <p className="font-display text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                  {assessment?.overall_score ? Math.round(assessment.overall_score) : '—'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  Overall Formation Score
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right col: partner + priorities */}
        <div className="lg:col-span-2 space-y-6">

          {/* Partner status */}
          <div className="eikon-card p-6">
            <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
              YOUR SPOUSE
            </p>
            {!partnerHasJoined ? (
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                Waiting for your spouse to join with the invite code above.
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-medium" style={{ color: 'var(--text-primary)' }}>
                    {partnerName || 'Your spouse'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Assessment: {partnerStatus ? STATUS_LABEL[partnerStatus] : 'Not started'}
                  </p>
                </div>
                {partnerStatus && (
                  <span
                    className="text-xs font-display px-3 py-1"
                    style={{
                      borderRadius: '2px',
                      color: partnerReportReady ? '#7ABF7C' : 'var(--text-faint)',
                      border: `1px solid ${partnerReportReady ? 'rgba(122,191,124,0.4)' : 'var(--bg-border)'}`,
                    }}
                  >
                    {partnerReportReady ? '● Complete' : partnerStatus === 'in_progress' ? '● In progress' : '○ Not started'}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
              Your spouse&rsquo;s individual scores and answers stay private to them until both
              of you have completed your reports.
            </p>
          </div>

          {/* Formation priority */}
          {priorityStack.length > 0 && (
            <div className="eikon-card p-6">
              <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
                FORMATION PRIORITY
              </p>
              <div className="space-y-2">
                {priorityStack.slice(0, 8).map((pillar, i) => {
                  const score = scores[pillar] || 0
                  const descriptor = descriptors[pillar] || 'growing'
                  const color = DESCRIPTOR_COLORS[descriptor]
                  return (
                    <div key={pillar} className="flex items-center gap-3">
                      <span className="text-xs font-display font-bold w-4 text-right flex-shrink-0"
                            style={{ color: i === 0 ? 'var(--gold)' : 'var(--text-faint)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-display" style={{ color: 'var(--text-secondary)' }}>
                            {PILLAR_DISPLAY_NAMES[pillar]}
                          </span>
                          <span className="text-xs font-bold" style={{ color }}>
                            {Math.round(score)}
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
                          <div className="h-full" style={{ width: `${score}%`, background: color, opacity: 0.7 }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Solo Readiness dashboard ──────────────────────────────────────
// No couple, no partner panel, no invite code — a single person's own
// readiness picture. See migration 004 / docs/VERIFICATION.md.
async function SoloDashboard({ profile, supabase, userId }: { profile: any; supabase: any; userId: string }) {
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status, overall_score, pillar_scores, pillar_descriptors, priority_stack, pillar_score_overrides')
    .eq('participant_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (assessment?.pillar_scores) {
    const effective = computeEffectiveScores(assessment.pillar_scores, assessment.pillar_score_overrides)
    Object.assign(assessment, {
      pillar_scores: effective.pillar_scores,
      pillar_descriptors: effective.pillar_descriptors,
      priority_stack: effective.priority_stack,
      overall_score: effective.overall_score,
    })
  }

  const myStatus: AssessmentStatus = assessment?.status ?? 'not_started'
  const myReportReady = myStatus === 'completed' || myStatus === 'report_generated'
  const scores = (assessment?.pillar_scores || {}) as Record<string, number>
  const descriptors = (assessment?.pillar_descriptors || {}) as Record<string, string>
  const priorityStack = (assessment?.priority_stack || []) as string[]

  return (
    <div className="space-y-8">
      <div>
        <p className="pillar-number tracking-widest mb-1" style={{ color: 'var(--gold-muted)' }}>
          READINESS DASHBOARD
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {profile.full_name?.split(' ')[0]}&rsquo;s Readiness
        </h1>
        <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--text-muted)' }}>
          You're taking this on your own — there's no partner panel here, and no comparison to show.
          If you invite a partner later, you'll move into the shared track together.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="eikon-card p-6">
            <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
              YOUR ASSESSMENT
            </p>
            <p className="font-display text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {STATUS_LABEL[myStatus]}
            </p>

            {myStatus === 'not_started' && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  Forty-eight questions, about fifteen to eighteen minutes, with complete honesty.
                </p>
                <Link href="/assessment" className="btn-gold block text-center py-3">
                  Begin the Assessment →
                </Link>
              </>
            )}

            {myStatus === 'in_progress' && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  You have begun. Continue where you left off.
                </p>
                <Link href="/assessment" className="btn-gold block text-center py-3">
                  Continue Assessment →
                </Link>
              </>
            )}

            {myReportReady && (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  Your readiness report is ready.
                </p>
                <Link href={`/report/${assessment.id}`} className="btn-gold block text-center py-3">
                  View My Report →
                </Link>
              </>
            )}
          </div>

          {myReportReady && Object.keys(scores).length > 0 && (
            <div className="eikon-card p-6 flex flex-col items-center">
              <p className="pillar-number text-xs mb-4 self-start" style={{ color: 'var(--gold-muted)' }}>
                READINESS PROFILE
              </p>
              <RadarChart scores={scores} size={260} showLabels={true} />
              <div className="mt-4 text-center">
                <p className="font-display text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                  {assessment?.overall_score ? Math.round(assessment.overall_score) : '—'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  Overall Readiness Picture
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {priorityStack.length > 0 && (
            <div className="eikon-card p-6">
              <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
                WHERE TO BEGIN
              </p>
              <div className="space-y-2">
                {priorityStack.slice(0, 8).map((pillar, i) => {
                  const score = scores[pillar] || 0
                  const descriptor = descriptors[pillar] || 'growing'
                  const color = DESCRIPTOR_COLORS[descriptor]
                  return (
                    <div key={pillar} className="flex items-center gap-3">
                      <span className="text-xs font-display font-bold w-4 text-right flex-shrink-0"
                            style={{ color: i === 0 ? 'var(--gold)' : 'var(--text-faint)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-display" style={{ color: 'var(--text-secondary)' }}>
                            {PILLAR_DISPLAY_NAMES[pillar]}
                          </span>
                          <span className="text-xs font-bold" style={{ color }}>
                            {Math.round(score)}
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
                          <div className="h-full" style={{ width: `${score}%`, background: color, opacity: 0.7 }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="eikon-card p-6">
            <p className="pillar-number text-xs mb-3" style={{ color: 'var(--gold-muted)' }}>
              ALREADY SEEING SOMEONE?
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This solo track has no partner comparison. If things move toward engagement, you and your
              partner can each start fresh on the shared Premarital track from your own accounts — that
              one includes the Perception Gap between your two sets of answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
