// lib/report/builder.ts
// @ts-nocheck
//
// Covenant Formation Report Builder — forked from EIKON's builder.ts.
// Structured by the eight pillars of covenant formation rather than the
// Fruit of the Spirit, and carrying the one genuinely new section EIKON
// never needed: the dyadic Perception Gap between two partners' scores
// on the same pillar, computed fresh every render by lib/scoring/gap.ts
// and never stored (see docs/VERIFICATION.md).
//
// A report always belongs to ONE partner's account (their own portrait,
// their own written answers) but can optionally carry `coupleGap` and
// `partnerName` to render the joint gap section once both partners have
// completed. If the other partner hasn't finished yet, those are left
// null and the report says so plainly rather than hiding the section.
//
import type { Profile, Assessment, Response, ReportContent, PillarName } from '@/types'
import { PILLAR_DISPLAY_NAMES, PILLAR_ANCHOR, PILLAR_SCRIPTURE, DESCRIPTOR_COLORS, DESCRIPTOR_LABELS, GAP_BAND_LABELS, GAP_BAND_COLORS } from '@/types'
import { CORE_PILLARS, type CorePillar } from '@/lib/scoring/aggregate'
import type { CoupleGapResult } from '@/lib/scoring/gap'

interface BuildReportInput {
  profile: Profile
  assessment: Assessment
  responses: Response[]
  reportContent: ReportContent[]
  /** AI-written portraits for this assessment, keyed by pillar. From the `ai_portraits` table. */
  aiPortraits?: Record<string, { portrait?: string; gap_note?: string; invitation?: string }>
  /** This partner's name, for display (not re-derived from auth here). */
  partnerName?: string | null
  /** The other partner's first name, shown only in the gap section — never their individual scores'
   *  written answers, only their numbers, so this report never leaks the other partner's prose. */
  otherPartnerName?: string | null
  /** Computed fresh via computeCoupleGap() right before building — null if the couple record
   *  itself can't be found (shouldn't happen post-onboarding, but never assumed). Never populated
   *  for the readiness track — a solo assessment has no partner and therefore no gap. */
  coupleGap?: CoupleGapResult | null
  /** This person's current Fruit of the Spirit reflections (lib/formation/fruit.ts), rendered as a
   *  narrative section if any exist — never scored, never given a number. Pulled fresh at render
   *  time, same as everything else in this report. */
  fruitReflections?: Array<{ fruit: string; reflection_text: string }>
}

const PILLARS = CORE_PILLARS as readonly CorePillar[]

// ── Fallback portraits ──────────────────────────────────────────────
// Used only when no AI portrait and no report_content override exist for
// a pillar (Claude unavailable, or generation still in flight on first
// view). Templated rather than hand-authored per pillar+descriptor — the
// real per-couple writing lives in generatePortraitForPillar() in
// lib/report/generate.ts, which runs for the top-3 priority pillars on
// every completed assessment. This is the honest "not yet written" state,
// not a silent stand-in for real analysis.

// Each pillar's cost line also carries the relevant thread from the ten
// research dimensions this framework was checked against (self-awareness,
// communication, conflict & repair, emotional intimacy, trust & safety,
// values & beliefs, money & responsibility, family/roles/future, intimacy &
// romance, growth & partnership — see docs/PILLARS.md). None became a
// separate pillar; each lives inside one or two of the eight below.
const PILLAR_COST: Record<CorePillar, string> = {
  covenant_faithfulness:  'how reliably you show up for your spouse when keeping your word is costly or inconvenient, and whether your deepest values and faith actually line up, not just your calendars',
  oneness:                'whether you function as a team or as two separate lives sharing an address, and how well you adapt to and support each other as partners',
  sacrificial_love:       'what you actually give up for your spouse, not just what you say you would, and whether it is given freely or quietly resented',
  intimacy:               'how fully known you let your spouse be to you, and you to them — physically, emotionally, and in affection and attraction',
  truthful_communication: 'whether what you say to your spouse matches what is actually true and felt, and how well you each actually listen, not just talk',
  conflict_repair:        'whether disagreements between you actually get resolved or just stop, and how self-aware you each are about your own triggers and your own part in it',
  mutual_honor:           'how you treat your spouse, especially under frustration or in front of others, and whether you actively support each other\'s growth',
  shared_vision:          'whether you and your spouse are building one future together or two — money, in-laws, children, roles, and calling included',
}

// Readiness-track equivalent of PILLAR_COST — same eight questions, reframed
// for someone who does not yet have a spouse to answer about. "Between you"
// becomes "in you"; "your spouse" becomes "a future spouse" or is dropped
// in favor of the person's own patterns, since that is what a solo
// assessment can actually see.
const PILLAR_COST_READINESS: Record<CorePillar, string> = {
  covenant_faithfulness:  'how reliably you keep your word to people close to you when it is costly or inconvenient, and whether your deepest values and your actual choices line up, not just your intentions',
  oneness:                'whether you actually know how to function as part of a team rather than only on your own, and how well you adapt to and support the people you are closest to',
  sacrificial_love:       'what you actually give up for people you love, not just what you say you would, and whether you can do it without quietly resenting it',
  intimacy:               'how fully you let yourself be known by the people closest to you — emotionally, not just in conversation — and how comfortable you are being truly seen',
  truthful_communication: 'whether what you say to people close to you matches what is actually true and felt, and how well you actually listen, not just wait to talk',
  conflict_repair:        'whether disagreements in your closest relationships actually get resolved or just stop, and how self-aware you are about your own triggers and your own part in them',
  mutual_honor:           'how you treat the people closest to you, especially under frustration or in front of others, and whether you know how to actively support someone else\'s growth',
  shared_vision:          'whether you have actually done the work of knowing your own mind — money, family, calling, where you want to live — or are still vague about it and hoping clarity will arrive on its own',
}

const DESCRIPTOR_FRAME: Record<string, { open: string; close: string }> = {
  christformed: {
    open: 'This is a place of real strength in your marriage.',
    close: 'The next step here is not fixing anything — it is staying honest about it as life changes.',
  },
  rooted: {
    open: 'This is genuinely working between you, with one condition where it holds less reliably.',
    close: 'Notice the specific moments when it slips, and bring those — not the general pattern — to your next conversation with your spouse.',
  },
  growing: {
    open: 'The intention is present between you, but the practice is inconsistent, especially under pressure.',
    close: 'One honest conversation about where it breaks down will do more than general effort.',
  },
  awakening: {
    open: 'You both know what this should look like, but the habit has not yet formed between you.',
    close: 'Start smaller than feels sufficient — one specific, repeatable practice, not a resolution.',
  },
  unengaged: {
    open: 'This area has not yet been seriously engaged between you.',
    close: 'Naming it honestly, without defending it, is the entire first step.',
  },
}

// Readiness-track equivalent of DESCRIPTOR_FRAME — same five levels, worded
// for a pattern the person carries into any close relationship, not a
// dynamic already running between two spouses.
const DESCRIPTOR_FRAME_READINESS: Record<string, { open: string; close: string }> = {
  christformed: {
    open: 'This is a genuine strength you already bring into close relationships.',
    close: 'The next step here is not fixing anything — it is staying honest about it as your relationships deepen.',
  },
  rooted: {
    open: 'This is genuinely working in how you relate to people close to you, with one condition where it holds less reliably.',
    close: 'Notice the specific moments when it slips, and bring those — not the general pattern — to a mentor or Formation Guide.',
  },
  growing: {
    open: 'The intention is present, but the practice is inconsistent, especially under pressure.',
    close: 'One honest conversation about where it breaks down will do more than general effort.',
  },
  awakening: {
    open: 'You know what this should look like, but the habit has not yet formed in you.',
    close: 'Start smaller than feels sufficient — one specific, repeatable practice, not a resolution.',
  },
  unengaged: {
    open: 'This area has not yet been seriously engaged.',
    close: 'Naming it honestly, without defending it, is the entire first step — and it is far easier to do now than after a wedding.',
  },
}

function fallbackPortrait(pillar: CorePillar, descriptor: string, isReadiness: boolean): string {
  const name = PILLAR_DISPLAY_NAMES[pillar]
  const cost = isReadiness ? PILLAR_COST_READINESS[pillar] : PILLAR_COST[pillar]
  const frameSet = isReadiness ? DESCRIPTOR_FRAME_READINESS : DESCRIPTOR_FRAME
  const frame = frameSet[descriptor] ?? frameSet.growing
  const closing = isReadiness
    ? 'Your Formation Guide will address this directly with you.'
    : 'Your Formation Guide will address this pillar directly in your first session together.'
  return `${frame.open} In ${name.toLowerCase()}, the real question is ${cost}. ${frame.close} ${closing}`
}

function getIntegrityFlagText(pillar: CorePillar, flag: string): string {
  if (!flag || flag === 'none') return ''
  const name = PILLAR_DISPLAY_NAMES[pillar]
  if (flag === 'significant') {
    return `There is a notable gap in ${name} between what you described in general and how you actually answered when the scenario made the cost real. This is not an accusation — it is the most useful signal the assessment can produce. It is worth examining closely with your Guide before formation work in this area proceeds.`
  }
  return `Your answers in ${name} were slightly inconsistent — what you described in general terms did not fully match your scenario response. Worth raising with your Guide.`
}

export function buildReportHTML({
  profile, assessment, responses, reportContent, aiPortraits, partnerName, otherPartnerName, coupleGap, fruitReflections,
}: BuildReportInput): string {
  const isReadiness = assessment.track === 'readiness'
  const scores        = assessment.pillar_scores || {}
  const descriptors    = assessment.pillar_descriptors || {}
  const priorityStack  = assessment.priority_stack || []
  const overallScore   = assessment.overall_score || 0
  const integrityFlags = assessment.integrity_flags || {}
  const displayName    = partnerName || profile.full_name

  function getContent(key: string): string {
    const entry = reportContent.find(c => c.content_key === key)
    return entry?.content_text || ''
  }

  function getPortrait(pillar: CorePillar, descriptor: string): string {
    const ai = aiPortraits?.[pillar]
    if (ai?.portrait) return ai.portrait
    const dbContent = getContent(`portrait_${pillar}_${descriptor}`)
    if (dbContent) return dbContent
    return fallbackPortrait(pillar, descriptor, isReadiness)
  }

  function getInvitation(pillar: CorePillar): string {
    return aiPortraits?.[pillar]?.invitation || ''
  }

  function descriptorBadge(descriptor: string): string {
    const color = DESCRIPTOR_COLORS[descriptor as keyof typeof DESCRIPTOR_COLORS] || '#B8972A'
    const label = DESCRIPTOR_LABELS[descriptor as keyof typeof DESCRIPTOR_LABELS] || descriptor
    return `<span style="color:${color}; font-weight:700; font-size:13px; letter-spacing:0.1em; text-transform:uppercase">${label}</span>`
  }

  function radarSVG(): string {
    const size = 400
    const cx = size / 2
    const cy = size / 2
    const maxR = 135
    const n = PILLARS.length
    const angleStep = (2 * Math.PI) / n

    const toPoint = (score: number, i: number) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (score / 100) * maxR
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    }

    const grids = [20, 40, 60, 80, 100].map(level => {
      const pts = PILLARS.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        const r = (level / 100) * maxR
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
      })
      return pts.join(' ')
    })

    const profilePts = PILLARS.map((p, i) => toPoint((scores as any)[p] || 0, i))
    const profilePath = profilePts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

    const axes = PILLARS.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2
      return `<line x1="${cx}" y1="${cy}" x2="${(cx + maxR * Math.cos(angle)).toFixed(1)}" y2="${(cy + maxR * Math.sin(angle)).toFixed(1)}" stroke="rgba(184,151,42,0.15)" stroke-width="1"/>`
    }).join('')

    const labels = PILLARS.map((p, i) => {
      const angle = i * angleStep - Math.PI / 2
      const lr = 165
      const x = cx + lr * Math.cos(angle)
      const y = cy + lr * Math.sin(angle)
      const score = (scores as any)[p] || 0
      const anchor = Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end'
      return `
        <text x="${x.toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="${anchor}" font-family="Georgia" font-size="9.5" font-weight="600" fill="#C4A96A">${PILLAR_DISPLAY_NAMES[p].toUpperCase()}</text>
        <text x="${x.toFixed(1)}" y="${(y + 10).toFixed(1)}" text-anchor="${anchor}" font-family="Georgia" font-size="9" fill="#8A7340">${Math.round(score)}</text>
      `
    }).join('')

    const dots = profilePts.map((pt, i) => {
      const score = (scores as any)[PILLARS[i]] || 0
      let fill = '#B8972A'
      if (score >= 85) fill = '#2C5F2E'
      else if (score >= 70) fill = '#4A7A4A'
      else if (score < 30) fill = '#8B2020'
      else if (score < 50) fill = '#C47A1A'
      return `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="5" fill="${fill}" stroke="#0D0B08" stroke-width="2"/>`
    }).join('')

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${grids.map(pts => `<polygon points="${pts}" fill="none" stroke="rgba(184,151,42,0.08)" stroke-width="1"/>`).join('')}
        ${axes}
        <polygon points="${PILLARS.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return `${(cx + maxR * Math.cos(angle)).toFixed(1)},${(cy + maxR * Math.sin(angle)).toFixed(1)}`
        }).join(' ')}" fill="rgba(184,151,42,0.04)" stroke="rgba(184,151,42,0.2)" stroke-width="1" stroke-dasharray="4 3"/>
        <polygon points="${profilePath}" fill="rgba(184,151,42,0.14)" stroke="#B8972A" stroke-width="2.5"/>
        ${dots}
        ${labels}
      </svg>
    `
  }

  function pillarSection(pillar: CorePillar): string {
    const score       = (scores as any)[pillar] || 0
    const descriptor  = (descriptors as any)[pillar] || 'growing'
    const color       = DESCRIPTOR_COLORS[descriptor as keyof typeof DESCRIPTOR_COLORS] || '#B8972A'
    const label       = DESCRIPTOR_LABELS[descriptor as keyof typeof DESCRIPTOR_LABELS] || descriptor
    const name        = PILLAR_DISPLAY_NAMES[pillar]
    const anchor      = PILLAR_ANCHOR[pillar]
    const scripture   = PILLAR_SCRIPTURE[pillar]
    const flag        = (integrityFlags as any)[pillar] || 'none'
    const portrait    = getPortrait(pillar, descriptor)
    const invitation  = getInvitation(pillar)
    const flagText    = flag !== 'none' ? getIntegrityFlagText(pillar, flag) : ''

    return `
      <div style="margin-bottom:52px; padding-bottom:44px; border-bottom:1px solid #2A2218;">

        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
          <div>
            <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin:0 0 4px;">
              ${name.toUpperCase()}${anchor.word ? ` &nbsp;·&nbsp; ${anchor.word} (${anchor.language})` : ''}
            </p>
            <h3 style="font-family:Georgia; font-size:28px; font-weight:700; color:#F5E6C0; margin:0 0 6px; line-height:1.1;">
              ${name}
            </h3>
            <p style="font-family:Georgia; font-size:11px; color:#5A5040; letter-spacing:0.02em; font-style:italic; margin:0;">
              ${scripture}
            </p>
          </div>
          <div style="text-align:right;">
            ${descriptorBadge(descriptor)}
            <div style="font-family:Georgia; font-size:22px; font-weight:700; color:${color}; line-height:1; margin-top:6px;">
              ${Math.round(score)}
            </div>
            ${flag !== 'none' ? `<div style="font-size:9px; color:#C47A1A; margin-top:4px; letter-spacing:0.1em; text-transform:uppercase;">⚑ ${flag} signal</div>` : ''}
          </div>
        </div>

        <div style="height:3px; background:#1A1510; border-radius:2px; margin-bottom:8px; overflow:hidden;">
          <div style="height:100%; width:${score}%; background:${color}; border-radius:2px; opacity:0.8;"></div>
        </div>

        <p style="font-family:Georgia; font-size:9px; font-weight:700; color:#3D3325; letter-spacing:0.25em; text-transform:uppercase; margin:0 0 18px;">
          What stood out
        </p>

        <p style="font-family:Georgia; font-size:14.5px; line-height:1.9; color:#C4A96A; margin:0 0 18px; text-align:justify;">
          ${portrait}
        </p>

        ${invitation ? `
          <div style="padding:16px 18px; background:rgba(74,122,74,0.06); border-left:3px solid #4A7A4A; margin-bottom:16px;">
            <p style="font-family:Georgia; font-size:9px; font-weight:700; color:#4A7A4A; letter-spacing:0.15em; text-transform:uppercase; margin:0 0 6px;">Together this week</p>
            <p style="font-family:Georgia; font-size:13px; line-height:1.7; color:#8A7340; margin:0;">${invitation}</p>
          </div>
        ` : ''}

        ${flagText ? `
          <div style="padding:18px 20px; background:rgba(196,122,26,0.06); border-left:3px solid #C47A1A; margin-top:16px;">
            <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#C47A1A; letter-spacing:0.15em; text-transform:uppercase; margin:0 0 8px;">⚑ INTEGRITY SIGNAL — ${flag.toUpperCase()}</p>
            <p style="font-family:Georgia; font-size:13px; line-height:1.75; color:#8A7340; font-style:italic; margin:0;">${flagText}</p>
          </div>
        ` : ''}
      </div>
    `
  }

  // ── Dyadic gap section ────────────────────────────────────────────
  function gapSection(): string {
    if (!coupleGap) {
      return `
        <div style="padding:28px; background:rgba(184,151,42,0.03); border:1px solid #2A2218; text-align:center;">
          <p style="font-family:Georgia; font-size:13px; color:#4A3F2F; line-height:1.8;">
            The gap comparison between you and your spouse's answers will appear here once your couple record can be matched. If this persists, contact your Formation Guide.
          </p>
        </div>
      `
    }
    if (!coupleGap.both_complete) {
      return `
        <div style="padding:28px; background:rgba(184,151,42,0.03); border:1px solid #2A2218; text-align:center;">
          <p style="font-family:Georgia; font-size:14px; color:#8A7340; line-height:1.8; margin-bottom:8px;">
            ${otherPartnerName ? `${otherPartnerName} hasn't` : 'Your spouse hasn\'t'} completed their assessment yet.
          </p>
          <p style="font-family:Georgia; font-size:12.5px; color:#4A3F2F; line-height:1.75;">
            The Perception Gap between your two sets of answers — where you see your marriage the same way, and where you don't — will appear here automatically the moment both of you have finished. Nothing further to do on your end.
          </p>
        </div>
      `
    }

    const rows = coupleGap.pillars.map(g => {
      const name  = PILLAR_DISPLAY_NAMES[g.pillar]
      const band  = g.gap_band ?? 'aligned'
      const color = GAP_BAND_COLORS[band]
      const label = GAP_BAND_LABELS[band]
      return `
        <tr>
          <td style="font-family:Georgia; font-size:12.5px; font-weight:600; color:#F5E6C0; padding:10px 12px; border-bottom:1px solid #1A1510;">${name}</td>
          <td style="font-family:Georgia; font-size:14px; font-weight:700; color:#C4A96A; padding:10px 12px; text-align:center; border-bottom:1px solid #1A1510;">${Math.round(g.partner_a_score ?? 0)}</td>
          <td style="font-family:Georgia; font-size:14px; font-weight:700; color:#C4A96A; padding:10px 12px; text-align:center; border-bottom:1px solid #1A1510;">${Math.round(g.partner_b_score ?? 0)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #1A1510; text-align:center;">
            <span style="font-family:Georgia; font-size:10px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.08em;">${label}</span>
            <span style="font-family:Georgia; font-size:10px; color:#4A3F2F;"> (${Math.round(g.gap ?? 0)} pts)</span>
          </td>
        </tr>
      `
    }).join('')

    const topGaps = coupleGap.joint_priority_stack.slice(0, 3)

    return `
      <div>
        <p style="font-family:Georgia; font-size:13.5px; color:#8A7340; line-height:1.85; margin-bottom:20px;">
          Each of you took this assessment independently. The table below shows where your two sets of
          answers agree, and where they diverge — a gap is not necessarily a sign that someone is wrong.
          It is a sign of something neither of you has fully said out loud to the other yet.
        </p>
        <table style="width:100%; border-collapse:collapse; margin-bottom:28px;">
          <thead>
            <tr style="background:#1A1510;">
              <th style="font-family:Georgia; font-size:9px; letter-spacing:0.18em; color:#8A7340; padding:10px 12px; text-align:left; border-bottom:1px solid #2A2218;">PILLAR</th>
              <th style="font-family:Georgia; font-size:9px; letter-spacing:0.18em; color:#8A7340; padding:10px 12px; text-align:center; border-bottom:1px solid #2A2218;">YOU</th>
              <th style="font-family:Georgia; font-size:9px; letter-spacing:0.18em; color:#8A7340; padding:10px 12px; text-align:center; border-bottom:1px solid #2A2218;">${otherPartnerName ? otherPartnerName.toUpperCase() : 'SPOUSE'}</th>
              <th style="font-family:Georgia; font-size:9px; letter-spacing:0.18em; color:#8A7340; padding:10px 12px; text-align:center; border-bottom:1px solid #2A2218;">GAP</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:18px 22px; background:rgba(196,122,26,0.05); border-left:3px solid #C47A1A;">
          <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#C47A1A; letter-spacing:0.15em; text-transform:uppercase; margin:0 0 10px;">Where to start together</p>
          <p style="font-family:Georgia; font-size:13px; line-height:1.8; color:#8A7340; margin:0;">
            ${topGaps.map(p => PILLAR_DISPLAY_NAMES[p]).join(', ')} — ranked here by the size of the gap between
            you, not just by either of your individual scores, because an unseen gap is its own kind of risk
            to a marriage. Bring these three to your first conversation with your Formation Guide, together.
          </p>
        </div>
      </div>
    `
  }

  // ── Readiness section (solo track — replaces the gap section, since
  // there is no partner to compare against yet) ────────────────────
  function readinessSection(): string {
    return `
      <div style="padding:28px 30px; background:rgba(184,151,42,0.03); border:1px solid #2A2218;">
        <p style="font-family:Georgia; font-size:13.5px; color:#8A7340; line-height:1.85; margin-bottom:14px;">
          You took this on your own, before a partner was in the picture — so there is no comparison to
          show here, and that is exactly right for where you are. What follows is a picture of how you,
          specifically, tend to show up in the areas that will matter most once you are building a shared
          life with someone else.
        </p>
        <p style="font-family:Georgia; font-size:13.5px; color:#8A7340; line-height:1.85; margin:0;">
          If you're currently dating or engaged, the most useful thing you can do with this report is talk
          through it honestly with a mentor or Formation Guide — and, when the time is right, invite the
          person you're considering marrying to take their own assessment too.
        </p>
      </div>
    `
  }

  // ── Fruit of the Spirit (unscored — see lib/formation/fruit.ts and
  // docs/VERIFICATION.md for why this is never given a number) ──────
  function fruitSection(): string {
    if (!fruitReflections || fruitReflections.length === 0) return ''
    const names: Record<string, string> = {
      love: 'Love', joy: 'Joy', peace: 'Peace', patience: 'Patience', kindness: 'Kindness',
      goodness: 'Goodness', faithfulness: 'Faithfulness', gentleness: 'Gentleness', self_control: 'Self-Control',
    }
    const items = fruitReflections.map(r => `
      <div style="padding:16px 0; border-bottom:1px solid #1A1510;">
        <p style="font-family:Georgia; font-size:11px; font-weight:700; color:#8A7340; letter-spacing:0.15em; text-transform:uppercase; margin:0 0 8px;">${names[r.fruit] ?? r.fruit}</p>
        <p style="font-family:Georgia; font-size:13.5px; line-height:1.8; color:#C4A96A; margin:0; font-style:italic;">"${r.reflection_text}"</p>
      </div>
    `).join('')
    return `
      <div style="page-break-after:always;"></div>
      <div style="padding-bottom:52px; margin-bottom:52px;">
        <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:12px;">
          FRUIT OF THE SPIRIT
        </p>
        <p style="font-family:Georgia; font-size:13px; color:#4A3F2F; font-style:italic; line-height:1.8; margin-bottom:24px;">
          These are never scored. Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness,
          and self-control are produced by abiding, not achieved by trying harder — so there is no number
          here, on purpose. What follows is simply what you wrote, in your own words.
        </p>
        ${items}
      </div>
    `
  }

  const dateFormatted = new Date(assessment.completed_at || assessment.created_at)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const trackLabel = assessment.track === 'premarital' ? 'Premarital Formation'
    : assessment.track === 'readiness' ? 'Readiness'
    : 'Married Formation'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Covenant Formation Report — ${displayName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0D0B08; color: #F5E6C0; font-family: Georgia, serif; font-size: 15px; line-height: 1.7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 22mm 18mm; }
  @media print {
    .no-print { display: none; }
    body { background: #0D0B08 !important; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 40px; text-align:center; background:radial-gradient(ellipse at 50% 50%, rgba(184,151,42,0.06) 0%, transparent 65%);">
  <p style="font-family:Georgia; font-size:10px; letter-spacing:0.45em; color:#8A7340; text-transform:uppercase; margin-bottom:24px;">
    GOD'S KINGDOM MALAK MINISTRIES
  </p>
  <h1 style="font-family:'Cormorant Garamond', Georgia; font-size:72px; font-weight:700; color:#B8972A; letter-spacing:-0.01em; line-height:1; margin-bottom:6px;">
    COVENANT FORMATION
  </h1>
  <p style="font-family:Georgia; font-size:20px; color:#C4A96A; font-style:italic; margin-bottom:44px;">
    ${trackLabel} Report
  </p>
  <div style="width:200px; height:1px; background:linear-gradient(to right, transparent, #B8972A, transparent); margin-bottom:44px;"></div>
  <p style="font-family:Georgia; font-size:24px; font-weight:600; color:#F5E6C0; margin-bottom:8px;">
    ${displayName}
  </p>
  <p style="font-family:Georgia; font-size:12px; color:#8A7340; letter-spacing:0.12em;">
    ${dateFormatted} &nbsp;·&nbsp; Formation Cycle ${assessment.cycle_number ?? 1}
  </p>

  <div style="margin-top:72px; padding:22px 32px; border-left:2px solid #B8972A; text-align:left; max-width:480px;">
    <p style="font-family:Georgia; font-size:14px; font-style:italic; color:#C4A96A; margin-bottom:10px; line-height:1.75;">
      "Can two walk together, except they be agreed?"
    </p>
    <cite style="font-family:Georgia; font-size:11px; font-weight:700; color:#B8972A; letter-spacing:0.12em; font-style:normal;">
      AMOS 3:3
    </cite>
  </div>
</div>

<div style="page-break-after:always;"></div>

<!-- THEOLOGICAL ORIENTATION -->
<div style="padding:52px 0 40px;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:24px;">
    THE ROOT OF THIS WORK
  </p>
  <div style="padding:26px 30px; background:rgba(184,151,42,0.05); border-left:2px solid #B8972A; margin-bottom:32px;">
    <p style="font-family:Georgia; font-size:14.5px; font-style:italic; line-height:1.9; color:#C4A96A; margin-bottom:14px;">
      Marriage is a covenant, not a contract — modeled on God's own faithfulness to His people. This report
      is not a verdict on your relationship. It is a mirror, held up so the two of you can see what is
      actually true between you, together.
    </p>
    <p style="font-family:Georgia; font-size:13px; line-height:1.8; color:#8A7340;">
      The eight pillars below name the domains where a covenant is either being kept and deepened, or
      quietly neglected: faithfulness, oneness, sacrificial love, intimacy, truthful communication,
      conflict and repair, mutual honor, and shared vision. Each one is a place where two people either
      move toward one flesh, or drift into two separate lives sharing an address.
    </p>
  </div>
  <div style="padding:18px 24px; background:rgba(184,151,42,0.03); border:1px solid #2A2218; margin-bottom:28px;">
    <p style="font-family:Georgia; font-size:11px; font-weight:700; color:#8A7340; letter-spacing:0.2em; text-transform:uppercase; margin:0 0 8px;">A note on the numbers</p>
    <p style="font-family:Georgia; font-size:13px; line-height:1.8; color:#4A3F2F; margin:0 0 10px;">
      The scores are diagnostic approximations — patterns surfaced from your answers, not precise
      measurements of your marriage. Your Formation Guide can review and, with a stated reason, override
      any score their pastoral reading of your answers contradicts — the original computed score is always
      kept on record alongside their override. Treat the numbers as conversation starters, not conclusions.
    </p>
    ${String(assessment.scoring_notes ?? '').includes('keyword_fallback') ? `
    <p style="font-family:Georgia; font-size:13px; line-height:1.8; color:#4A3F2F; margin:0;">
      Your written answers were scored without AI assistance this time, using a simpler method. The scores
      are still real and drawn from what you wrote — just lower-fidelity than usual. Your Formation Guide
      has been told this too, and will weigh it accordingly.
    </p>
    ` : ''}
  </div>
  <p style="font-family:Georgia; font-size:14px; line-height:1.85; color:#8A7340;">
    What you are about to read is your own portrait, written from your own answers — and, once your
    spouse has also finished, a side-by-side look at where your two answers agree and where they don't.
    Read it with honest eyes and an open heart.
  </p>
</div>

<!-- SUMMARY PROFILE -->
<div style="padding-bottom:52px; border-bottom:1px solid #2A2218; margin-bottom:52px;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:28px;">
    ${isReadiness ? 'WHERE YOU STAND TODAY' : 'A FIRST LOOK, TOGETHER'}
  </p>

  <div style="display:flex; gap:40px; align-items:flex-start; flex-wrap:wrap;">
    <div style="flex:1; min-width:280px; display:flex; flex-direction:column; align-items:center;">
      ${radarSVG()}
      <div style="text-align:center; margin-top:14px;">
        <div style="font-family:Georgia; font-size:36px; font-weight:700; color:#B8972A; line-height:1;">${Math.round(overallScore)}</div>
        <div style="font-family:Georgia; font-size:10px; color:#8A7340; letter-spacing:0.22em; text-transform:uppercase; margin-top:5px;">${isReadiness ? 'OVERALL READINESS PICTURE' : 'OVERALL PICTURE'}</div>
        <div style="font-family:Georgia; font-size:11px; color:#4A3F2F; font-style:italic; margin-top:6px; max-width:220px; line-height:1.6;">One honest number across all eight areas — a starting point for conversation, not a verdict. Your Guide reviews it before your first session.</div>
      </div>
    </div>

    <div style="flex:1; min-width:240px;">
      <p style="font-family:Georgia; font-size:9px; font-weight:700; color:#8A7340; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:14px;">At a glance</p>
      ${PILLARS.map((p) => {
            const score       = (scores as any)[p] || 0
            const descriptor  = (descriptors as any)[p] || 'growing'
            const color       = DESCRIPTOR_COLORS[descriptor as keyof typeof DESCRIPTOR_COLORS] || '#B8972A'
            const label       = DESCRIPTOR_LABELS[descriptor as keyof typeof DESCRIPTOR_LABELS] || descriptor
            const flag        = (integrityFlags as any)[p] || 'none'
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid #1A1510;">
                <span style="font-family:Georgia; font-size:13px; color:#F5E6C0;">
                  ${PILLAR_DISPLAY_NAMES[p]}
                  ${flag !== 'none' ? ' <span style="font-size:8px; color:#C47A1A;">⚑</span>' : ''}
                </span>
                <span style="font-family:Georgia; font-size:11px; font-weight:600; color:${color}; text-transform:uppercase; letter-spacing:0.06em;">${label}</span>
              </div>
            `
          }).join('')}

      <div style="margin-top:18px; padding:14px 16px; border:1px solid #2A2218; background:#141008;">
        <p style="font-family:Georgia; font-size:9px; font-weight:700; color:#8A7340; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:8px;">What these words mean</p>
        ${(['christformed','rooted','growing','awakening','unengaged'] as const).map(d => {
          const color = DESCRIPTOR_COLORS[d]
          const label = DESCRIPTOR_LABELS[d]
          const sense = {
            christformed: 'A real strength — keep it honest as life changes',
            rooted:       'Genuinely working, with room to deepen',
            growing:      'The intention is there; the practice is inconsistent',
            awakening:    'You know what it should look like, but the habit isn\'t formed yet',
            unengaged:    'Not yet seriously faced together',
          }
          return `<div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px;">
            <span style="font-family:Georgia; font-size:10px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.06em; min-width:84px; flex-shrink:0;">${label}</span>
            <span style="font-family:Georgia; font-size:10.5px; color:#8A7340; line-height:1.5;">${sense[d]}</span>
          </div>`
        }).join('')}
      </div>
    </div>
  </div>
</div>

<div style="page-break-after:always;"></div>

<!-- DYADIC GAP / READINESS -->
<div style="padding-bottom:52px; margin-bottom:52px; border-bottom:1px solid #2A2218;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:16px;">
    ${isReadiness ? 'ABOUT THIS REPORT' : 'THE PERCEPTION GAP'}
  </p>
  ${isReadiness ? readinessSection() : gapSection()}
</div>

<!-- PILLAR ANALYSES -->
<div style="padding-bottom:16px;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:36px;">
    ${isReadiness ? 'WHAT YOUR ANSWERS SHOW' : 'WHAT WE FOUND, PILLAR BY PILLAR'}
  </p>
  ${PILLARS.map(p => pillarSection(p)).join('')}
</div>

<div style="page-break-after:always;"></div>

<!-- PRIORITY STACK -->
<div style="padding-bottom:52px; margin-bottom:52px; border-bottom:1px solid #2A2218;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:16px;">
    WHERE TO BEGIN
  </p>
  <p style="font-family:Georgia; font-size:14px; color:#8A7340; line-height:1.8; margin-bottom:6px;">
    The eight areas, ordered by what your own answers say is most worth your attention first.
  </p>
  <p style="font-family:Georgia; font-size:12px; color:#4A3F2F; font-style:italic; margin-bottom:28px; line-height:1.7;">
    ${isReadiness
      ? 'This is your own order. Bring it, honestly, into conversation with a mentor or Formation Guide before you move toward marriage.'
      : 'This is your individual order. See "The Perception Gap" above for where you and your spouse should focus together — the two lists will not always match, and that is itself worth discussing.'}
  </p>
  ${priorityStack.map((pillar: string, i: number) => {
    const score       = (scores as any)[pillar] || 0
    const descriptor  = (descriptors as any)[pillar] || 'growing'
    const color       = DESCRIPTOR_COLORS[descriptor as keyof typeof DESCRIPTOR_COLORS] || '#B8972A'
    const label       = DESCRIPTOR_LABELS[descriptor as keyof typeof DESCRIPTOR_LABELS] || descriptor
    const name        = PILLAR_DISPLAY_NAMES[pillar as PillarName]
    const flag        = (integrityFlags as any)[pillar] || 'none'

    return `
      <div style="padding:18px 0; border-bottom:1px solid #1A1510;">
        <div style="display:flex; align-items:flex-start; gap:20px;">
          <div style="font-family:Georgia; font-size:${i === 0 ? '22px' : '16px'}; font-weight:700; color:${i === 0 ? '#B8972A' : '#3D3325'}; width:32px; flex-shrink:0; text-align:center; padding-top:2px;">${i + 1}</div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family:Georgia; font-size:15px; font-weight:600; color:#F5E6C0;">${name}</span>
                ${flag !== 'none' ? `<span style="font-size:8px; color:#C47A1A; font-weight:700; letter-spacing:0.1em;">⚑ ${flag}</span>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:Georgia; font-size:10px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.1em;">${label}</span>
                <span style="font-family:Georgia; font-size:16px; font-weight:700; color:${color};">${Math.round(score)}</span>
              </div>
            </div>
            <div style="height:2px; background:#1A1510; border-radius:2px; overflow:hidden; margin-bottom:10px;">
              <div style="height:100%; width:${score}%; background:${color}; opacity:0.6;"></div>
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')}
</div>

${fruitSection()}

<!-- CLOSING -->
<div style="padding:44px; background:rgba(184,151,42,0.04); border:1px solid rgba(184,151,42,0.12); border-top:2px solid #B8972A;">
  <p style="font-family:Georgia; font-size:10px; font-weight:700; color:#8A7340; letter-spacing:0.35em; text-transform:uppercase; margin-bottom:24px; text-align:center;">
    ✦ &nbsp; WHAT HAPPENS NOW &nbsp; ✦
  </p>
  <div style="max-width:520px; margin:0 auto;">
    <p style="font-family:Georgia; font-size:14px; line-height:1.9; color:#C4A96A; margin-bottom:18px;">
      ${isReadiness
        ? 'You have read the diagnostic. The next step is not further reflection alone — it is a conversation, with a mentor or Formation Guide who can help you actually use what you just found.'
        : 'You have read the diagnostic. The next step is not further reflection alone — it is a conversation, with your spouse, and with your Formation Guide.'}
    </p>
    <p style="font-family:Georgia; font-size:13.5px; line-height:1.9; color:#8A7340; margin-bottom:18px;">
      ${isReadiness
        ? 'Your Formation Guide will read this report and personally begin a conversation with you — a real decision by a real person, so there is no fixed number of days to promise here.'
        : 'Your Formation Guide will read both of your reports, including the Perception Gap once it is complete, and personally begin your pathway with you — a real decision by a real person, so there is no fixed number of days to promise here.'}
    </p>
    <p style="font-family:Georgia; font-size:13.5px; line-height:1.9; color:#8A7340; margin-bottom:32px;">
      ${isReadiness
        ? 'The people who benefit most from this process are not the ones who begin with the highest scores. They are the ones who begin with the most honesty — with themselves, and about what the assessment found. Readiness is not a product. It is built the same way faithfulness is: a long obedience in the same direction, one honest choice at a time.'
        : 'The couples who benefit most from this process are not the ones who begin with the highest scores. They are the ones who begin with the most honesty — with themselves, with each other, and about what the assessment found. Formation is not a product. It is a long obedience in the same direction, walked by two people, together.'}
    </p>
    <div style="width:100px; height:1px; background:linear-gradient(to right, transparent, #B8972A, transparent); margin:0 auto 20px;"></div>
    <p style="font-family:Georgia; font-size:13px; font-style:italic; color:#8A7340; text-align:center; line-height:1.7;">
      "Love is patient, love is kind... it always protects, always trusts, always hopes, always perseveres."
    </p>
    <p style="font-family:Georgia; font-size:11px; font-weight:700; color:#B8972A; letter-spacing:0.12em; text-align:center; margin-top:10px;">
      1 CORINTHIANS 13:4,7
    </p>
    <p style="font-family:Georgia; font-size:11px; color:#4A3F2F; text-align:center; margin-top:20px;">
      This report is saved to your account. Your Formation Guide will read it and reach out.
    </p>
  </div>
</div>

<!-- FOOTER -->
<div style="margin-top:44px; padding-top:20px; border-top:1px solid #2A2218; display:flex; justify-content:space-between; align-items:center;">
  <p style="font-family:Georgia; font-size:10px; color:#4A3F2F;">God's Kingdom Malak Ministries &nbsp;·&nbsp; Covenant Formation</p>
  <p style="font-family:Georgia; font-size:10px; color:#4A3F2F;">&copy; ${new Date().getFullYear()}</p>
</div>

</body>
</html>`
}
