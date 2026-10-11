import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runScoringEngine, keywordScoreWritten, SHORT_ANSWER_CAP, SHORT_ANSWER_WORDS } from '../engine'
import type { Question, Response as EikonResponse } from '@/types'

function q(overrides: Partial<Question> & { id: string; code: string; pillar: string; question_type: string }): Question {
  return {
    question_text: 'Describe a time...', scale_reversed: false,
    scoring_rubric: { christformed: 'top', unengaged: 'bottom' },
    cross_ref_questions: null, integrity_flag_logic: null,
    order_index: 0, active: true, created_at: '', updated_at: '',
    ...overrides,
  } as unknown as Question
}
function r(overrides: Partial<EikonResponse> & { id: string; question_id: string }): EikonResponse {
  return { assessment_id: 'a1', response_scale: null, response_text: null, created_at: '', ...overrides } as unknown as EikonResponse
}

describe('keywordScoreWritten (fallback path)', () => {
  it('gives a very low score to a near-empty answer', () => {
    expect(keywordScoreWritten('fine')).toBeLessThan(30)
  })
  it('rewards interior/action/honesty language over a bare word-count', () => {
    const shallow = 'This week I went to church and it was good and everyone was nice and we sang songs and I liked it a lot honestly it was very nice and pleasant. '.repeat(2)
    const deep = "If I'm honest, I felt resentment when my brother got the credit. I noticed I wanted to correct the story in front of everyone, but I stayed silent and let it stand, even though it cost me something to do that. I did not bring it up afterward either, and I regret that a little."
    expect(keywordScoreWritten(deep)).toBeGreaterThan(keywordScoreWritten(shallow))
  })
  it('never returns a score outside 0-100', () => {
    expect(keywordScoreWritten('')).toBeGreaterThanOrEqual(0)
    expect(keywordScoreWritten('x'.repeat(5000))).toBeLessThanOrEqual(100)
  })
})

describe('runScoringEngine (no ANTHROPIC_API_KEY → deterministic keyword fallback)', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY })
  afterEach(() => { if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey })

  it('marks the result as keyword_fallback and says so in scoring_notes when the AI is unavailable', async () => {
    const questions = [q({ id: 'q1', code: 'HUM_SC_001', pillar: 'covenant_faithfulness', question_type: 'scenario' })]
    const responses = [r({ id: 'r1', question_id: 'q1', response_text: 'I felt proud but I stayed quiet and let someone else take the credit, even though it cost me.' })]
    const result = await runScoringEngine(questions, responses)
    expect(result.scoring_method).toBe('keyword_fallback')
    expect(result.scoring_notes).toContain('keyword_fallback')
  })

  it('caps a short written answer at SHORT_ANSWER_CAP regardless of keyword content', async () => {
    const questions = [q({ id: 'q1', code: 'HUM_SC_001', pillar: 'covenant_faithfulness', question_type: 'scenario' })]
    // Fewer than SHORT_ANSWER_WORDS words, but packed with reward keywords, to
    // prove the length cap overrides the keyword score rather than being
    // bypassed by someone gaming the fallback with buzzwords.
    const shortButLoaded = 'I felt honestly ashamed I said I chose I regret it cost me'
    expect(shortButLoaded.trim().split(/\s+/).length).toBeLessThan(SHORT_ANSWER_WORDS)
    const responses = [r({ id: 'r1', question_id: 'q1', response_text: shortButLoaded })]
    const result = await runScoringEngine(questions, responses)
    const scored = result.scored_responses.find(s => s.id === 'r1')!
    expect(scored.computed_score).toBeLessThanOrEqual(SHORT_ANSWER_CAP)
  })

  it('scores a blank/near-blank answer very low without throwing', async () => {
    const questions = [q({ id: 'q1', code: 'HUM_SC_001', pillar: 'covenant_faithfulness', question_type: 'scenario' })]
    const responses = [r({ id: 'r1', question_id: 'q1', response_text: '' })]
    const result = await runScoringEngine(questions, responses)
    const scored = result.scored_responses.find(s => s.id === 'r1')!
    expect(scored.computed_score).toBeLessThan(20)
  })

  it('scores frequency questions deterministically without ever calling the AI path', async () => {
    const questions = [q({ id: 'q1', code: 'HUM_FR_001', pillar: 'covenant_faithfulness', question_type: 'frequency' })]
    const responses = [r({ id: 'r1', question_id: 'q1', response_scale: 5 })]
    const result = await runScoringEngine(questions, responses)
    const scored = result.scored_responses.find(s => s.id === 'r1')!
    expect(scored.computed_score).toBe(100)
  })

  it('never lets one unanswered question crash the whole batch', async () => {
    const questions = [
      q({ id: 'q1', code: 'A', pillar: 'covenant_faithfulness', question_type: 'scenario' }),
      q({ id: 'q2', code: 'B', pillar: 'oneness', question_type: 'frequency' }),
    ]
    // Response for q1 references a question_id with no matching question — must be skipped, not throw.
    const responses = [
      r({ id: 'r1', question_id: 'does-not-exist', response_text: 'orphaned response' }),
      r({ id: 'r2', question_id: 'q2', response_scale: 3 }),
    ]
    await expect(runScoringEngine(questions, responses)).resolves.toBeDefined()
  })
})
