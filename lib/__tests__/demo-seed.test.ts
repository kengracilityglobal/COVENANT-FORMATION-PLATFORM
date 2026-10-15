import { describe, it, expect } from 'vitest'
import { generateDemo, BANKS, PERSONAS, DEMO_DOMAIN } from '../../scripts/generate-demo-seed'
import { buildReportHTML } from '../report/builder'
import { CORE_PILLARS } from '../scoring/aggregate'

const pkg = generateDemo()
const text = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ')

function render(personaKey: string) {
  const p = pkg.personas.find(x => x.key === personaKey)!
  const a = pkg.assessments.find(x => x.persona === personaKey)!
  const bank = BANKS[a.track]
  const questions = bank.map(q => ({ id: q.code, code: q.code, pillar: q.pillar, question_type: q.type, question_text: q.text, scale_reversed: q.reversed, scoring_rubric: q.rubric }))
  const responses = a.responses.map(r => ({ question_id: r.code, response_text: r.text, response_scale: r.scale, computed_score: r.score, descriptor_assigned: r.desc, word_count: r.wc }))
  const assessment: any = {
    id: a.id, participant_id: p.key, couple_id: a.coupleKey, track: a.track, status: a.status, cycle_number: 1,
    pillar_scores: a.result!.pillar_scores, pillar_descriptors: a.result!.pillar_descriptors, integrity_flags: a.result!.integrity_flags,
    priority_stack: a.result!.priority_stack, overall_score: a.result!.overall_score, scoring_notes: null,
    completed_at: a.completedAt!.toISOString(), created_at: a.startedAt.toISOString(),
  }
  return buildReportHTML({ profile: { id: p.key, full_name: p.name, email: '', role: 'participant' } as any, assessment, responses: responses as any, reportContent: [], questions: questions as any })
}

describe('demo data', () => {
  it('has every role and track represented, with the intended assessment states', () => {
    expect(pkg.personas.filter(p => p.role === 'guide')).toHaveLength(2)
    const byStatus = (s: string) => pkg.personas.filter(p => p.status === s).map(p => p.key)
    expect(byStatus('in_progress')).toEqual(['ife'])
    expect(byStatus('not_started')).toEqual(['bola'])
    expect(new Set(pkg.assessments.map(a => a.track))).toEqual(new Set(['married', 'premarital', 'readiness']))
    expect(pkg.assessments.find(a => a.persona === 'daniel')!.responses).toHaveLength(BANKS.married.length)
    expect(pkg.assessments.find(a => a.persona === 'tunde')!.responses).toHaveLength(BANKS.premarital.length)
    expect(pkg.assessments.find(a => a.persona === 'chidi')!.responses).toHaveLength(BANKS.readiness.length)
    expect(pkg.assessments.find(a => a.persona === 'ife')!.responses).toHaveLength(20)
    expect(pkg.assessments.find(a => a.persona === 'ife')!.result).toBeNull()
  })

  it('answers every question in the bank it belongs to, with codes that exist', () => {
    for (const a of pkg.assessments.filter(x => x.status !== 'in_progress')) {
      expect(new Set(a.responses.map(r => r.code))).toEqual(new Set(BANKS[a.track].map(q => q.code)))
    }
  })

  it('produces scores close to the design for the authored personas', () => {
    for (const p of pkg.personas.filter(x => x.targets && !x.straightline && x.status !== 'in_progress')) {
      const r = pkg.assessments.find(a => a.persona === p.key)!.result!
      CORE_PILLARS.forEach((pillar, i) => expect(Math.abs(r.pillar_scores[pillar] - p.targets![i]), `${p.key} ${pillar}`).toBeLessThanOrEqual(20))
    }
  })

  it('shows the flag scenarios it promises', () => {
    const daniel = pkg.assessments.find(a => a.persona === 'daniel')!.result!
    expect(daniel.integrity_flags.truthful_communication).toBe('significant')
    const sam = pkg.assessments.find(a => a.persona === 'sam')!.result!
    for (const p of CORE_PILLARS) expect(sam.integrity_flags[p], p).toBe('significant')
    const chidi = pkg.assessments.find(a => a.persona === 'chidi')!.result!
    expect(Object.values(chidi.integrity_flags).every(f => f === 'none')).toBe(true)
  })

  it('renders a complete report for every finished assessment, with no template leaks', () => {
    for (const a of pkg.assessments.filter(x => x.result)) {
      const html = render(a.persona)
      const t = text(html)
      expect(html, a.persona).not.toMatch(/\$\{|\{sp\}|\{Sp\}|\{mar\}|\{other\}|undefined|\[object|NaN/)
      expect(t, a.persona).toMatch(/YOUR FIRST MONTH/)
      expect(t, a.persona).toMatch(/From your own answers/)
      if (a.persona !== 'sam') expect(t, a.persona).toMatch(/In your own words/)   // Sam's answers are one-liners; the report does not quote those
      if (a.track === 'readiness') expect(t, a.persona).not.toMatch(/your spouse|your marriage|your partner|between the two of you/i)
      if (a.track === 'premarital') expect(t, a.persona).not.toMatch(/your spouse|your marriage/i)
    }
  })

  it("Sam's straight-lined ratings show up as contradictions and a note", () => {
    const t = text(render('sam'))
    expect(t).toMatch(/same answer to nearly every rating question/)
    expect(t).toMatch(/Separately: You answered\s+almost always\s+to/)
  })

  it('assigns guides as designed: two couples and one individual to Naomi, nothing to Emeka', () => {
    const sql = pkg.seedSql
    expect(sql).toMatch(/'DEMOMARRIED'/)
    expect((sql.match(/guide\.naomi@demo/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(sql).not.toMatch(/guide_id = \(SELECT id FROM demo_ids WHERE email = 'guide\.emeka/)
    expect(pkg.removeSql).toMatch(/DELETE FROM auth\.users/)
  })

  it('is deterministic, so regenerating gives the same file', () => {
    expect(generateDemo().seedSql).toBe(pkg.seedSql)
  })

  it('never uses a real-looking address', () => {
    for (const l of pkg.logins) expect(l.email.endsWith('@' + DEMO_DOMAIN)).toBe(true)
    expect(PERSONAS.length).toBe(11)
  })
})
