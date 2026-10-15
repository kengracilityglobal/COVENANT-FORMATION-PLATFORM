-- ============================================================
-- Covenant Formation Platform — Migration 007
-- Married-track bank: 16 more rated questions (50 -> 66).
--
-- WHY. Each area had only 3 rated questions, so one answer moved an area
-- by 25-33 points, and every rated statement was positively worded, so
-- tapping "Almost always" all the way down gave a perfect score and
-- nothing flagged it. This adds two REVERSE-WORDED rated questions per
-- area ("Almost always" is the worse answer), bringing each area to 5
-- rated questions, 2 of them reverse-keyed. lib/scoring/aggregate.ts flags
-- an area when a positive and a reverse question are both agreed with.
--
-- ALSO corrects TC_FR_02. It is worded positively ("I bring up problems
-- directly with my spouse...") but was seeded scale_reversed = true, so a
-- good answer scored 0. Databases seeded before this fix need the UPDATE
-- below; fresh installs already get the fixed 003. Assessments completed
-- before the fix have a Truthful Communication score that was computed
-- the wrong way round and should be re-scored.
--
-- Additive and re-runnable: ON CONFLICT DO NOTHING, no DELETE.
-- ============================================================

UPDATE questions SET scale_reversed = false
 WHERE code = 'TC_FR_02' AND track = 'married' AND scale_reversed = true;

INSERT INTO questions (
  code, pillar, track, question_type, sequence_order,
  question_text, scale_reversed, scoring_rubric,
  integrity_flag_logic, cross_ref_questions, active
) VALUES

('CF_FR_04','covenant_faithfulness','married','frequency',100,
'I keep a quiet exit in mind — a plan, a place, or a person — in case my marriage becomes too hard.',
true,
'{"christformed":"No exit is held in reserve; the commitment is whole","rooted":"An exit rarely crosses my mind and is dismissed quickly","growing":"An exit is sometimes imagined in hard seasons but never planned","awakening":"An exit is regularly considered and partly prepared","unengaged":"An exit is actively held in reserve"}'::jsonb,
NULL,
NULL, true),

('CF_FR_05','covenant_faithfulness','married','frequency',101,
'I agree to things for my spouse in the moment and then quietly renegotiate them later.',
true,
'{"christformed":"What I agree to, I do, or I say so before it goes unmet","rooted":"I rarely renegotiate, and say so openly when I do","growing":"I sometimes let agreed things slide once they become costly","awakening":"I often agree easily and then adjust quietly without saying so","unengaged":"Agreements are routinely treated as provisional"}'::jsonb,
NULL,
NULL, true),

('ON_FR_04','oneness','married','frequency',102,
'I make decisions about our money, time, or home on my own and tell my spouse afterward.',
true,
'{"christformed":"Decisions that affect both of us are always made together first","rooted":"I rarely decide alone, and I inform right away when I do","growing":"I decide smaller matters alone and bigger ones together","awakening":"I often decide first and inform afterward","unengaged":"Decisions are routinely made alone and announced"}'::jsonb,
NULL,
NULL, true),

('ON_FR_05','oneness','married','frequency',103,
'When my spouse and my family disagree, I find myself taking my family''s side.',
true,
'{"christformed":"Loyalty to the person I am closest to is clear and shown in practice","rooted":"I usually stand with that person, with an occasional pull toward family","growing":"I am torn, and sometimes default to my family''s view","awakening":"I often default to my family and explain it away","unengaged":"My family''s view regularly overrides that person''s"}'::jsonb,
NULL,
NULL, true),

('SL_FR_04','sacrificial_love','married','frequency',104,
'I privately keep track of what I have done for my spouse compared with what they have done for me.',
true,
'{"christformed":"No ledger is kept; giving is simply given","rooted":"A ledger occasionally forms and is let go quickly","growing":"A running tally exists in the background and sometimes surfaces","awakening":"The tally is kept actively and brought up in conflict","unengaged":"Giving is conditional on what comes back"}'::jsonb,
NULL,
NULL, true),

('SL_FR_05','sacrificial_love','married','frequency',105,
'When I am tired or stressed, my spouse''s needs feel like an interruption.',
true,
'{"christformed":"Their needs still get my attention when I have little left","rooted":"I usually respond, with some visible effort","growing":"I respond when rested and am short-tempered when depleted","awakening":"Needs are often met with irritation or delay","unengaged":"Needs are treated as an imposition"}'::jsonb,
NULL,
NULL, true),

('IN_FR_04','intimacy','married','frequency',106,
'There are fears or failures I would rather my spouse never found out about.',
true,
'{"christformed":"Nothing significant is kept hidden out of fear","rooted":"A few things are still private, and I am working toward sharing them","growing":"Several significant things are kept hidden to stay safe","awakening":"Much of my inner life is hidden on purpose","unengaged":"Most of what is real stays hidden"}'::jsonb,
NULL,
NULL, true),

('IN_FR_05','intimacy','married','frequency',107,
'When my spouse tries to talk about something vulnerable, I change the subject or find something else to do.',
true,
'{"christformed":"I stay present and curious when someone opens up","rooted":"I usually stay present and occasionally deflect","growing":"I stay present for lighter things and deflect when it gets heavy","awakening":"I often deflect, or try to fix instead of listening","unengaged":"I routinely avoid vulnerable conversations"}'::jsonb,
NULL,
NULL, true),

('TC_FR_04','truthful_communication','married','frequency',108,
'I tell my spouse a softened or partial version of the truth to avoid an argument.',
true,
'{"christformed":"What I say is whole and true, even when it costs me","rooted":"I rarely soften the truth, and correct it when I do","growing":"I soften the truth when the topic is sensitive","awakening":"I often give partial versions to keep the peace","unengaged":"I routinely edit the truth to avoid friction"}'::jsonb,
NULL,
NULL, true),

('TC_FR_05','truthful_communication','married','frequency',109,
'I answer questions with something technically true that leaves out what my spouse really wanted to know.',
true,
'{"christformed":"I answer the question that was actually asked","rooted":"I rarely dodge, and notice when I do","growing":"I sometimes answer narrowly to avoid a harder conversation","awakening":"I often answer the letter of the question and not its point","unengaged":"I habitually answer around what was really asked"}'::jsonb,
NULL,
NULL, true),

('CR_FR_04','conflict_repair','married','frequency',110,
'After a fight I go quiet and let time do the repairing, instead of dealing with it.',
true,
'{"christformed":"I come back to it and deal with it, and do not leave it to time","rooted":"I usually return to it, sometimes after too long","growing":"I often wait it out and return only if the other person does","awakening":"I usually let silence close it","unengaged":"Time and distance are the only repair"}'::jsonb,
NULL,
NULL, true),

('CR_FR_05','conflict_repair','married','frequency',111,
'When we argue, I bring up my spouse''s old failures to make my point.',
true,
'{"christformed":"I stay with the issue at hand and leave old failures alone","rooted":"I rarely bring up the past, and apologize when I do","growing":"I bring up past failures when I feel cornered","awakening":"Old failures are a regular part of how I argue","unengaged":"The past is used as a weapon in most arguments"}'::jsonb,
NULL,
NULL, true),

('MH_FR_04','mutual_honor','married','frequency',112,
'When I am frustrated, I roll my eyes, sigh, or make a joke at my spouse''s expense.',
true,
'{"christformed":"Frustration comes out as honest words, never contempt","rooted":"Contempt rarely shows, and I apologize when it does","growing":"Contempt shows under real pressure","awakening":"Sarcasm and eye-rolling are a regular habit","unengaged":"Contempt is a routine part of how I show frustration"}'::jsonb,
NULL,
NULL, true),

('MH_FR_05','mutual_honor','married','frequency',113,
'I make important decisions as if my spouse''s opinion counts for less than mine.',
true,
'{"christformed":"Their view carries real weight, and it has changed my decisions","rooted":"Their view usually weighs equally with mine","growing":"I listen, but mine tends to win when it matters","awakening":"I often treat their view as secondary","unengaged":"Their view rarely changes anything"}'::jsonb,
NULL,
NULL, true),

('SV_FR_04','shared_vision','married','frequency',114,
'My spouse and I want different things for our future, and we avoid talking about it.',
true,
'{"christformed":"Differences about the future are named and worked through","rooted":"Differences are known and being discussed","growing":"Differences are sensed but mostly left unspoken","awakening":"Differences are avoided because the subject feels risky","unengaged":"The future is not discussed at all"}'::jsonb,
NULL,
NULL, true),

('SV_FR_05','shared_vision','married','frequency',115,
'I assume my spouse agrees with my plans for our future without having asked them.',
true,
'{"christformed":"Plans that affect others are made with them, not for them","rooted":"I usually check first, with an occasional assumption","growing":"I assume agreement on things that feel obvious to me","awakening":"I often build plans first and inform afterward","unengaged":"Plans are made alone and assumed to be shared"}'::jsonb,
NULL,
NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Re-number sequence_order for the whole married track so the new questions are interleaved
-- with the existing ones (rated questions in rounds across the eight areas, then the
-- cross-pillar rated item, then scenarios, then reflective, then the cross-pillar reflective).
-- Safe for assessments already in progress: the app serves the first unanswered question.
WITH ranked AS (
  SELECT id,
    row_number() OVER (ORDER BY
      CASE WHEN code ~ '_FR_[0-9]+$' AND code !~ '(^|_)X_FR' THEN 1
           WHEN code ~ '(^|_)X_FR' THEN 2
           WHEN code ~ '_SC_[0-9]+$' THEN 3
           WHEN code ~ '_RE_[0-9]+$' AND code !~ '(^|_)X_RE' THEN 4
           ELSE 5 END,
      substring(code from '_([0-9]+)$')::int,
      array_position(ARRAY['covenant_faithfulness','oneness','sacrificial_love','intimacy','truthful_communication','conflict_repair','mutual_honor','shared_vision'], pillar::text),
      code) AS rn
  FROM questions WHERE track = 'married'
)
UPDATE questions q SET sequence_order = ranked.rn FROM ranked WHERE q.id = ranked.id;
