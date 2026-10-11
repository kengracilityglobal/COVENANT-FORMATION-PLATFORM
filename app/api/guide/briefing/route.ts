// @ts-nocheck
export const dynamic = 'force-dynamic'
// app/api/guide/briefing/route.ts
// Returns an AI-generated pre-session briefing for a COUPLE — re-keyed from
// EIKON's per-participant version. guide_briefings is keyed to couple_id,
// not participant_id (see supabase/migrations/001_initial_schema.sql),
// because a Guide prepares for a couple, not for one partner in isolation.
//
// Simplified from EIKON's version: no cultural-context profile, session
// protocols, journal entries, Fruit-of-the-Spirit reflections, or prior
// session notes — none of those tables exist in this schema. The briefing
// now draws only on what actually exists: both partners' pillar scores
// and the dyadic Perception Gap between them.

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { callClaudeJSON, isClaudeConfigured } from '@/lib/ai/claude'
import { computeEffectiveScores } from '@/lib/scoring/effective-scores'
import { computeCoupleGap } from '@/lib/scoring/gap'
import { PILLAR_DISPLAY_NAMES } from '@/types'

const SYSTEM_PROMPT = `You are the Covenant Formation Guide Intelligence. You prepare a pre-session briefing for a Formation Guide before they meet with a couple. Return JSON only — no preamble, no markdown.

The briefing must be:
- Actionable, not descriptive — the Guide should finish reading and know exactly what to do
- Honest about what the data cannot tell you
- Respectful of the Guide's pastoral judgment — you are informing it, not replacing it
- Focused on the dyadic gap between the two partners' answers, not just either partner's individual scores — an unseen gap is the formation risk this platform exists to catch
- Under 400 words total across all fields

Return this exact JSON shape:
{
  "headline": "One sentence: the single most important thing for this session.",
  "what_is_present": "2-3 sentences on genuine strength visible in the couple's scores.",
  "what_to_probe": [
    { "observation": "What the data shows (1 sentence).", "probe_question": "The exact question to ask the couple together." },
    { "observation": "...", "probe_question": "..." }
  ],
  "watch_for": "1-2 sentences on a pattern that may not surface unless the Guide creates space for it.",
  "data_limits": "1 sentence honest about what this briefing cannot see."
}`

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const participantId = searchParams.get('participantId')
  const coupleIdParam = searchParams.get('coupleId')
  if (!participantId && !coupleIdParam) {
    return NextResponse.json({ error: 'participantId or coupleId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: couple } = coupleIdParam
    ? await supabase.from('couples').select('*').eq('id', coupleIdParam).maybeSingle()
    : await supabase.from('couples').select('*')
        .or(`partner_a_id.eq.${participantId},partner_b_id.eq.${participantId}`)
        .maybeSingle()

  if (!couple) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (couple.guide_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Check cache
  const { data: cached } = await supabase
    .from('guide_briefings')
    .select('content, generated_at')
    .eq('couple_id', couple.id)
    .eq('guide_id', user.id)
    .maybeSingle()

  const cacheAge = cached ? Date.now() - new Date(cached.generated_at).getTime() : Infinity
  const forceRefresh = searchParams.get('refresh') === '1'

  if (cached && cacheAge < CACHE_TTL_MS && !forceRefresh) {
    return NextResponse.json({ briefing: cached.content, cached: true })
  }

  const partnerIds = [couple.partner_a_id, couple.partner_b_id].filter(Boolean) as string[]
  const [{ data: profiles }, { data: assessments }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', partnerIds),
    supabase.from('assessments').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false }),
  ])

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))
  function latestFor(partnerId: string | null) {
    if (!partnerId) return null
    return (assessments ?? []).find((a: any) => a.participant_id === partnerId) ?? null
  }
  const assessmentA = latestFor(couple.partner_a_id)
  const assessmentB = latestFor(couple.partner_b_id)

  const gap = computeCoupleGap(
    assessmentA ? { pillar_scores: assessmentA.pillar_scores, pillar_score_overrides: assessmentA.pillar_score_overrides, status: assessmentA.status } : null,
    assessmentB ? { pillar_scores: assessmentB.pillar_scores, pillar_score_overrides: assessmentB.pillar_score_overrides, status: assessmentB.status } : null,
  )

  if (!gap.both_complete) {
    return NextResponse.json({ error: 'Both partners must complete their assessment before a briefing can be generated' }, { status: 409 })
  }

  const nameA = couple.partner_a_id ? profileById.get(couple.partner_a_id)?.full_name ?? 'Partner A' : 'Partner A'
  const nameB = couple.partner_b_id ? profileById.get(couple.partner_b_id)?.full_name ?? 'Partner B' : 'Partner B'

  const gapSummary = gap.pillars
    .map(g => `${PILLAR_DISPLAY_NAMES[g.pillar]}: ${nameA}=${Math.round(g.partner_a_score ?? 0)} ${nameB}=${Math.round(g.partner_b_score ?? 0)} gap=${Math.round(g.gap ?? 0)} (${g.gap_band})`)
    .join('\n')

  const userMessage = `Couple: ${nameA} & ${nameB}
Track: ${couple.track}

Per-pillar scores and gap:
${gapSummary}

Joint priority stack (largest/most significant gaps first): ${gap.joint_priority_stack.map(p => PILLAR_DISPLAY_NAMES[p]).join(', ')}

Prepare the pre-session briefing for this couple's first formation session.`

  if (!isClaudeConfigured()) {
    if (cached) return NextResponse.json({ briefing: cached.content, cached: true, stale: true })
    return NextResponse.json({ error: 'AI briefing is not configured (ANTHROPIC_API_KEY missing)' }, { status: 503 })
  }

  try {
    const briefing = await callClaudeJSON({
      system: SYSTEM_PROMPT,
      user: userMessage,
      maxTokens: 700,
      tier: 'primary',
      timeoutMs: 30_000,
      retries: 1,
    })

    const serviceSupabase = await createServiceClient()
    await serviceSupabase.from('guide_briefings').upsert(
      { couple_id: couple.id, guide_id: user.id, content: briefing, generated_at: new Date().toISOString() },
      { onConflict: 'couple_id' }
    )

    return NextResponse.json({ briefing, cached: false })
  } catch (err: any) {
    console.error('[guide/briefing] generation failed:', err?.message ?? err)
    if (cached) return NextResponse.json({ briefing: cached.content, cached: true, stale: true })
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}
