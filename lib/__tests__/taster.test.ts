import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { COUPLE_QUESTIONS, READINESS_QUESTIONS, questionsFor, toPremarital, splitFirstSentence } from '../taster'

const sql = (f: string) => readFileSync(path.join(__dirname, '../../supabase/migrations', f), 'utf8').replace(/''/g, "'")
const norm = (s: string) => s.replace(/’/g, "'")

describe('taster question data', () => {
  it('has six questions per track, two for each of the three areas', () => {
    for (const t of ['married', 'premarital', 'readiness'] as const) {
      const qs = questionsFor(t)
      expect(qs).toHaveLength(6)
      for (const p of ['covenant_faithfulness', 'truthful_communication', 'conflict_repair']) {
        expect(qs.filter(q => q.pillar === p)).toHaveLength(2)
      }
      expect(new Set(qs.map(q => q.id)).size).toBe(6)
    }
  })

  it('uses real questions verbatim from the question banks it says it draws from', () => {
    const married = sql('003_questions_seed_married.sql')
    const readiness = sql('006_questions_seed_readiness.sql')
    for (const q of COUPLE_QUESTIONS) expect(married, q.text).toContain(norm(q.text))
    for (const q of READINESS_QUESTIONS) expect(readiness, q.text).toContain(norm(q.text))
  })

  it('premarital wording never says spouse or marriage', () => {
    for (const q of questionsFor('premarital')) expect(`${q.text} ${q.low} ${q.high}`).not.toMatch(/spouse|marriage/i)
    expect(toPremarital('My spouse and I argue, my spouse’s view, our marriage')).toBe('My partner and I argue, my partner’s view, our relationship')
  })

  it('readiness wording never assumes a spouse', () => {
    for (const q of questionsFor('readiness')) expect(`${q.text} ${q.low} ${q.high}`).not.toMatch(/spouse|marriage|partner/i)
  })

  it('splits a headline sentence from the rest', () => {
    expect(splitFirstSentence('One thing. Two things. Three.')).toEqual({ head: 'One thing.', rest: 'Two things. Three.' })
    expect(splitFirstSentence('Only one sentence.')).toEqual({ head: 'Only one sentence.', rest: '' })
    expect(splitFirstSentence('No end punctuation').head).toBe('No end punctuation')
  })
})
