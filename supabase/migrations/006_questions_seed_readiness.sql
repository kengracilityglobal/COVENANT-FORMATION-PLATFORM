-- ============================================================
-- Covenant Formation Platform — Migration 006
-- Readiness-track question bank, for singles (and engaged couples who
-- want to discern readiness before pairing into the premarital/married
-- tracks). 32 questions: 8 pillars × 4 (2 frequency + 1 scenario + 1
-- reflective-disclosure), no cross-pillar items.
--
-- Deliberately shorter than the married track's 50 (≈12-15 minutes, not
-- 20-25): there is no spouse to cross-reference answers against yet, and
-- a shorter, honest instrument someone actually finishes beats a long one
-- modeled on a track that doesn't fit their situation. See docs/PILLARS.md
-- and docs/VERIFICATION.md.
--
-- Framing throughout is forward-looking and self-examining — "how do you
-- actually behave in your closest relationships right now, and what does
-- that predict" — never "describe your marriage," since there may not be
-- one yet. Codes are prefixed RD_ to stay unique against the married
-- bank's codes.
-- ============================================================

DELETE FROM responses WHERE question_id IN (SELECT id FROM questions WHERE track = 'readiness');
DELETE FROM questions WHERE track = 'readiness';

INSERT INTO questions (code, pillar, track, question_type, sequence_order, question_text, scale_reversed, scoring_rubric, integrity_flag_logic, cross_ref_questions, active) VALUES

-- ── FREQUENCY (16) ──────────────────────────────────────────────

('RD_CF_FR_01','covenant_faithfulness','readiness','frequency',1,
'When I make a promise to someone I''m close to, I follow through even after my feelings about it change.',
false,
'{"christformed":"Follow-through is not contingent on feeling — the promise itself carries the weight","rooted":"Consistently follows through, with rare and acknowledged exceptions","growing":"Usually follows through but some promises quietly slide when feelings shift","awakening":"Promises are often renegotiated once the initial feeling fades","unengaged":"Commitments are treated as conditional on how I feel at the time"}'::jsonb,
NULL, NULL, true),

('RD_ON_FR_01','oneness','readiness','frequency',2,
'I''m comfortable sharing real decision-making power with someone else, rather than just wanting them to support decisions I''ve already made.',
false,
'{"christformed":"Genuinely seeks joint decisions as the default, not as a concession","rooted":"Shares power consistently with occasional lapses into unilateral choices","growing":"Shares on major decisions but defaults to solo control day-to-day","awakening":"Prefers others to support decisions already made rather than shape them","unengaged":"Resists shared decision-making; control stays with me"}'::jsonb,
NULL, NULL, true),

('RD_SL_FR_01','sacrificial_love','readiness','frequency',3,
'I notice when people close to me need something, even when they haven''t asked, and I act on it.',
false,
'{"christformed":"Notices and acts reflexively, without being asked or thanked","rooted":"Usually notices and acts, with occasional lapses under stress","growing":"Acts when asked directly but rarely initiates unprompted","awakening":"Notices but often waits to see if someone else will act first","unengaged":"Largely unaware of others'' needs unless directly told"}'::jsonb,
NULL, NULL, true),

('RD_SL_FR_02','sacrificial_love','readiness','frequency',4,
'I give to people I care about without keeping a mental ledger of what I''m owed in return.',
false,
'{"christformed":"Giving and ledger-keeping genuinely do not coexist","rooted":"Gives freely; occasional awareness of imbalance but it does not curdle","growing":"Gives, but notices and sometimes mentions what has not been reciprocated","awakening":"Giving is often followed by an expectation of equivalent return","unengaged":"Giving is largely conditional on what I expect back"}'::jsonb,
NULL, NULL, true),

('RD_IN_FR_01','intimacy','readiness','frequency',5,
'I let people who are close to me see my real fears and struggles, not just a curated version of myself.',
false,
'{"christformed":"Real struggle is visible by default to those close to me","rooted":"Shares honestly with most people close to me, with some guarded areas","growing":"Shares selectively, usually only when directly asked or in a crisis","awakening":"Keeps a managed, mostly-positive version of myself visible to others","unengaged":"Real struggles stay private even from people closest to me"}'::jsonb,
NULL, NULL, true),

('RD_IN_FR_02','intimacy','readiness','frequency',6,
'I ask people close to me real questions about their inner life, rather than keeping conversation at the surface.',
false,
'{"christformed":"Consistently pursues what is actually going on beneath the surface","rooted":"Regularly asks real questions, with room to go deeper still","growing":"Asks occasionally, more often in response to a prompt than initiating","awakening":"Conversation mostly stays practical or surface-level by default","unengaged":"Rarely asks anything beneath the logistical or surface level"}'::jsonb,
NULL, NULL, true),

('RD_TC_FR_01','truthful_communication','readiness','frequency',7,
'When something is bothering me in a relationship, I say so directly rather than going quiet or dropping hints.',
false,
'{"christformed":"Names what is wrong directly and promptly, every time","rooted":"Usually names it directly, with occasional delay","growing":"Sometimes hints or withdraws before eventually saying it directly","awakening":"Often expects the other person to notice without being told","unengaged":"Regularly goes quiet or indirect rather than naming the issue"}'::jsonb,
NULL, NULL, true),

('RD_TC_FR_02','truthful_communication','readiness','frequency',8,
'I can hear honest feedback about myself without becoming defensive or shutting down.',
false,
'{"christformed":"Receives hard feedback as a gift, consistently, without defensiveness","rooted":"Usually receives it well after a brief initial sting","growing":"Often becomes defensive first, then reconsiders later","awakening":"Feedback is frequently met with justification or deflection","unengaged":"Feedback is experienced as attack and shut down quickly"}'::jsonb,
NULL, NULL, true),

('RD_CR_FR_01','conflict_repair','readiness','frequency',9,
'After an argument, I''m usually the one who reaches out first to repair things, rather than waiting the other person out.',
false,
'{"christformed":"Initiates repair promptly and consistently, regardless of who was more at fault","rooted":"Usually initiates, with occasional pride-driven delay","growing":"Waits to see what the other person does before moving toward repair","awakening":"Repair is usually left to the other person to initiate","unengaged":"Tends to wait the other person out until they give in first"}'::jsonb,
NULL, NULL, true),

('RD_CR_FR_02','conflict_repair','readiness','frequency',10,
'I can stay in a hard conversation without withdrawing, shutting down, or walking away.',
false,
'{"christformed":"Stays fully present through hard conversations, every time","rooted":"Usually stays present, with rare, brief moments of withdrawal","growing":"Stays most of the way through but sometimes checks out near the end","awakening":"Often withdraws or goes quiet once the conversation gets hard","unengaged":"Regularly shuts down or leaves rather than staying in it"}'::jsonb,
NULL, NULL, true),

('RD_MH_FR_01','mutual_honor','readiness','frequency',11,
'I speak about people I''m close to, including when they''re not present, with the same respect I''d want if they could hear me.',
false,
'{"christformed":"Speech about absent people matches exactly what I''d say to their face","rooted":"Nearly always consistent, with rare lapses under frustration","growing":"Mostly respectful but occasionally vents in ways I wouldn''t say directly","awakening":"Noticeably less careful about people when they''re not present","unengaged":"Regularly speaks about people differently than I would to their face"}'::jsonb,
NULL, NULL, true),

('RD_MH_FR_02','mutual_honor','readiness','frequency',12,
'I actively seek out and value the opinions of people whose perspective is different from mine.',
false,
'{"christformed":"Genuinely seeks out disagreement as a source of growth","rooted":"Welcomes differing opinions when they come, without defensiveness","growing":"Tolerates differing opinions but rarely seeks them out","awakening":"Differing opinions are noted but rarely change my view or posture","unengaged":"Differing perspectives are generally dismissed or avoided"}'::jsonb,
NULL, NULL, true),

('RD_SV_FR_01','shared_vision','readiness','frequency',13,
'I have a reasonably clear sense of my own convictions about money, faith, work, and family — not just vague hopes.',
false,
'{"christformed":"Convictions are clear, specific, and tested, not just assumed","rooted":"Mostly clear, with a few areas still being worked out","growing":"Some clarity, but large areas are still vague or unexamined","awakening":"Convictions are mostly inherited assumptions, rarely examined firsthand","unengaged":"Largely unclear on my own convictions in these areas"}'::jsonb,
NULL, NULL, true),

('RD_SV_FR_02','shared_vision','readiness','frequency',14,
'I actively discuss and compare my life direction and values with people close to me, rather than assuming compatibility.',
false,
'{"christformed":"Regularly tests assumptions out loud rather than taking compatibility for granted","rooted":"Discusses this fairly often, with some areas left unspoken","growing":"Discusses occasionally, usually when a difference surfaces by accident","awakening":"Mostly assumes compatibility without checking directly","unengaged":"Rarely discusses life direction or values explicitly with anyone"}'::jsonb,
NULL, NULL, true),

('RD_CF_FR_02','covenant_faithfulness','readiness','frequency',15,
'I tend to stay committed to people and decisions even when the relationship or situation becomes difficult or inconvenient.',
false,
'{"christformed":"Difficulty does not reopen the question of whether to stay committed","rooted":"Stays committed through most difficulty, with occasional wavering","growing":"Stays committed but the difficulty visibly reopens the question internally","awakening":"Commitment noticeably weakens once real difficulty appears","unengaged":"Difficulty regularly leads me to reconsider or exit commitments"}'::jsonb,
NULL, NULL, true),

('RD_ON_FR_02','oneness','readiness','frequency',16,
'When I imagine my future, I picture it as genuinely shared with a spouse, not as my own life with another person added to it.',
false,
'{"christformed":"Future is imagined as one shared life from the ground up","rooted":"Mostly shared, with a few areas still imagined as solely mine","growing":"Imagines a partner joining a future I''ve already largely fixed","awakening":"Future plans are mostly fixed with little room made for a spouse''s input","unengaged":"Future is imagined entirely on my own terms, a spouse not really pictured in it"}'::jsonb,
NULL, NULL, true),

-- ── SCENARIO (8) ─────────────────────────────────────────────────

('RD_CF_SC_01','covenant_faithfulness','readiness','scenario',17,
'Describe a recent time you told someone you''d do something and then no longer felt like doing it. What did you actually do?',
false,
'{"christformed":"Did it fully, at real cost, without making the lost feeling anyone else''s problem","rooted":"Did it, acknowledging the shift in feeling honestly rather than hiding it","growing":"Did it partially, or did it while visibly signaling reluctance","awakening":"Found a technically-compliant way to do less than promised","unengaged":"Let it slide once the feeling that motivated the promise was gone"}'::jsonb,
NULL, NULL, true),

('RD_ON_SC_01','oneness','readiness','scenario',18,
'Describe a close relationship — family, friendship, or a past relationship — where you had to genuinely compromise on something that mattered to you. What did you do, and how did it feel?',
false,
'{"christformed":"Compromised genuinely and the account centers the relationship, not what it cost me","rooted":"Compromised honestly, with the cost acknowledged but not resented afterward","growing":"Compromised partially, or compromised while keeping score of what it cost","awakening":"Found a way to appear flexible while mostly keeping my own preference","unengaged":"Struggled to identify a real compromise, or avoided making one"}'::jsonb,
NULL, NULL, true),

('RD_SL_SC_01','sacrificial_love','readiness','scenario',19,
'Describe the last time you gave up something you wanted — time, money, comfort — for someone else''s good. What was it, and would you do it again?',
false,
'{"christformed":"Gave freely and would do it again without hesitation; the giving itself is what is remembered","rooted":"Gave genuinely; some cost was felt but did not curdle into resentment","growing":"Gave, but with noticeable reluctance or an unresolved sense of cost","awakening":"Gave only after visible hesitation, or now regrets it","unengaged":"Struggled to name a real instance, or named one that cost little"}'::jsonb,
NULL, NULL, true),

('RD_IN_SC_01','intimacy','readiness','scenario',20,
'Describe the last time you told someone something true about yourself that was hard to say. What happened?',
false,
'{"christformed":"Disclosed something costly and specific, and stayed present for the response","rooted":"Disclosed something real, with some self-protection but genuine honesty","growing":"Disclosed something true but relatively low-stakes or well-rehearsed","awakening":"Struggled to recall a real instance, or described something vague","unengaged":"Could not identify a genuine instance of costly self-disclosure"}'::jsonb,
NULL, NULL, true),

('RD_TC_SC_01','truthful_communication','readiness','scenario',21,
'Describe a recent moment when you disagreed with someone close to you. What did you actually say, and how did you say it?',
false,
'{"christformed":"Said the true thing directly, clearly, and without contempt","rooted":"Said it honestly, with minor softening or delay","growing":"Said a version of it, but softened or indirect enough to blur the real disagreement","awakening":"Mostly implied disagreement rather than stating it","unengaged":"Avoided saying it at all, or agreed outwardly while disagreeing inwardly"}'::jsonb,
NULL, NULL, true),

('RD_CR_SC_01','conflict_repair','readiness','scenario',22,
'Describe your most recent real conflict with someone close to you — not a minor annoyance. How did it start, and how did it end?',
false,
'{"christformed":"Conflict led to real repair and a stronger relationship afterward","rooted":"Conflict was resolved honestly, if not perfectly or quickly","growing":"Conflict faded rather than being genuinely resolved","awakening":"Conflict ended in a truce that avoided the actual issue","unengaged":"Conflict is ongoing, unaddressed, or ended the relationship"}'::jsonb,
NULL, NULL, true),

('RD_MH_SC_01','mutual_honor','readiness','scenario',23,
'Describe a time you were clearly wrong, or lost an argument, in front of people you care about. How did you handle it?',
false,
'{"christformed":"Admitted it plainly and quickly, without needing to save face","rooted":"Admitted it honestly, with some initial discomfort","growing":"Eventually admitted it, after some defensiveness or delay","awakening":"Partially admitted it while still defending my overall position","unengaged":"Struggled to admit it, or reframed the situation to avoid being wrong"}'::jsonb,
NULL, NULL, true),

('RD_SV_SC_01','shared_vision','readiness','scenario',24,
'Describe, specifically, what you actually believe and practice about faith, money, or family roles — not what you were taught to say. Where might that differ from what a future spouse would assume about you?',
false,
'{"christformed":"Names a real, specific gap between stated and lived conviction, honestly","rooted":"Names a real difference, if somewhat general","growing":"Describes belief mostly in inherited or expected terms, with little self-examination","awakening":"Mostly restates what I was taught, without checking it against my actual life","unengaged":"Could not name any real gap between what I say and what I practice"}'::jsonb,
NULL, NULL, true),

-- ── REFLECTIVE DISCLOSURE (8) ─────────────────────────────────────

('RD_CF_RE_01','covenant_faithfulness','readiness','reflective_disclosure',25,
'Think honestly about your pattern with commitments — not just romantic ones. Where have you quietly let something slide rather than renegotiate it honestly? What does that reveal about how you might handle a marriage vow once the feeling that made it easy has faded?',
false,
'{"christformed":"Names a specific, costly pattern honestly and draws a real, unflinching connection to future vow-keeping","rooted":"Names a real pattern honestly, with a reasonable connection drawn to marriage","growing":"Names something true but general, with a thin connection to the deeper question","awakening":"Describes the pattern in terms that minimize or justify it","unengaged":"Deflects, denies a pattern exists, or answers a different question"}'::jsonb,
NULL, NULL, true),

('RD_ON_RE_01','oneness','readiness','reflective_disclosure',26,
'Be honest about how independent you actually are right now. What would you have to give up — real control, not just time — to build a life that is truly shared rather than parallel?',
false,
'{"christformed":"Names specific, real control that would have to be surrendered, honestly and without hedging","rooted":"Names something real, if somewhat general","growing":"Acknowledges independence exists but is vague about what sharing would cost","awakening":"Frames independence as already compatible with sharing, without real examination","unengaged":"Does not engage the question, or denies any adjustment would be needed"}'::jsonb,
NULL, NULL, true),

('RD_SL_RE_01','sacrificial_love','readiness','reflective_disclosure',27,
'Marriage will ask you to regularly put another person''s good ahead of your own comfort, for decades, often with no one noticing. Be honest: where in your life right now do you already practice this, and where do you actively avoid it?',
false,
'{"christformed":"Names both sides specifically and honestly, including a real, named avoidance","rooted":"Names a real practice and a real, if softer, avoidance","growing":"Names practice fairly clearly, but the avoidance side is vague or minimized","awakening":"Mostly names practice, barely engages the avoidance half of the question","unengaged":"Describes avoidance as justified, or denies any exists"}'::jsonb,
NULL, NULL, true),

('RD_IN_RE_01','intimacy','readiness','reflective_disclosure',28,
'What are you still hiding from the people closest to you — and what do you imagine would happen if a future spouse found out? Be specific.',
false,
'{"christformed":"Names something real and specific, and engages honestly with the imagined consequence","rooted":"Names something real, with a reasonable account of the imagined consequence","growing":"Names something true but minor, or engages the consequence only vaguely","awakening":"Hints at something without actually naming it","unengaged":"Denies hiding anything, or answers a different, safer question"}'::jsonb,
NULL, NULL, true),

('RD_TC_RE_01','truthful_communication','readiness','reflective_disclosure',29,
'Think about the last time someone told you something true about yourself that you didn''t want to hear. What was your honest internal reaction, even if your outward one was calmer?',
false,
'{"christformed":"Names the real internal reaction honestly, including what was defensive or ugly about it","rooted":"Names a real internal reaction, with reasonable honesty","growing":"Names a reaction but smooths it into something more flattering than it likely was","awakening":"Describes mostly the outward, managed response rather than the internal one","unengaged":"Denies any defensive internal reaction occurred"}'::jsonb,
NULL, NULL, true),

('RD_CR_RE_01','conflict_repair','readiness','reflective_disclosure',30,
'What is your actual pattern in conflict — do you attack, withdraw, appease, or something else? Who in your life would confirm that''s true, and what has it cost your relationships so far?',
false,
'{"christformed":"Names the real pattern specifically, names a real witness, and names a real, specific cost","rooted":"Names a real pattern and a real cost, if somewhat general","growing":"Names a pattern but the cost described is minor or distant","awakening":"Names a flattering or softened version of the pattern","unengaged":"Denies having a conflict pattern, or names one with no acknowledged cost"}'::jsonb,
NULL, NULL, true),

('RD_MH_RE_01','mutual_honor','readiness','reflective_disclosure',31,
'Think of someone you''ve dismissed or talked down to recently — even just in your head. What does your honest internal posture toward people who disagree with you reveal about how you''d treat a spouse''s opinions?',
false,
'{"christformed":"Names a specific instance honestly and draws a real, unflinching connection to a future spouse","rooted":"Names a real instance with a reasonable connection drawn","growing":"Names something true but general, with a thin connection to the deeper question","awakening":"Minimizes the instance or frames it as justified","unengaged":"Denies ever dismissing anyone, or avoids the question"}'::jsonb,
NULL, NULL, true),

('RD_SV_RE_01','shared_vision','readiness','reflective_disclosure',32,
'Name one area — money, parenting philosophy, career ambition, where you''ll live, what faith commitment looks like day to day — where you have not actually done the work of knowing your own mind yet. Be specific about what''s still vague.',
false,
'{"christformed":"Names a specific area and the specific vagueness honestly, without defensiveness","rooted":"Names a real area with reasonable specificity","growing":"Names an area but the actual vagueness is described only in general terms","awakening":"Names an area that is already well-settled, sidestepping the actual question","unengaged":"Denies any area is still unclear"}'::jsonb,
NULL, NULL, true);
