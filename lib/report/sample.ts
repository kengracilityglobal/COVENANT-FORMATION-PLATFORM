// lib/report/sample.ts
//
// A fully fictional example report, rendered by the REAL report builder so it
// is exactly what a person gets with no API key set. Served publicly at
// /sample-report (see app/(public)/sample-report/route.ts) so people can see
// what the full assessment produces before they register.
//
// Everything here is invented: the people, the scores and the written answers.
// The pages say so in a banner at the top and a note at the bottom, and the
// closing line that claims the report "is saved to your account" is replaced.

import { buildReportHTML } from './builder'
import { CORE_PILLARS, descriptorFromScore, scoreFrequency, type CorePillar } from '@/lib/scoring/aggregate'
import { computeCoupleGap } from '@/lib/scoring/gap'
import type { QuestionLite, ResponseLite } from './offline-portrait'

export type SampleTrack = 'married' | 'readiness'

interface SampleItem {
  /** Frequency answer, 1-5 */
  freq: { text: string; scale: number; line: string }
  /** Written answer */
  written: { text: string; score: number; line: string; answer: string }
}
interface SamplePillar { score: number; partner?: number; flag?: 'minor' | 'significant'; item: SampleItem }

const MARRIED: Record<CorePillar, SamplePillar> = {
  covenant_faithfulness: {
    score: 84, partner: 88,
    item: {
      freq: { text: 'When keeping a promise to my spouse becomes inconvenient, I keep it anyway.', scale: 5, line: 'Inconvenience never enters the decision; the promise simply holds' },
      written: { text: 'Describe a time you made a promise to your spouse and keeping it turned out to be costly. What did you do?', score: 62, line: 'Keeps the commitment, but lets the cost show', answer: 'I told Grace I would be at her sister’s wedding rehearsal and a deadline moved up the same day. I went, but I was on my phone half the time and I let her see I was annoyed.' },
    },
  },
  oneness: {
    score: 66, partner: 49, flag: 'significant',
    item: {
      freq: { text: 'My spouse and I function as a team making decisions together, rather than as two people who happen to live in the same house.', scale: 5, line: 'Decisions are reflexively joint; separateness is not the default posture' },
      written: { text: 'Describe a recent decision where you and your spouse did not agree. How was it actually made?', score: 25, line: 'The decision was made by one person and announced to the other', answer: 'We disagreed about taking a job offer in another city. I had already told my manager yes before I told Grace, because I knew she would hesitate. I told myself it was easier that way.' },
    },
  },
  sacrificial_love: {
    score: 78, partner: 70,
    item: {
      freq: { text: 'I make choices that cost me something real, like time, comfort or money, for my spouse’s good, without keeping score.', scale: 4, line: 'Gives sacrificially; occasionally aware of the cost but does not withhold' },
      written: { text: 'Describe the last time you gave up something you wanted for your spouse. How did you feel afterward?', score: 55, line: 'Gives, then mentions the cost afterward', answer: 'I gave up my Saturday to help her mother move. I did not complain at the time, but I did mention it a week later when she asked me to help with something else.' },
    },
  },
  intimacy: {
    score: 47, partner: 74, flag: 'minor',
    item: {
      freq: { text: 'I tell my spouse about my fears and failures, not just my wins.', scale: 3, line: 'Shares struggles when asked, rarely before' },
      written: { text: 'Describe a recent time you were struggling. Who knew, and when did they find out?', score: 28, line: 'Struggles stay private, even from the closest person', answer: 'When I lost a big contract last year I told Grace it was "a bit slow" for two months. She found out from my brother.' },
    },
  },
  truthful_communication: {
    score: 61, partner: 58,
    item: {
      freq: { text: 'What I tell my spouse matches what I actually think and feel, even when the truth is uncomfortable.', scale: 4, line: 'Usually says the true thing, with occasional softening' },
      written: { text: 'Describe a time you had to tell your spouse something hard. What did you say, and how did you say it?', score: 48, line: 'Says it, but wraps it in so much softening that the point can be missed', answer: 'I needed to tell Grace I was not comfortable with how much we were lending her cousin. I said it as a joke first, then again more seriously a few days later when she had not picked up on it.' },
    },
  },
  conflict_repair: {
    score: 38, partner: 66,
    item: {
      freq: { text: 'After my spouse and I argue, we actually resolve it, not just stop talking about it.', scale: 2, line: 'Arguments end in a truce more than in repair' },
      written: { text: 'Describe how your last real argument ended. What happened in the days after?', score: 40, line: 'Repair happens through ordinary life, and the cause is rarely named', answer: 'After the argument about money we barely spoke for most of a week. It ended when she made tea one evening and asked about my day. We never really talked about the money itself.' },
    },
  },
  mutual_honor: {
    score: 72, partner: 80,
    item: {
      freq: { text: 'Even when I am frustrated with my spouse, I speak to them with respect.', scale: 4, line: 'Respect holds under frustration most of the time' },
      written: { text: 'Describe a moment you were not proud of in how you spoke to or about your spouse.', score: 55, line: 'Honor slips in front of other people', answer: 'I corrected how she pronounced a word in front of my colleagues and she went quiet. I knew right away it was a mistake, but I did not say anything about it afterward.' },
    },
  },
  shared_vision: {
    score: 55, partner: 52,
    item: {
      freq: { text: 'My spouse and I have talked through how we will handle money, family and where we will live.', scale: 3, line: 'The big picture is discussed; the specifics are not' },
      written: { text: 'Describe what you and your spouse picture your life looking like in ten years.', score: 38, line: 'Each person holds a picture the other has not fully seen', answer: 'We both say we want a home with some land and a growing family. I have not actually asked her where, or what she would want to give up to get there.' },
    },
  },
}

const READINESS: Record<CorePillar, SamplePillar> = {
  covenant_faithfulness: {
    score: 74,
    item: {
      freq: { text: 'When I make a promise to someone I’m close to, I follow through even after my feelings about it change.', scale: 4, line: 'Follows through reliably, with occasional visible effort' },
      written: { text: 'Describe a time you committed to something for someone close to you and it became inconvenient.', score: 45, line: 'Follows through when it is easy and renegotiates when it is not', answer: 'I told my brother I would help with his shop opening. The week before, I got invited on a trip and told him I could only come for one day. He said it was fine, but I could tell it was not.' },
    },
  },
  oneness: {
    score: 58,
    item: {
      freq: { text: 'I check in with the people close to me before making decisions that affect them.', scale: 3, line: 'Checks in on big decisions, rarely on smaller ones' },
      written: { text: 'Describe a decision you made recently that affected someone close to you. How did they find out?', score: 40, line: 'Decides first and gets agreement afterward', answer: 'When my housemates and I had to choose a new internet plan I just signed up for the one I liked and told them afterward. Nobody complained, but I could tell one of them was annoyed.' },
    },
  },
  sacrificial_love: {
    score: 81,
    item: {
      freq: { text: 'I help people I love even when it costs me something and I will not get thanked.', scale: 4, line: 'Gives without mentioning the cost most of the time' },
      written: { text: 'Describe a time you gave up something for a person you love.', score: 92, line: 'Gives without a ledger and without being asked', answer: 'A friend lost his job and I covered his rent for two months. I never brought it up and I would not have if he had not.' },
    },
  },
  intimacy: {
    score: 52,
    item: {
      freq: { text: 'I tell people close to me what I am actually struggling with.', scale: 3, line: 'Shares struggles when asked, rarely before' },
      written: { text: 'Describe a hard season and who knew about it while it was happening.', score: 28, line: 'Struggles stay private, even from the closest people', answer: 'When my mother was ill last year I told my friends I was fine. I did not want to be a burden. One of them told me later she would have wanted to know.' },
    },
  },
  truthful_communication: {
    score: 66,
    item: {
      freq: { text: 'When something is bothering me in a relationship, I say so directly rather than going quiet or dropping hints.', scale: 4, line: 'Usually says it directly, occasionally goes quiet first' },
      written: { text: 'Describe a time you had to tell someone close to you something hard.', score: 50, line: 'Says it eventually, after hinting first', answer: 'I had to tell a friend that his jokes about my job were wearing on me. I dropped hints for a month before I finally just said it.' },
    },
  },
  conflict_repair: {
    score: 44,
    item: {
      freq: { text: 'After an argument, I’m usually the one who reaches out first to repair things, rather than waiting the other person out.', scale: 3, line: 'Reaches out sometimes, waits other times' },
      written: { text: 'Describe how your last real argument with someone close to you ended.', score: 30, line: 'Waits for the other person to move first, often for days', answer: 'My cousin and I did not speak for almost two weeks after a disagreement about his wedding plans. He messaged first. I told myself I would have done it eventually.' },
    },
  },
  mutual_honor: {
    score: 69,
    item: {
      freq: { text: 'Even when I am frustrated with someone, I speak to them with respect.', scale: 4, line: 'Respect holds under frustration most of the time' },
      written: { text: 'Describe a time you were frustrated with someone close to you. How did you speak to them?', score: 62, line: 'Respectful, with an edge that shows through', answer: 'My sister kept changing plans at the last minute. I stayed polite, but I know the tone I used made it obvious how annoyed I was.' },
    },
  },
  shared_vision: {
    score: 47,
    item: {
      freq: { text: 'I have thought through what I want about money, family and where I will live.', scale: 2, line: 'Has not yet decided what they want about money, family or place' },
      written: { text: 'Describe what you picture your life looking like in ten years.', score: 55, line: 'Has a general picture, with the specifics still open', answer: 'I see myself married with a small family, working in something I believe in. I could not tell you where, or what I would earn, or how I would handle supporting my parents.' },
    },
  },
}

const BANNER = `
<div style="position:sticky; top:0; z-index:100; background:#B8972A; color:#0D0B08; text-align:center; font-family:Georgia,serif; font-size:12px; font-weight:700; letter-spacing:0.1em; padding:10px 16px; text-transform:uppercase;">
  Example report &middot; fictional people and answers &middot;
  <a href="/taster" style="color:#0D0B08; text-decoration:underline;">Try the free taster</a> &middot;
  <a href="/register?from=sample" style="color:#0D0B08; text-decoration:underline;">Take the real assessment</a>
</div>`

const FOOT = `
<div style="max-width:560px; margin:48px auto 64px; padding:28px; text-align:center; border:1px solid rgba(184,151,42,0.25); background:rgba(184,151,42,0.04);">
  <p style="font-family:Georgia,serif; font-size:15px; line-height:1.8; color:#C4A96A; margin:0 0 18px;">
    This was an example, written from invented answers. Yours is written from yours.
  </p>
  <a href="/register?from=sample" style="display:inline-block; background:#B8972A; color:#0D0B08; font-family:Georgia,serif; font-weight:700; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; padding:14px 28px;">Take the free assessment &rarr;</a>
  <p style="margin:16px 0 0; font-family:Georgia,serif; font-size:12px;"><a href="/taster" style="color:#8A7340;">Or start with the 2-minute taster</a></p>
</div>`

export function buildSampleReport(track: SampleTrack): string {
  const data = track === 'readiness' ? READINESS : MARRIED
  const now = new Date().toISOString()

  const questions: QuestionLite[] = []
  const responses: ResponseLite[] = []
  for (const p of CORE_PILLARS) {
    const { item } = data[p]
    const fScore = scoreFrequency(item.freq.scale, false)
    const fId = `${p}-f`, wId = `${p}-w`
    questions.push(
      { id: fId, pillar: p, question_type: 'frequency', question_text: item.freq.text, scoring_rubric: { [descriptorFromScore(fScore)]: item.freq.line } },
      { id: wId, pillar: p, question_type: 'scenario', question_text: item.written.text, scoring_rubric: { [descriptorFromScore(item.written.score)]: item.written.line } },
    )
    responses.push(
      { question_id: fId, response_scale: item.freq.scale, computed_score: fScore },
      { question_id: wId, response_text: item.written.answer, computed_score: item.written.score, word_count: item.written.answer.split(/\s+/).length },
    )
  }

  const scores = Object.fromEntries(CORE_PILLARS.map(p => [p, data[p].score])) as Record<string, number>
  const descriptors = Object.fromEntries(CORE_PILLARS.map(p => [p, descriptorFromScore(scores[p])]))
  const flags = Object.fromEntries(CORE_PILLARS.filter(p => data[p].flag).map(p => [p, data[p].flag]))
  const overall = Math.round(CORE_PILLARS.reduce((s, p) => s + scores[p], 0) / CORE_PILLARS.length)

  const assessment: any = {
    id: 'sample', participant_id: 'sample', couple_id: track === 'readiness' ? null : 'sample', track, cycle_number: 1,
    status: 'report_generated', pillar_scores: scores, pillar_descriptors: descriptors,
    priority_stack: [...CORE_PILLARS].sort((a, b) => scores[a] - scores[b] || CORE_PILLARS.indexOf(a) - CORE_PILLARS.indexOf(b)),
    overall_score: overall, integrity_flags: flags, completed_at: now, created_at: now,
  }

  let coupleGap = null
  if (track === 'married') {
    const partnerScores = Object.fromEntries(CORE_PILLARS.map(p => [p, data[p].partner ?? 60]))
    coupleGap = computeCoupleGap(
      { pillar_scores: scores, pillar_score_overrides: null, status: 'completed' },
      { pillar_scores: partnerScores, pillar_score_overrides: null, status: 'completed' },
    )
  }

  const profile: any = { id: 'sample', full_name: track === 'readiness' ? 'Chidi (example)' : 'Daniel (example)', email: '', role: 'participant' }

  let html = buildReportHTML({
    profile, assessment, responses: responses as any, reportContent: [], questions,
    coupleGap, otherPartnerName: track === 'married' ? 'Grace' : null,
  })

  html = html
    .replace('This report is saved to your account. Your Formation Guide will read it and reach out.', 'This is an example report. A real one is saved to your account for you and your Formation Guide.')
    .replace('<body>', `<body>${BANNER}`)
    .replace('</body>', `${FOOT}</body>`)
  return html
}
