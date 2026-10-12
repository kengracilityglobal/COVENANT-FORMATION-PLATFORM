import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'fs'
import { buildReportHTML } from '../builder'
import { CORE_PILLARS } from '@/lib/scoring/aggregate'
import { computeCoupleGap } from '@/lib/scoring/gap'

const RUBRIC = { christformed: 'Holds without effort', rooted: 'Holds with some effort', growing: 'Holds when convenient', awakening: 'Slips under pressure', unengaged: 'Does not hold' }
const now = new Date().toISOString()

function fixture(track: 'married' | 'premarital' | 'readiness', scores: Record<string, number>) {
  const questions: any[] = []
  const responses: any[] = []
  for (const p of CORE_PILLARS) {
    for (const [i, type] of (['frequency', 'frequency', 'scenario'] as const).entries()) {
      const id = `${p}-${i}`
      questions.push({ id, code: id, pillar: p, question_type: type, question_text: `Statement ${i} about ${p}`, scoring_rubric: RUBRIC })
      const score = Math.max(0, Math.min(100, scores[p] + (i === 0 ? 18 : i === 1 ? -22 : 0)))
      responses.push({
        question_id: id, computed_score: score, response_scale: type === 'frequency' ? Math.round(score / 25) + 1 : null,
        response_text: type === 'scenario' ? 'Last month we had to decide about the house and I pushed ahead before asking. It caused a quiet argument that took days to settle properly.' : null,
        word_count: type === 'scenario' ? 28 : null,
      })
    }
  }
  const descriptor = (n: number) => n >= 85 ? 'christformed' : n >= 70 ? 'rooted' : n >= 50 ? 'growing' : n >= 30 ? 'awakening' : 'unengaged'
  const assessment: any = {
    id: 'a1', participant_id: 'u1', couple_id: track === 'readiness' ? null : 'c1', track, cycle_number: 1, status: 'report_generated',
    pillar_scores: scores, pillar_descriptors: Object.fromEntries(CORE_PILLARS.map(p => [p, descriptor(scores[p])])),
    priority_stack: [...CORE_PILLARS].sort((a, b) => scores[a] - scores[b]),
    overall_score: Math.round(CORE_PILLARS.reduce((s, p) => s + scores[p], 0) / 8),
    integrity_flags: { oneness: 'significant', intimacy: 'minor' }, completed_at: now, created_at: now,
  }
  return { assessment, responses, questions }
}

const SCORES = { covenant_faithfulness: 88, oneness: 52, sacrificial_love: 76, intimacy: 41, truthful_communication: 68, conflict_repair: 33, mutual_honor: 69, shared_vision: 25 }
const profile: any = { id: 'u1', full_name: 'Ada Obi', email: 'a@x.com', role: 'participant' }

function render(track: 'married' | 'premarital' | 'readiness', extra: any = {}, scores = SCORES) {
  const f = fixture(track, scores)
  return buildReportHTML({ profile, assessment: f.assessment, responses: f.responses, reportContent: [], questions: f.questions, ...extra })
}
const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ')

describe('buildReportHTML — offline report', () => {
  for (const track of ['married', 'premarital', 'readiness'] as const) {
    it(`${track}: renders every section with no template leaks`, () => {
      const html = render(track)
      writeFileSync(`/tmp/report-${track}.html`, html)
      const text = visibleText(html)
      expect(html).not.toMatch(/\$\{|\{sp\}|\{Sp\}|\{mar\}|\{other\}|undefined|\[object|NaN/)
      for (const p of CORE_PILLARS) expect(html).toContain('From your own answers')
      expect(text).toMatch(/Where this holds/)
      expect(text).toMatch(/Where it slips/)
      expect(text).toMatch(/In your own words/)
      expect(text).toMatch(/YOUR FIRST MONTH/)
      expect(text).toMatch(/Week 1/)
      expect(text).toMatch(/Look back/)
      expect(text).toMatch(/Your strongest ground is Covenant Faithfulness/)
      expect(text).toMatch(/INTEGRITY SIGNAL/)
    })
  }

  it('readiness never mentions a spouse, partner or marriage-in-progress', () => {
    const text = visibleText(render('readiness'))
    expect(text).not.toMatch(/your spouse|your marriage|your partner|between the two of you|together this week/i)
    expect(text).toMatch(/One thing to do this week/)
  })

  it('premarital says partner/relationship, never spouse', () => {
    const text = visibleText(render('premarital'))
    expect(text).not.toMatch(/your spouse|your marriage/i)
    expect(text).toMatch(/your partner/i)
  })

  it('shows the gap reading and a joint-priority first month once both partners are done', () => {
    const other = Object.fromEntries(CORE_PILLARS.map(p => [p, 70]))
    const f = fixture('married', SCORES)
    const gap = computeCoupleGap(
      { pillar_scores: f.assessment.pillar_scores, pillar_score_overrides: null, status: 'completed' },
      { pillar_scores: other, pillar_score_overrides: null, status: 'completed' })
    const html = render('married', { coupleGap: gap, otherPartnerName: 'Tunde' })
    const text = visibleText(html)
    expect(text).toMatch(/Reading the gaps/)
    expect(text).toMatch(/Between the two of you/)
    expect(text).toMatch(/Tunde/)
    expect(text).toMatch(/taking the gaps between you into account/)
  })

  it('AI portrait and invitation still win over the offline text, and are escaped', () => {
    const html = render('married', { aiPortraits: { oneness: { portrait: 'AI says <script>alert(1)</script> hello', invitation: 'Do <b>this</b> now' } } })
    expect(html).toContain('AI says &lt;script&gt;alert(1)&lt;/script&gt; hello')
    expect(html).toContain('Do &lt;b&gt;this&lt;/b&gt; now')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('escapes names, written excerpts and fruit reflections', () => {
    const f = fixture('married', SCORES)
    f.responses[2].response_text = 'I wrote <img src=x onerror=alert(1)> while we were deciding about the house and it caused a quiet argument that lasted days.'
    const html = buildReportHTML({
      profile: { ...profile, full_name: '<b>Ada</b>' }, assessment: f.assessment, responses: f.responses, reportContent: [], questions: f.questions,
      fruitReflections: [{ fruit: 'love', reflection_text: '<script>x()</script>' }],
    })
    expect(html).not.toMatch(/<img src=x|<script>x\(\)|<b>Ada<\/b>/)
  })

  it('still renders fully when no questions are supplied (evidence panels simply absent)', () => {
    const f = fixture('married', SCORES)
    const html = buildReportHTML({ profile, assessment: f.assessment, responses: f.responses, reportContent: [] })
    expect(html).toContain('What stood out')
    expect(html).not.toContain('From your own answers')
    expect(html).toMatch(/Together this week/)
  })

  it('every level on every pillar renders without throwing (fuzz)', () => {
    for (const n of [0, 12, 29, 30, 49, 50, 69, 70, 84, 85, 100]) {
      const sc = Object.fromEntries(CORE_PILLARS.map(p => [p, n]))
      for (const t of ['married', 'premarital', 'readiness'] as const) {
        expect(() => render(t, {}, sc as any)).not.toThrow()
      }
    }
  })
})
