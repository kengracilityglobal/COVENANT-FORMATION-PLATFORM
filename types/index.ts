// @ts-nocheck
// ── Core platform types ──────────────────────────────────────────
// Forked from EIKON's type system. Renamed for the marriage-formation
// domain: participant_id -> still used for an individual's own
// assessment/profile, but the new unit of care is the Couple, which
// links two profiles together. See docs/VERIFICATION.md for what was
// kept from EIKON as-is vs. rebuilt for the dyadic model.

export type UserRole = 'participant' | 'guide' | 'admin'
export type SubscriptionStatus = 'trial' | 'active' | 'paused' | 'expired'
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'report_generated'
export type QuestionType = 'scenario' | 'frequency' | 'reflective_disclosure'

// The eight pillars of covenant formation — see docs/PILLARS.md for the
// full rationale (each pillar's anchor word, Scripture, and why Intimacy
// and Shared Vision & Stewardship were split out as their own domains
// rather than folded into Oneness).
export type PillarName =
  | 'covenant_faithfulness'
  | 'oneness'
  | 'sacrificial_love'
  | 'intimacy'
  | 'truthful_communication'
  | 'conflict_repair'
  | 'mutual_honor'
  | 'shared_vision'
  | 'cross_pillar'

// Formation descriptors — same five-band scale as EIKON, for one Guide
// fluent in both systems and one shared design language.
export type FormationDescriptor = 'christformed' | 'rooted' | 'growing' | 'awakening' | 'unengaged'

// Which couple's-journey track an assessment belongs to. Same pillars,
// same dyadic mechanism, different question framing — see docs/PILLARS.md.
export type AssessmentTrack = 'premarital' | 'married'

// Which side of the couple a profile is, inside its couple record.
export type PartnerSlot = 'partner_a' | 'partner_b'
export type CoupleStatus = 'pending' | 'active'

export type PaymentProvider = 'paystack' | 'flutterwave' | 'paypal'

// ── Profile ──────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  guide_id: string | null
  subscription_status: SubscriptionStatus
  onboarding_completed: boolean
  relationship_history: RelationshipHistory | null
  notification_preferences: NotificationPreferences
  created_at: string
  updated_at: string
}

export interface RelationshipHistory {
  years_together: string
  relationship_stage: string
  previous_formation: string
  current_season: string
  location: string
}

export interface NotificationPreferences {
  formation_reminders: boolean
  guide_messages: boolean
  partner_activity: boolean
}

// ── Couple ───────────────────────────────────────────────────────
// The core new construct this platform adds over EIKON: a couple is
// two profiles, paired by invite, sharing one Formation Guide and one
// track. Each partner still takes the assessment on their own account
// — never jointly — so answers aren't performed for each other.

export interface Couple {
  id: string
  partner_a_id: string
  partner_b_id: string | null
  guide_id: string | null
  track: AssessmentTrack
  status: CoupleStatus
  invite_code: string
  invite_email: string | null
  cycle_number: number
  created_at: string
  partner_a?: Pick<Profile, 'id' | 'full_name' | 'email'>
  partner_b?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

// ── Assessment ───────────────────────────────────────────────────
// Unchanged in shape from EIKON — still one assessment per person —
// with couple_id and track added so the pair can be reassembled for
// the gap report without ever averaging the two in storage.

export interface Assessment {
  id: string
  participant_id: string
  couple_id: string
  track: AssessmentTrack
  cycle_number: number
  status: AssessmentStatus
  started_at: string | null
  completed_at: string | null
  last_question_index: number
  pillar_scores: PillarScores | null
  pillar_descriptors: PillarDescriptors | null
  integrity_flags: IntegrityFlags | null
  priority_stack: PillarName[] | null
  overall_score: number | null
  report_generated_at: string | null
  scoring_notes: string | null
  pillar_score_overrides: Partial<Record<PillarName, { score: number; reason: string; overridden_by: string; overridden_at: string }>> | null
  computed_pillar_scores?: PillarScores
  overridden_pillars?: PillarName[]
  participant_acknowledgement: ParticipantAcknowledgement | null
  created_at: string
}

export interface ParticipantAcknowledgement {
  submitted_at: string
  overall_resonance: 'yes' | 'somewhat' | 'no'
  pillar_resonance: Partial<Record<PillarName, 'yes' | 'somewhat' | 'no'>>
  participant_note: string
}

export type PillarScores = Record<PillarName, number>
export type PillarDescriptors = Record<PillarName, FormationDescriptor>
export type IntegrityFlags = Record<PillarName, 'none' | 'minor' | 'significant'>

// ── Dyadic gap ───────────────────────────────────────────────────
// Computed on the fly from both partners' assessments — never stored
// as its own row, so it can never drift from the two source assessments.
// See lib/scoring/gap.ts.

export interface PillarGap {
  pillar: PillarName
  partner_a_score: number | null
  partner_a_descriptor: FormationDescriptor | null
  partner_b_score: number | null
  partner_b_descriptor: FormationDescriptor | null
  gap: number | null
  gap_band: 'aligned' | 'notable' | 'significant' | null
}

export interface CoupleGapReport {
  couple_id: string
  track: AssessmentTrack
  both_complete: boolean
  pillars: PillarGap[]
  joint_priority_stack: PillarName[]
}

// ── Question ─────────────────────────────────────────────────────

export interface Question {
  id: string
  code: string
  pillar: PillarName
  track: AssessmentTrack
  question_type: QuestionType
  sequence_order: number
  question_text: string
  scale_reversed: boolean
  scoring_rubric: ScoringRubric
  integrity_flag_logic: IntegrityFlagLogic | null
  cross_ref_questions: string[] | null
  active: boolean
  created_at: string
}

export interface ScoringRubric {
  christformed: string
  rooted: string
  growing: string
  awakening: string
  unengaged: string
}

export interface IntegrityFlagLogic {
  condition: string
  cross_ref: string[]
  flag_level: 'minor' | 'significant'
}

// ── Response ─────────────────────────────────────────────────────

export interface Response {
  id: string
  assessment_id: string
  participant_id: string
  question_id: string
  response_text: string | null
  response_scale: number | null
  computed_score: number | null
  descriptor_assigned: FormationDescriptor | null
  flags_raised: string[] | null
  word_count: number | null
  response_time_seconds: number | null
  answered_at: string
}

// ── Scoring ──────────────────────────────────────────────────────

export interface ScoringResult {
  scored_responses: Response[]
  pillar_scores: PillarScores
  pillar_descriptors: PillarDescriptors
  integrity_flags: IntegrityFlags
  priority_stack: PillarName[]
  overall_score: number
}

// ── Pillar display constants ────────────────────────────────────

export const CORE_PILLAR_ORDER: PillarName[] = [
  'covenant_faithfulness', 'oneness', 'sacrificial_love', 'intimacy',
  'truthful_communication', 'conflict_repair', 'mutual_honor', 'shared_vision',
]

export const PILLAR_DISPLAY_NAMES: Record<PillarName, string> = {
  covenant_faithfulness:   'Covenant Faithfulness',
  oneness:                 'Oneness',
  sacrificial_love:        'Sacrificial Love',
  intimacy:                'Intimacy',
  truthful_communication:  'Truthful Communication',
  conflict_repair:         'Conflict & Repair',
  mutual_honor:            'Mutual Honor',
  shared_vision:           'Shared Vision & Stewardship',
  cross_pillar:            'Cross-Pillar',
}

// Each pillar's anchor word — Hebrew or Greek, named per pillar rather
// than assumed to be one language (EIKON's pillars are all Greek; this
// set mixes Hebrew chesed/echad/yada with Greek agape/aletheia/eirene/
// timao/koinonia, so each entry carries its own language).
export const PILLAR_ANCHOR: Record<PillarName, { word: string; language: 'Hebrew' | 'Greek' | '' }> = {
  covenant_faithfulness:   { word: 'Chesed',    language: 'Hebrew' },
  oneness:                 { word: 'Echad',     language: 'Hebrew' },
  sacrificial_love:        { word: 'Agape',     language: 'Greek' },
  intimacy:                { word: 'Yada',      language: 'Hebrew' },
  truthful_communication:  { word: 'Aletheia',  language: 'Greek' },
  conflict_repair:         { word: 'Eirene',    language: 'Greek' },
  mutual_honor:            { word: 'Timao',     language: 'Greek' },
  shared_vision:           { word: 'Koinonia',  language: 'Greek' },
  cross_pillar:            { word: '',          language: '' },
}

export const PILLAR_SCRIPTURE: Record<PillarName, string> = {
  covenant_faithfulness:   'I will betroth you to me forever. — Hosea 2:19',
  oneness:                 'The two will become one flesh. — Genesis 2:24',
  sacrificial_love:        'As Christ loved the church and gave himself up for her. — Ephesians 5:25',
  intimacy:                'Adam knew Eve his wife. — Genesis 4:1',
  truthful_communication:  'Speaking the truth in love. — Ephesians 4:15',
  conflict_repair:         'Do not let the sun go down while you are still angry. — Ephesians 4:26',
  mutual_honor:            'Submit to one another out of reverence for Christ. — Ephesians 5:21',
  shared_vision:           'Can two walk together, except they be agreed? — Amos 3:3',
  cross_pillar:            '',
}

export const DESCRIPTOR_THRESHOLDS: Record<FormationDescriptor, [number, number]> = {
  christformed: [85, 100],
  rooted:       [70, 84],
  growing:      [50, 69],
  awakening:    [30, 49],
  unengaged:    [0, 29],
}

export const DESCRIPTOR_COLORS: Record<FormationDescriptor, string> = {
  christformed: '#2C5F2E',
  rooted:       '#4A7A4A',
  growing:      '#B8972A',
  awakening:    '#C47A1A',
  unengaged:    '#8B2020',
}

export const DESCRIPTOR_LABELS: Record<FormationDescriptor, string> = {
  christformed: 'Christformed',
  rooted:       'Rooted',
  growing:      'Growing',
  awakening:    'Awakening',
  unengaged:    'Unengaged',
}

// Gap bands — the Perception Gap Index, the platform's core new metric.
// Thresholds on the 0-100 score scale.
export const GAP_BANDS: Array<{ max: number; band: 'aligned' | 'notable' | 'significant' }> = [
  { max: 15,  band: 'aligned' },
  { max: 35,  band: 'notable' },
  { max: 101, band: 'significant' },
]

export const GAP_BAND_LABELS: Record<'aligned' | 'notable' | 'significant', string> = {
  aligned:     'Aligned',
  notable:     'Notable Gap',
  significant: 'Significant Gap',
}

export const GAP_BAND_COLORS: Record<'aligned' | 'notable' | 'significant', string> = {
  aligned:     '#4A7A4A',
  notable:     '#C47A1A',
  significant: '#8B2020',
}

export interface ReportContent {
  id: string
  content_type: string
  pillar: PillarName | null
  descriptor: FormationDescriptor | null
  content_key: string
  content_text: string
  version: number
  active: boolean
  created_at: string
  updated_at: string
}
