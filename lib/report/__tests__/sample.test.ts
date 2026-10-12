import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'fs'
import { buildSampleReport } from '../sample'

const text = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ')

describe('sample report', () => {
  it('married example: labelled as an example, with gap reading and evidence', () => {
    const html = buildSampleReport('married')
    writeFileSync('/tmp/sample-married.html', html)
    const t = text(html)
    expect(html).not.toMatch(/\$\{|\{sp\}|\{Sp\}|\{mar\}|\{other\}|undefined|\[object|NaN/)
    expect(t).toMatch(/Example report/)
    expect(t).toMatch(/fictional people and answers/)
    expect(t).toMatch(/Reading the gaps/)
    expect(t).toMatch(/Grace/)
    expect(t).toMatch(/From your own answers/)
    expect(t).toMatch(/In your own words/)
    expect(t).toMatch(/INTEGRITY SIGNAL/)
    expect(t).toMatch(/YOUR FIRST MONTH/)
    expect(t).toMatch(/This is an example report/)
    expect(t).not.toMatch(/This report is saved to your account\. Your Formation Guide will read it and reach out/)
    expect(html).toContain('/register?from=sample')
  })

  it('readiness example: solo, never mentions a spouse', () => {
    const html = buildSampleReport('readiness')
    writeFileSync('/tmp/sample-readiness.html', html)
    const t = text(html)
    expect(html).not.toMatch(/\$\{|\{sp\}|\{mar\}|undefined|\[object|NaN/)
    expect(t).toMatch(/Example report/)
    expect(t).not.toMatch(/Reading the gaps|Between the two of you|your spouse|your marriage/i)
    expect(t).toMatch(/One thing to do this week/)
  })

  it('the integrity flag names the actual contradiction', () => {
    expect(text(buildSampleReport('married'))).toMatch(/you said .*function as a team.* was almost always/i)
  })
})
