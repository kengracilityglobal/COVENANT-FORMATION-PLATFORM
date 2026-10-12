-- ============================================================
-- Covenant Formation Platform — Migration 009
-- Premarital-track question bank: 66 questions.
--
-- The premarital track was selectable at onboarding but had no
-- questions, so the assessment for anyone preparing for marriage would
-- have started with nothing to ask. This seeds it.
--
-- Per area (x8): 5 rated (3 positive + 2 reverse-worded) + 2 scenario
-- + 1 reflective = 8, plus 2 cross-pillar items = 66. Same shape as the
-- married bank after migration 007, so the two are comparable.
--
-- Framing: preparing for marriage, not yet in it. Rated and scenario
-- questions ask about the relationship so far ("my partner", "our
-- relationship"), derived from the married bank so the two tracks measure
-- the same things. The 8 reflective questions are written for this track
-- and look forward: what has not yet been said, what is being assumed,
-- what is hoped will change. Questions about physical intimacy are
-- worded around boundaries and expectations, not experience.
-- Codes are prefixed PM_ to stay unique.
--
-- Additive and re-runnable: ON CONFLICT DO NOTHING, no DELETE.
-- ============================================================

INSERT INTO questions (
  code, pillar, track, question_type, sequence_order,
  question_text, scale_reversed, scoring_rubric,
  integrity_flag_logic, cross_ref_questions, active
) VALUES

('PM_CF_FR_01','covenant_faithfulness','premarital','frequency',200,
'When keeping a promise to my partner becomes inconvenient, I keep it anyway.',
false,
'{"christformed":"Inconvenience never enters the decision; the promise simply holds","rooted":"Keeps it consistently, with occasional visible effort","growing":"Keeps most promises but some quietly slide when the cost is real","awakening":"Inconvenient promises are often renegotiated after the fact rather than kept","unengaged":"Promises are treated as conditional on convenience"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["PM_CF_SC_02"],"flag_level":"significant"}'::jsonb,
'["PM_CF_SC_02"]'::jsonb, true),

('PM_CF_FR_02','covenant_faithfulness','premarital','frequency',201,
'I speak about my partner to others the same way whether or not they are in the room.',
false,
'{"christformed":"No distinction between what is said with or without my partner present","rooted":"Generally consistent; rare lapses quickly regretted","growing":"Mostly consistent but complains more freely when my partner is absent","awakening":"Notable gap between how I speak about my partner to others versus to them","unengaged":"Habitually critical of my partner to others in ways I would not say to their face"}'::jsonb,
NULL,
NULL, true),

('PM_CF_FR_03','covenant_faithfulness','premarital','frequency',202,
'When our relationship is difficult, my commitment to stay and work on it does not waver.',
false,
'{"christformed":"Difficulty does not touch the commitment at all; the question of staying does not arise","rooted":"Commitment holds firmly, even if the difficulty is genuinely felt","growing":"Commitment holds but the thought of leaving surfaces under real strain","awakening":"Difficulty regularly produces real doubt about staying","unengaged":"Commitment feels conditional on the relationship being easy"}'::jsonb,
NULL,
NULL, true),

('PM_CF_FR_04','covenant_faithfulness','premarital','frequency',203,
'I keep a quiet exit in mind — a plan, a place, or a person — in case my relationship becomes too hard.',
true,
'{"christformed":"No exit is held in reserve; the commitment is whole","rooted":"An exit rarely crosses my mind and is dismissed quickly","growing":"An exit is sometimes imagined in hard seasons but never planned","awakening":"An exit is regularly considered and partly prepared","unengaged":"An exit is actively held in reserve"}'::jsonb,
NULL,
NULL, true),

('PM_CF_FR_05','covenant_faithfulness','premarital','frequency',204,
'I agree to things for my partner in the moment and then quietly renegotiate them later.',
true,
'{"christformed":"What I agree to, I do, or I say so before it goes unmet","rooted":"I rarely renegotiate, and say so openly when I do","growing":"I sometimes let agreed things slide once they become costly","awakening":"I often agree easily and then adjust quietly without saying so","unengaged":"Agreements are routinely treated as provisional"}'::jsonb,
NULL,
NULL, true),

('PM_CF_SC_01','covenant_faithfulness','premarital','scenario',205,
'Describe a recent situation where honoring a commitment to your partner cost you something real — time, money, pride, or another relationship. What did you actually do?',
false,
'{"christformed":"Honored the commitment fully, at real cost, without resentment or later mention of the cost as leverage","rooted":"Honored it, with the cost acknowledged but not used to extract credit","growing":"Honored it partially, or honored it while making the cost visibly known","awakening":"Found a technically-compliant workaround that reduced the real cost to be paid","unengaged":"Let the commitment slide once the cost became real"}'::jsonb,
NULL,
NULL, true),

('PM_CF_SC_02','covenant_faithfulness','premarital','scenario',206,
'Describe the last time you were tempted to quietly let a promise to your partner slide because keeping it had become inconvenient. What happened?',
false,
'{"christformed":"Noticed the temptation and kept the promise anyway, without my partner ever needing to notice the struggle","rooted":"Kept the promise, after a real but brief internal negotiation","growing":"Kept a reduced or delayed version of the promise","awakening":"Let it slide and offered an explanation when asked","unengaged":"Let it slide without ever circling back to it"}'::jsonb,
NULL,
NULL, true),

('PM_CF_RE_01','covenant_faithfulness','premarital','reflective_disclosure',207,
'What promise are you assuming you and your partner will keep after the wedding that the two of you have never actually said out loud? Be specific about what it is, and about why you have not said it.',
false,
'{"christformed":"Names a specific unspoken promise and a candid reason it has stayed unspoken","rooted":"Names a real unspoken promise with reasonable honesty about why","growing":"Names something, but stays general about the reason","awakening":"Offers a safe, expected example that costs nothing to say","unengaged":"Says everything has already been said, or avoids the question"}'::jsonb,
NULL,
NULL, true),

('PM_ON_FR_01','oneness','premarital','frequency',208,
'My partner and I function as a team making decisions together, rather than as two people who happen to live in the same house.',
false,
'{"christformed":"Decisions are reflexively joint; separateness is not the default posture","rooted":"Consistently collaborative with rare lapses into solo decisions","growing":"Collaborative on major decisions, parallel on most day-to-day ones","awakening":"Each largely runs their own life; joint decisions are the exception","unengaged":"Functionally two separate lives sharing an address"}'::jsonb,
NULL,
NULL, true),

('PM_ON_FR_02','oneness','premarital','frequency',209,
'I check in with my partner before committing us to something — time, money, a relationship — that affects us both.',
false,
'{"christformed":"Checking in first is automatic, not a discipline I have to remember","rooted":"Consistently checks in, with rare exceptions","growing":"Checks in for big things, often decides smaller shared things alone","awakening":"Frequently commits us to things and informs my partner afterward","unengaged":"Regularly makes shared commitments unilaterally"}'::jsonb,
NULL,
NULL, true),

('PM_ON_FR_03','oneness','premarital','frequency',210,
'I have successfully put appropriate distance between my parents''/family''s opinions and the decisions my partner and I make together.',
false,
'{"christformed":"Family opinion is welcomed as input; the decision is fully ours","rooted":"Generally independent, with occasional deference under pressure","growing":"Family opinion carries real, sometimes decisive weight","awakening":"Decisions are regularly shaped more by family than by my partner and me","unengaged":"Family opinion functionally overrides our own judgment"}'::jsonb,
NULL,
NULL, true),

('PM_ON_FR_04','oneness','premarital','frequency',211,
'I make decisions about our money, time, or home on my own and tell my partner afterward.',
true,
'{"christformed":"Decisions that affect both of us are always made together first","rooted":"I rarely decide alone, and I inform right away when I do","growing":"I decide smaller matters alone and bigger ones together","awakening":"I often decide first and inform afterward","unengaged":"Decisions are routinely made alone and announced"}'::jsonb,
NULL,
NULL, true),

('PM_ON_FR_05','oneness','premarital','frequency',212,
'When my partner and my family disagree, I find myself taking my family''s side.',
true,
'{"christformed":"Loyalty to the person I am closest to is clear and shown in practice","rooted":"I usually stand with that person, with an occasional pull toward family","growing":"I am torn, and sometimes default to my family''s view","awakening":"I often default to my family and explain it away","unengaged":"My family''s view regularly overrides that person''s"}'::jsonb,
NULL,
NULL, true),

('PM_ON_SC_01','oneness','premarital','scenario',213,
'Describe the last significant decision you made that affected your relationship. Did you make it with your partner, or around them?',
false,
'{"christformed":"Genuinely joint from the start — shaped together, not just approved by the other","rooted":"Made together with minor unilateral elements","growing":"Decided largely alone, then brought to my partner for buy-in","awakening":"Decided alone and informed my partner after the fact","unengaged":"Made and acted on without meaningfully involving my partner at all"}'::jsonb,
NULL,
NULL, true),

('PM_ON_SC_02','oneness','premarital','scenario',214,
'Describe the last time your family of origin — parents, siblings — disagreed with a decision you and your partner made together. What did you do?',
false,
'{"christformed":"Held the shared decision firmly while still honoring the family relationship","rooted":"Held the decision, with some visible effort against the family pressure","growing":"Held the decision formally, while privately second-guessing it under the pressure","awakening":"Quietly adjusted the decision to appease family, without renegotiating it with my partner","unengaged":"Let family opinion override the decision my partner and I had made together"}'::jsonb,
NULL,
NULL, true),

('PM_ON_RE_01','oneness','premarital','reflective_disclosure',215,
'Describe one area — money, time, extended family, children, or faith practice — where you and your partner currently make decisions separately. What would it cost you to make it joint?',
false,
'{"christformed":"Names a specific area and the real cost of changing it, including what they would have to give up","rooted":"Names an area and acknowledges some real cost","growing":"Names an area but frames the cost as only the other person''s","awakening":"Names something trivial, or the answer stays abstract","unengaged":"Claims there is no such area, implausibly, or avoids the question"}'::jsonb,
NULL,
NULL, true),

('PM_SL_FR_01','sacrificial_love','premarital','frequency',216,
'I make choices that cost me something real — time, comfort, money — for my partner''s good, without keeping score.',
false,
'{"christformed":"Cost is absorbed freely; no internal ledger is kept","rooted":"Gives sacrificially; occasionally aware of the cost but does not withhold","growing":"Gives, but tracks it and expects reciprocity, even if unspoken","awakening":"Sacrifice is rare and usually mentioned afterward","unengaged":"Giving is conditional on getting something back"}'::jsonb,
NULL,
NULL, true),

('PM_SL_FR_02','sacrificial_love','premarital','frequency',217,
'When my partner and I want different things, I am as willing to yield as I expect them to be.',
false,
'{"christformed":"Yields as readily as I would ask them to, without resentment","rooted":"Yields regularly, with occasional visible reluctance","growing":"Expects more yielding from my partner than I offer myself","awakening":"Rarely yields first; usually waits to be asked","unengaged":"Operates by a double standard — my preferences are the default"}'::jsonb,
NULL,
NULL, true),

('PM_SL_FR_03','sacrificial_love','premarital','frequency',218,
'I notice and respond to what my partner actually needs, not just what would be convenient for me to give.',
false,
'{"christformed":"Attunement to actual need is instinctive, ahead of convenience","rooted":"Notices and responds consistently, occasionally after a delay","growing":"Responds to needs that are stated plainly, misses the unstated ones","awakening":"Often responds to what is easiest to give rather than what is needed","unengaged":"Rarely notices what my partner actually needs"}'::jsonb,
NULL,
NULL, true),

('PM_SL_FR_04','sacrificial_love','premarital','frequency',219,
'I privately keep track of what I have done for my partner compared with what they have done for me.',
true,
'{"christformed":"No ledger is kept; giving is simply given","rooted":"A ledger occasionally forms and is let go quickly","growing":"A running tally exists in the background and sometimes surfaces","awakening":"The tally is kept actively and brought up in conflict","unengaged":"Giving is conditional on what comes back"}'::jsonb,
NULL,
NULL, true),

('PM_SL_FR_05','sacrificial_love','premarital','frequency',220,
'When I am tired or stressed, my partner''s needs feel like an interruption.',
true,
'{"christformed":"Their needs still get my attention when I have little left","rooted":"I usually respond, with some visible effort","growing":"I respond when rested and am short-tempered when depleted","awakening":"Needs are often met with irritation or delay","unengaged":"Needs are treated as an imposition"}'::jsonb,
NULL,
NULL, true),

('PM_SL_SC_01','sacrificial_love','premarital','scenario',221,
'Describe the last time you gave up something you wanted so your partner could have what they needed. What was it, and how did you feel about it afterward?',
false,
'{"christformed":"Gave freely; the giving itself, not the wanting, is what is remembered","rooted":"Gave genuinely; some cost was felt but did not curdle into resentment","growing":"Gave, but with noticeable reluctance or a mental note kept","awakening":"Gave only after visible hesitation or negotiation","unengaged":"Avoided giving it up, or gave it resentfully in a way that was felt by my partner"}'::jsonb,
NULL,
NULL, true),

('PM_SL_SC_02','sacrificial_love','premarital','scenario',222,
'Describe a recent disagreement about whose preference would win — where to spend an evening, how to spend money, how to spend a Saturday. What actually happened, and why?',
false,
'{"christformed":"Yielded or found genuine mutual ground, without treating it as a loss","rooted":"Yielded willingly, if not instantly","growing":"Negotiated a compromise that mostly favored me","awakening":"My preference won by default, without real negotiation","unengaged":"My preference wins as a matter of course, by habit rather than discussion"}'::jsonb,
NULL,
NULL, true),

('PM_SL_RE_01','sacrificial_love','premarital','reflective_disclosure',223,
'Name something you want out of marriage that you would struggle to give up if your partner needed you to. What does that tell you about what you are really willing to sacrifice?',
false,
'{"christformed":"Names a specific want and an honest, unflattering conclusion about what it shows","rooted":"Names a real want and draws a reasonably honest conclusion","growing":"Names a want but softens what it says about them","awakening":"Names something easy to give up, avoiding the real cost","unengaged":"Claims there is nothing they would struggle to give up, implausibly"}'::jsonb,
NULL,
NULL, true),

('PM_IN_FR_01','intimacy','premarital','frequency',224,
'My partner and I talk honestly about physical boundaries and expectations — what we each want, fear, and hope for — rather than leaving it unspoken.',
false,
'{"christformed":"These conversations happen openly and often, with real specifics","rooted":"They happen regularly, with some awkwardness","growing":"They have happened once or twice, in general terms","awakening":"They are avoided, with assumptions standing in","unengaged":"They have never happened"}'::jsonb,
NULL,
NULL, true),

('PM_IN_FR_02','intimacy','premarital','frequency',225,
'I am emotionally present with my partner — attentive, undistracted — in the ordinary moments of a day, not just the significant ones.',
false,
'{"christformed":"Ordinary moments reliably get full attention, not divided attention","rooted":"Usually present; phone or distraction occasionally wins","growing":"Present for planned or significant moments, distracted in the ordinary ones","awakening":"Physically present but attention is usually elsewhere","unengaged":"Ordinary time together is routinely parallel, not shared"}'::jsonb,
NULL,
NULL, true),

('PM_IN_FR_03','intimacy','premarital','frequency',226,
'I initiate emotional closeness with my partner rather than always waiting for them to initiate.',
false,
'{"christformed":"I initiate freely and often, without anxiety about rejection","rooted":"I initiate regularly","growing":"I initiate occasionally and often wait to be approached","awakening":"I rarely initiate; closeness mostly depends on my partner","unengaged":"I have effectively stopped initiating closeness"}'::jsonb,
NULL,
NULL, true),

('PM_IN_FR_04','intimacy','premarital','frequency',227,
'There are fears or failures I would rather my partner never found out about.',
true,
'{"christformed":"Nothing significant is kept hidden out of fear","rooted":"A few things are still private, and I am working toward sharing them","growing":"Several significant things are kept hidden to stay safe","awakening":"Much of my inner life is hidden on purpose","unengaged":"Most of what is real stays hidden"}'::jsonb,
NULL,
NULL, true),

('PM_IN_FR_05','intimacy','premarital','frequency',228,
'When my partner tries to talk about something vulnerable, I change the subject or find something else to do.',
true,
'{"christformed":"I stay present and curious when someone opens up","rooted":"I usually stay present and occasionally deflect","growing":"I stay present for lighter things and deflect when it gets heavy","awakening":"I often deflect, or try to fix instead of listening","unengaged":"I routinely avoid vulnerable conversations"}'::jsonb,
NULL,
NULL, true),

('PM_IN_SC_01','intimacy','premarital','scenario',229,
'Describe the last time you and your partner talked about physical boundaries, desire, or what you each expect physically in marriage. Did you say what you actually felt, or let it pass?',
false,
'{"christformed":"Named what they actually felt and expected, specifically and without deflecting","rooted":"Named it, even if awkwardly or late","growing":"Touched on it in general terms without saying what they felt","awakening":"Let it pass to avoid discomfort","unengaged":"The subject has not been discussed and there is no intention to"}'::jsonb,
NULL,
NULL, true),

('PM_IN_SC_02','intimacy','premarital','scenario',230,
'Describe the last time your partner tried to get emotionally close to you — shared something vulnerable, asked how you really are — and you pulled back or deflected. What happened?',
false,
'{"christformed":"Cannot identify a recent instance — vulnerability is reliably met, not deflected","rooted":"Identifies a minor, brief instance, quickly corrected","growing":"Identifies a real instance of deflection, with some awareness of doing it","awakening":"Identifies a pattern of deflection, described somewhat defensively","unengaged":"Describes consistently shutting down or deflecting vulnerability, without much reflection on it"}'::jsonb,
NULL,
NULL, true),

('PM_IN_RE_01','intimacy','premarital','reflective_disclosure',231,
'Describe where you and your partner are not yet fully known to each other, emotionally or in your history. What have you not told them, and what are you afraid would happen if you did?',
false,
'{"christformed":"Names a specific thing not yet shared and the real fear behind it, without deflecting","rooted":"Names a real area of unknownness with reasonable specificity","growing":"Acknowledges some distance but stays vague about what or why","awakening":"Gestures at the question without really answering it","unengaged":"Claims there is nothing unshared, implausibly, or avoids the question"}'::jsonb,
NULL,
NULL, true),

('PM_TC_FR_01','truthful_communication','premarital','frequency',232,
'What I tell my partner matches what I actually think and feel, even when the truth is uncomfortable.',
false,
'{"christformed":"Says the true thing even at real relational cost, as a matter of course","rooted":"Generally transparent; manages delivery more than content","growing":"Often softens or withholds when the truth would cause friction","awakening":"Frequently tells a version calibrated to avoid conflict","unengaged":"What is said and what is actually true have diverged into habit"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["PM_TC_SC_01"],"flag_level":"significant"}'::jsonb,
'["PM_TC_SC_01"]'::jsonb, true),

('PM_TC_FR_02','truthful_communication','premarital','frequency',233,
'I bring up problems in our relationship directly with my partner rather than venting to someone else first.',
false,
'{"unengaged":"Problems consistently go to others before they ever reach my partner","awakening":"Often processed elsewhere first, raised with my partner later if at all","growing":"Sometimes vents first, usually brings it to my partner eventually","rooted":"Nearly always goes to my partner first","christformed":"My partner is reliably the first and primary person I bring a problem to"}'::jsonb,
NULL,
NULL, true),

('PM_TC_FR_03','truthful_communication','premarital','frequency',234,
'I am as honest with my partner about my own failures as I am quick to notice theirs.',
false,
'{"christformed":"Names my own failures as readily and specifically as I notice my partner''s","rooted":"Generally forthcoming about my own failures","growing":"Notices my partner''s failures more readily than I disclose my own","awakening":"Rarely volunteers my own failures unless confronted","unengaged":"A clear double standard — quick to see theirs, slow to name mine"}'::jsonb,
NULL,
NULL, true),

('PM_TC_FR_04','truthful_communication','premarital','frequency',235,
'I tell my partner a softened or partial version of the truth to avoid an argument.',
true,
'{"christformed":"What I say is whole and true, even when it costs me","rooted":"I rarely soften the truth, and correct it when I do","growing":"I soften the truth when the topic is sensitive","awakening":"I often give partial versions to keep the peace","unengaged":"I routinely edit the truth to avoid friction"}'::jsonb,
NULL,
NULL, true),

('PM_TC_FR_05','truthful_communication','premarital','frequency',236,
'I answer questions with something technically true that leaves out what my partner really wanted to know.',
true,
'{"christformed":"I answer the question that was actually asked","rooted":"I rarely dodge, and notice when I do","growing":"I sometimes answer narrowly to avoid a harder conversation","awakening":"I often answer the letter of the question and not its point","unengaged":"I habitually answer around what was really asked"}'::jsonb,
NULL,
NULL, true),

('PM_TC_SC_01','truthful_communication','premarital','scenario',237,
'Describe the last time you did not tell your partner something true because it would have caused friction. What was it, and what did you tell yourself about why that was okay?',
false,
'{"christformed":"Told the truth anyway, trusting the friction over the silence","rooted":"Told it, though delayed or carefully timed","growing":"Withheld it temporarily, with a genuine intention to disclose later","awakening":"Withheld it and constructed a reasonable-sounding justification for staying quiet","unengaged":"Withheld it and has no real intention of ever disclosing it"}'::jsonb,
NULL,
NULL, true),

('PM_TC_SC_02','truthful_communication','premarital','scenario',238,
'Describe the last time your partner asked you a direct question you did not want to answer honestly. What did you actually say?',
false,
'{"christformed":"Answered fully and honestly despite not wanting to","rooted":"Answered honestly, after a visible pause or difficulty","growing":"Gave a technically true but incomplete answer","awakening":"Deflected the question without directly lying","unengaged":"Gave an answer that was not true"}'::jsonb,
NULL,
NULL, true),

('PM_TC_RE_01','truthful_communication','premarital','reflective_disclosure',239,
'Name one true thing about how you feel about the marriage ahead, or about your partner, that you have not said to them. You do not have to resolve it here — just name it honestly.',
false,
'{"christformed":"Names a real, specific feeling without minimizing it or explaining it away","rooted":"Names a real feeling with some hedging","growing":"Names something safe and general","awakening":"Names something trivial in place of what is actually true","unengaged":"Claims there is nothing unsaid, or does not answer"}'::jsonb,
NULL,
NULL, true),

('PM_CR_FR_01','conflict_repair','premarital','frequency',240,
'After my partner and I argue, we actually resolve it — not just stop talking about it.',
false,
'{"christformed":"Conflicts reliably end in genuine repair, not just a ceasefire","rooted":"Usually resolves fully, occasionally lingers briefly","growing":"Often settles into an unspoken truce rather than resolution","awakening":"Conflicts mostly fade without being addressed","unengaged":"Unresolved conflict is the normal end state"}'::jsonb,
NULL,
NULL, true),

('PM_CR_FR_02','conflict_repair','premarital','frequency',241,
'I am the one who initiates repair after a conflict at least as often as my partner is.',
false,
'{"christformed":"Initiates repair readily, with no concern for who ''should'' go first","rooted":"Initiates often, slight preference for my partner to go first","growing":"Usually waits for my partner to make the first move","awakening":"Rarely initiates repair myself","unengaged":"Repair, when it happens, is never initiated by me"}'::jsonb,
NULL,
NULL, true),

('PM_CR_FR_03','conflict_repair','premarital','frequency',242,
'When I am wrong in an argument, I say so plainly, without qualifying it into half an apology.',
false,
'{"christformed":"Says ''I was wrong'' plainly, with no qualification or counter-complaint attached","rooted":"Admits fault clearly, occasionally with minor hedging","growing":"Admits fault but usually pairs it with an explanation that softens it","awakening":"Apologies are frequently conditional (''I''m sorry, but...'')","unengaged":"Rarely admits fault plainly, if at all"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["PM_CR_SC_02"],"flag_level":"minor"}'::jsonb,
'["PM_CR_SC_02"]'::jsonb, true),

('PM_CR_FR_04','conflict_repair','premarital','frequency',243,
'After a fight I go quiet and let time do the repairing, instead of dealing with it.',
true,
'{"christformed":"I come back to it and deal with it, and do not leave it to time","rooted":"I usually return to it, sometimes after too long","growing":"I often wait it out and return only if the other person does","awakening":"I usually let silence close it","unengaged":"Time and distance are the only repair"}'::jsonb,
NULL,
NULL, true),

('PM_CR_FR_05','conflict_repair','premarital','frequency',244,
'When we argue, I bring up my partner''s old failures to make my point.',
true,
'{"christformed":"I stay with the issue at hand and leave old failures alone","rooted":"I rarely bring up the past, and apologize when I do","growing":"I bring up past failures when I feel cornered","awakening":"Old failures are a regular part of how I argue","unengaged":"The past is used as a weapon in most arguments"}'::jsonb,
NULL,
NULL, true),

('PM_CR_SC_01','conflict_repair','premarital','scenario',245,
'Describe your last real argument with your partner in detail — how it started, what each of you did, and how, or whether, it actually ended.',
false,
'{"christformed":"Both the conflict and the repair are described specifically, with real ownership of my own part in both","rooted":"Describes a real conflict that reached genuine resolution, with minor loose ends","growing":"Describes a conflict that ended in a truce rather than real resolution","awakening":"Describes a conflict that simply faded without being addressed","unengaged":"Describes a conflict that is still actively unresolved, named as such"}'::jsonb,
NULL,
NULL, true),

('PM_CR_SC_02','conflict_repair','premarital','scenario',246,
'Describe the last time you were clearly in the wrong in a conflict with your partner. What did you actually say to them afterward?',
false,
'{"christformed":"Named the fault plainly and specifically, with no attached justification","rooted":"Apologized clearly, with only minor softening","growing":"Apologized, but paired it with an explanation that shifted some blame","awakening":"Offered a vague or partial apology (''sorry about earlier'') without naming the fault","unengaged":"Did not apologize, or framed myself as equally or more wronged"}'::jsonb,
NULL,
NULL, true),

('PM_CR_RE_01','conflict_repair','premarital','reflective_disclosure',247,
'Think of your most unresolved disagreement with your partner so far. Describe it honestly, including what you suspect it is really about underneath.',
false,
'{"christformed":"Describes it specifically, owns their part, and names the deeper issue","rooted":"Describes it honestly and names a plausible deeper issue","growing":"Describes the surface disagreement only","awakening":"Describes it mostly as the other person''s issue","unengaged":"Claims there is no unresolved disagreement, or avoids the question"}'::jsonb,
NULL,
NULL, true),

('PM_MH_FR_01','mutual_honor','premarital','frequency',248,
'I speak to my partner, even in frustration, in a tone I would be comfortable with someone else overhearing.',
false,
'{"christformed":"Tone holds under frustration without effort or self-monitoring","rooted":"Holds with occasional, quickly-caught lapses","growing":"Frustration regularly produces a tone that would embarrass if overheard","awakening":"Contempt or condescension surfaces often under pressure","unengaged":"Harsh or demeaning tone is the normal mode of frustration"}'::jsonb,
NULL,
NULL, true),

('PM_MH_FR_02','mutual_honor','premarital','frequency',249,
'I actively make room for my partner''s voice in decisions, rather than deciding and informing them.',
false,
'{"christformed":"My partner''s voice shapes the decision itself, not just its delivery","rooted":"Consistently makes room, with occasional lapses under time pressure","growing":"Makes room for big decisions, decides smaller ones alone by default","awakening":"Often decides first and frames it as a discussion afterward","unengaged":"Decisions are made and announced"}'::jsonb,
NULL,
NULL, true),

('PM_MH_FR_03','mutual_honor','premarital','frequency',250,
'I show my partner respect in front of others — family, friends — even when I am annoyed with them.',
false,
'{"christformed":"Respect in public holds completely regardless of private annoyance","rooted":"Holds consistently, with rare visible slips","growing":"Mostly holds, but irritation occasionally leaks out publicly","awakening":"Annoyance regularly becomes visible to others","unengaged":"My partner is regularly diminished or corrected in front of others"}'::jsonb,
NULL,
NULL, true),

('PM_MH_FR_04','mutual_honor','premarital','frequency',251,
'When I am frustrated, I roll my eyes, sigh, or make a joke at my partner''s expense.',
true,
'{"christformed":"Frustration comes out as honest words, never contempt","rooted":"Contempt rarely shows, and I apologize when it does","growing":"Contempt shows under real pressure","awakening":"Sarcasm and eye-rolling are a regular habit","unengaged":"Contempt is a routine part of how I show frustration"}'::jsonb,
NULL,
NULL, true),

('PM_MH_FR_05','mutual_honor','premarital','frequency',252,
'I make important decisions as if my partner''s opinion counts for less than mine.',
true,
'{"christformed":"Their view carries real weight, and it has changed my decisions","rooted":"Their view usually weighs equally with mine","growing":"I listen, but mine tends to win when it matters","awakening":"I often treat their view as secondary","unengaged":"Their view rarely changes anything"}'::jsonb,
NULL,
NULL, true),

('PM_MH_SC_01','mutual_honor','premarital','scenario',253,
'Describe the last time you were genuinely frustrated with your partner in front of other people. What did you actually do or say?',
false,
'{"christformed":"Held the frustration privately and addressed it with my partner directly, later and alone","rooted":"Mostly held it, with a small visible sign of frustration quickly managed","growing":"Let the frustration show in tone or expression, though said nothing explicit","awakening":"Made a pointed comment or correction in front of others","unengaged":"Openly criticized or embarrassed my partner in front of others"}'::jsonb,
NULL,
NULL, true),

('PM_MH_SC_02','mutual_honor','premarital','scenario',254,
'Describe the last decision where you had more practical power than your partner — financially, socially, or otherwise. Did you use that power to decide for both of you, or with them?',
false,
'{"christformed":"Actively used the power imbalance to make space for my partner''s voice, not less of it","rooted":"Decided together despite having more leverage","growing":"Decided mostly alone but checked in out of courtesy","awakening":"Used the power to decide, then presented it to my partner as settled","unengaged":"The power imbalance was used to simply override my partner''s preference"}'::jsonb,
NULL,
NULL, true),

('PM_MH_RE_01','mutual_honor','premarital','reflective_disclosure',255,
'Describe something about your partner that you privately hope will change after the wedding. What do you do with that hope now?',
false,
'{"christformed":"Names it specifically, recognizes it as a risk to honor, and says what they do about it","rooted":"Names a real hope and acknowledges the risk of holding it","growing":"Names a hope but treats it as harmless","awakening":"Names something minor, avoiding the real one","unengaged":"Claims there is nothing they hope will change, implausibly"}'::jsonb,
NULL,
NULL, true),

('PM_SV_FR_01','shared_vision','premarital','frequency',256,
'My partner and I make financial decisions together, with full visibility into our finances for both of us.',
false,
'{"christformed":"Full mutual visibility and joint decision-making is simply how finances work","rooted":"Generally joint and visible, with minor individual discretion","growing":"Major decisions are joint; day-to-day spending is often not visible to the other","awakening":"One partner manages finances with limited visibility for the other","unengaged":"Finances are substantially separate or hidden"}'::jsonb,
NULL,
NULL, true),

('PM_SV_FR_02','shared_vision','premarital','frequency',257,
'My partner and I are working toward a shared vision for our life together, not just managing day-to-day logistics.',
false,
'{"christformed":"A shared, named vision actively shapes our daily decisions","rooted":"A shared vision exists and gets revisited regularly","growing":"A shared vision exists in general terms but rarely gets concrete attention","awakening":"Life together is mostly logistics; the bigger picture is assumed, not discussed","unengaged":"No shared vision has ever really been articulated"}'::jsonb,
NULL,
NULL, true),

('PM_SV_FR_03','shared_vision','premarital','frequency',258,
'I keep no secrets from my partner about money, debt, or spending.',
false,
'{"christformed":"Full financial transparency, as a matter of course, not discipline","rooted":"Transparent, with everything eventually disclosed","growing":"Mostly transparent but some spending goes unmentioned","awakening":"Specific debts or spending are being actively kept from my partner","unengaged":"Significant financial secrecy is present"}'::jsonb,
NULL,
NULL, true),

('PM_SV_FR_04','shared_vision','premarital','frequency',259,
'My partner and I want different things for our future, and we avoid talking about it.',
true,
'{"christformed":"Differences about the future are named and worked through","rooted":"Differences are known and being discussed","growing":"Differences are sensed but mostly left unspoken","awakening":"Differences are avoided because the subject feels risky","unengaged":"The future is not discussed at all"}'::jsonb,
NULL,
NULL, true),

('PM_SV_FR_05','shared_vision','premarital','frequency',260,
'I assume my partner agrees with my plans for our future without having asked them.',
true,
'{"christformed":"Plans that affect others are made with them, not for them","rooted":"I usually check first, with an occasional assumption","growing":"I assume agreement on things that feel obvious to me","awakening":"I often build plans first and inform afterward","unengaged":"Plans are made alone and assumed to be shared"}'::jsonb,
NULL,
NULL, true),

('PM_SV_SC_01','shared_vision','premarital','scenario',261,
'Describe the last significant purchase or financial decision you made. Did your partner know about it before it happened?',
false,
'{"christformed":"Discussed and decided together before any money moved","rooted":"Mentioned it beforehand, even if the final call was made quickly","growing":"Decided largely alone, informed my partner close to or after the fact","awakening":"My partner learned about it only once it was already done","unengaged":"My partner still does not fully know about it"}'::jsonb,
NULL,
NULL, true),

('PM_SV_SC_02','shared_vision','premarital','scenario',262,
'Describe the last conversation you and your partner had about where your life together is actually headed, five to ten years out. When was it, and what came of it?',
false,
'{"christformed":"A recent, substantive conversation with real shared direction that is actively shaping current decisions","rooted":"A real conversation happened reasonably recently, with some follow-through","growing":"A vague or long-ago conversation that has not really been revisited","awakening":"Cannot recall a real conversation like this, only logistics-level talk","unengaged":"No such conversation has meaningfully happened"}'::jsonb,
NULL,
NULL, true),

('PM_SV_RE_01','shared_vision','premarital','reflective_disclosure',263,
'Describe the biggest difference between what you picture for your life in ten years and what you think your partner pictures. How do you know, and how sure are you?',
false,
'{"christformed":"Names a specific difference, how they know it, and honest uncertainty about it","rooted":"Names a plausible difference with a reasonable basis","growing":"Names a difference but admits they have mostly assumed","awakening":"Stays vague about the difference","unengaged":"Claims there is no difference, or has never checked"}'::jsonb,
NULL,
NULL, true),

('PM_X_FR_01','cross_pillar','premarital','frequency',264,
'Overall, I would say my partner and I are growing closer to each other over time, not drifting apart.',
false,
'{"christformed":"Closeness is visibly, consistently increasing","rooted":"Generally growing closer, with normal seasonal dips","growing":"Mixed — some closeness, some drift, roughly balanced","awakening":"More drift than closeness lately","unengaged":"Clearly drifting apart"}'::jsonb,
NULL,
NULL, true),

('PM_X_RE_01','cross_pillar','premarital','reflective_disclosure',265,
'If your partner answered every question in this assessment honestly, where do you expect the biggest difference between your answers and theirs would be — and why do you think that gap exists?',
false,
'{"christformed":"Names a specific, plausible pillar and gives a genuinely self-critical account of why the gap exists","rooted":"Names a plausible pillar with a reasonably honest account of the likely gap","growing":"Names a pillar but the explanation leans toward explaining it away","awakening":"Stays vague about which pillar, or offers a surface-level guess","unengaged":"Claims no real gap would exist, implausibly"}'::jsonb,
NULL,
NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Re-number sequence_order for the whole premarital track so the new questions are interleaved
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
  FROM questions WHERE track = 'premarital'
)
UPDATE questions q SET sequence_order = ranked.rn FROM ranked WHERE q.id = ranked.id;
