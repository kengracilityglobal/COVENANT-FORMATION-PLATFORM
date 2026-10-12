-- supabase/migrations/003_questions_seed_married.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- THE COVENANT FORMATION QUESTION BANK — MARRIED TRACK — 50 QUESTIONS
--
-- Deliberately smaller than EIKON's 100-question bank (a ~20-25 minute
-- instrument, not 60-90) so v1 ships with real, complete content across
-- all eight pillars rather than a thin, half-written 100. See
-- docs/VERIFICATION.md for the honest scope note on this.
--
-- The PREMARITAL track (forward-looking "what have you not yet discussed"
-- framing) is seeded separately in 009_questions_seed_premarital.sql.
-- Migration 007 adds 16 more rated questions to this bank (and corrects
-- the scoring direction of TC_FR_02 on databases seeded before the fix).
--
-- Distribution per pillar (x8 pillars):
--   3 frequency + 2 scenario + 1 reflective_disclosure = 6
-- Plus 2 cross-pillar questions (1 frequency + 1 reflective) = 50 total.
--
-- Sequence ordering (same interleave pattern as EIKON):
--   1–24   Frequency, 3 rounds x 8 pillars
--   25     Cross-pillar frequency
--   26–41  Scenario, 2 rounds x 8 pillars
--   42–49  Reflective, 1 round x 8 pillars
--   50     Cross-pillar reflective (final synthesis — probes the
--          participant's own awareness of the perception gap)
--
-- Questions are written in the MARRIED framing: lived history
-- ("describe the last time..."), not hypothetical readiness.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM responses WHERE question_id IN (SELECT id FROM questions WHERE track = 'married');
DELETE FROM questions WHERE track = 'married';

INSERT INTO questions (
  code, pillar, track, question_type, sequence_order,
  question_text, scale_reversed, scoring_rubric,
  integrity_flag_logic, cross_ref_questions, active
) VALUES

-- ═══════════════════════════════════════════════════════════
-- FREQUENCY — Round 1 (positions 1–8)
-- ═══════════════════════════════════════════════════════════

('CF_FR_01','covenant_faithfulness','married','frequency',1,
'When keeping a promise to my spouse becomes inconvenient, I keep it anyway.',
false,
'{"christformed":"Inconvenience never enters the decision; the promise simply holds","rooted":"Keeps it consistently, with occasional visible effort","growing":"Keeps most promises but some quietly slide when the cost is real","awakening":"Inconvenient promises are often renegotiated after the fact rather than kept","unengaged":"Promises are treated as conditional on convenience"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["CF_SC_02"],"flag_level":"significant"}'::jsonb,
'["CF_SC_02"]'::jsonb, true),

('ON_FR_01','oneness','married','frequency',2,
'My spouse and I function as a team making decisions together, rather than as two people who happen to live in the same house.',
false,
'{"christformed":"Decisions are reflexively joint; separateness is not the default posture","rooted":"Consistently collaborative with rare lapses into solo decisions","growing":"Collaborative on major decisions, parallel on most day-to-day ones","awakening":"Each largely runs their own life; joint decisions are the exception","unengaged":"Functionally two separate lives sharing an address"}'::jsonb,
NULL, NULL, true),

('SL_FR_01','sacrificial_love','married','frequency',3,
'I make choices that cost me something real — time, comfort, money — for my spouse''s good, without keeping score.',
false,
'{"christformed":"Cost is absorbed freely; no internal ledger is kept","rooted":"Gives sacrificially; occasionally aware of the cost but does not withhold","growing":"Gives, but tracks it and expects reciprocity, even if unspoken","awakening":"Sacrifice is rare and usually mentioned afterward","unengaged":"Giving is conditional on getting something back"}'::jsonb,
NULL, NULL, true),

('IN_FR_01','intimacy','married','frequency',4,
'My spouse and I talk honestly about our physical relationship — not just whether something happened, but how it actually felt — rather than letting it go unspoken.',
false,
'{"christformed":"Physical intimacy is a regular, comfortable subject of honest conversation","rooted":"Talked about, though not always easily","growing":"Mentioned occasionally, mostly in passing or when there is a problem","awakening":"Essentially never discussed directly","unengaged":"The subject is actively avoided by one or both"}'::jsonb,
NULL, NULL, true),

('TC_FR_01','truthful_communication','married','frequency',5,
'What I tell my spouse matches what I actually think and feel, even when the truth is uncomfortable.',
false,
'{"christformed":"Says the true thing even at real relational cost, as a matter of course","rooted":"Generally transparent; manages delivery more than content","growing":"Often softens or withholds when the truth would cause friction","awakening":"Frequently tells a version calibrated to avoid conflict","unengaged":"What is said and what is actually true have diverged into habit"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["TC_SC_01"],"flag_level":"significant"}'::jsonb,
'["TC_SC_01"]'::jsonb, true),

('CR_FR_01','conflict_repair','married','frequency',6,
'After my spouse and I argue, we actually resolve it — not just stop talking about it.',
false,
'{"christformed":"Conflicts reliably end in genuine repair, not just a ceasefire","rooted":"Usually resolves fully, occasionally lingers briefly","growing":"Often settles into an unspoken truce rather than resolution","awakening":"Conflicts mostly fade without being addressed","unengaged":"Unresolved conflict is the normal end state"}'::jsonb,
NULL, NULL, true),

('MH_FR_01','mutual_honor','married','frequency',7,
'I speak to my spouse, even in frustration, in a tone I would be comfortable with someone else overhearing.',
false,
'{"christformed":"Tone holds under frustration without effort or self-monitoring","rooted":"Holds with occasional, quickly-caught lapses","growing":"Frustration regularly produces a tone that would embarrass if overheard","awakening":"Contempt or condescension surfaces often under pressure","unengaged":"Harsh or demeaning tone is the normal mode of frustration"}'::jsonb,
NULL, NULL, true),

('SV_FR_01','shared_vision','married','frequency',8,
'My spouse and I make financial decisions together, with full visibility into our finances for both of us.',
false,
'{"christformed":"Full mutual visibility and joint decision-making is simply how finances work","rooted":"Generally joint and visible, with minor individual discretion","growing":"Major decisions are joint; day-to-day spending is often not visible to the other","awakening":"One partner manages finances with limited visibility for the other","unengaged":"Finances are substantially separate or hidden"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- FREQUENCY — Round 2 (positions 9–16)
-- ═══════════════════════════════════════════════════════════

('CF_FR_02','covenant_faithfulness','married','frequency',9,
'I speak about my spouse to others the same way whether or not they are in the room.',
false,
'{"christformed":"No distinction between what is said with or without my spouse present","rooted":"Generally consistent; rare lapses quickly regretted","growing":"Mostly consistent but complains more freely when my spouse is absent","awakening":"Notable gap between how I speak about my spouse to others versus to them","unengaged":"Habitually critical of my spouse to others in ways I would not say to their face"}'::jsonb,
NULL, NULL, true),

('ON_FR_02','oneness','married','frequency',10,
'I check in with my spouse before committing us to something — time, money, a relationship — that affects us both.',
false,
'{"christformed":"Checking in first is automatic, not a discipline I have to remember","rooted":"Consistently checks in, with rare exceptions","growing":"Checks in for big things, often decides smaller shared things alone","awakening":"Frequently commits us to things and informs my spouse afterward","unengaged":"Regularly makes shared commitments unilaterally"}'::jsonb,
NULL, NULL, true),

('SL_FR_02','sacrificial_love','married','frequency',11,
'When my spouse and I want different things, I am as willing to yield as I expect them to be.',
false,
'{"christformed":"Yields as readily as I would ask them to, without resentment","rooted":"Yields regularly, with occasional visible reluctance","growing":"Expects more yielding from my spouse than I offer myself","awakening":"Rarely yields first; usually waits to be asked","unengaged":"Operates by a double standard — my preferences are the default"}'::jsonb,
NULL, NULL, true),

('IN_FR_02','intimacy','married','frequency',12,
'I am emotionally present with my spouse — attentive, undistracted — in the ordinary moments of a day, not just the significant ones.',
false,
'{"christformed":"Ordinary moments reliably get full attention, not divided attention","rooted":"Usually present; phone or distraction occasionally wins","growing":"Present for planned or significant moments, distracted in the ordinary ones","awakening":"Physically present but attention is usually elsewhere","unengaged":"Ordinary time together is routinely parallel, not shared"}'::jsonb,
NULL, NULL, true),

('TC_FR_02','truthful_communication','married','frequency',13,
'I bring up problems in our marriage directly with my spouse rather than venting to someone else first.',
false,
'{"unengaged":"Problems consistently go to others before they ever reach my spouse","awakening":"Often processed elsewhere first, raised with my spouse later if at all","growing":"Sometimes vents first, usually brings it to my spouse eventually","rooted":"Nearly always goes to my spouse first","christformed":"My spouse is reliably the first and primary person I bring a problem to"}'::jsonb,
NULL, NULL, true),

('CR_FR_02','conflict_repair','married','frequency',14,
'I am the one who initiates repair after a conflict at least as often as my spouse is.',
false,
'{"christformed":"Initiates repair readily, with no concern for who ''should'' go first","rooted":"Initiates often, slight preference for my spouse to go first","growing":"Usually waits for my spouse to make the first move","awakening":"Rarely initiates repair myself","unengaged":"Repair, when it happens, is never initiated by me"}'::jsonb,
NULL, NULL, true),

('MH_FR_02','mutual_honor','married','frequency',15,
'I actively make room for my spouse''s voice in decisions, rather than deciding and informing them.',
false,
'{"christformed":"My spouse''s voice shapes the decision itself, not just its delivery","rooted":"Consistently makes room, with occasional lapses under time pressure","growing":"Makes room for big decisions, decides smaller ones alone by default","awakening":"Often decides first and frames it as a discussion afterward","unengaged":"Decisions are made and announced"}'::jsonb,
NULL, NULL, true),

('SV_FR_02','shared_vision','married','frequency',16,
'My spouse and I are working toward a shared vision for our life together, not just managing day-to-day logistics.',
false,
'{"christformed":"A shared, named vision actively shapes our daily decisions","rooted":"A shared vision exists and gets revisited regularly","growing":"A shared vision exists in general terms but rarely gets concrete attention","awakening":"Life together is mostly logistics; the bigger picture is assumed, not discussed","unengaged":"No shared vision has ever really been articulated"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- FREQUENCY — Round 3 (positions 17–24)
-- ═══════════════════════════════════════════════════════════

('CF_FR_03','covenant_faithfulness','married','frequency',17,
'When our marriage is difficult, my commitment to stay and work on it does not waver.',
false,
'{"christformed":"Difficulty does not touch the commitment at all; the question of staying does not arise","rooted":"Commitment holds firmly, even if the difficulty is genuinely felt","growing":"Commitment holds but the thought of leaving surfaces under real strain","awakening":"Difficulty regularly produces real doubt about staying","unengaged":"Commitment feels conditional on the marriage being easy"}'::jsonb,
NULL, NULL, true),

('ON_FR_03','oneness','married','frequency',18,
'I have successfully put appropriate distance between my parents''/family''s opinions and the decisions my spouse and I make together.',
false,
'{"christformed":"Family opinion is welcomed as input; the decision is fully ours","rooted":"Generally independent, with occasional deference under pressure","growing":"Family opinion carries real, sometimes decisive weight","awakening":"Decisions are regularly shaped more by family than by my spouse and me","unengaged":"Family opinion functionally overrides our own judgment"}'::jsonb,
NULL, NULL, true),

('SL_FR_03','sacrificial_love','married','frequency',19,
'I notice and respond to what my spouse actually needs, not just what would be convenient for me to give.',
false,
'{"christformed":"Attunement to actual need is instinctive, ahead of convenience","rooted":"Notices and responds consistently, occasionally after a delay","growing":"Responds to needs that are stated plainly, misses the unstated ones","awakening":"Often responds to what is easiest to give rather than what is needed","unengaged":"Rarely notices what my spouse actually needs"}'::jsonb,
NULL, NULL, true),

('IN_FR_03','intimacy','married','frequency',20,
'I initiate closeness — physical or emotional — with my spouse rather than always waiting for them to initiate.',
false,
'{"christformed":"Initiates freely and often, without anxiety about rejection","rooted":"Initiates regularly","growing":"Initiates occasionally, often waits to be approached","awakening":"Rarely initiates; closeness mostly depends on my spouse","unengaged":"Has effectively stopped initiating closeness"}'::jsonb,
NULL, NULL, true),

('TC_FR_03','truthful_communication','married','frequency',21,
'I am as honest with my spouse about my own failures as I am quick to notice theirs.',
false,
'{"christformed":"Names my own failures as readily and specifically as I notice my spouse''s","rooted":"Generally forthcoming about my own failures","growing":"Notices my spouse''s failures more readily than I disclose my own","awakening":"Rarely volunteers my own failures unless confronted","unengaged":"A clear double standard — quick to see theirs, slow to name mine"}'::jsonb,
NULL, NULL, true),

('CR_FR_03','conflict_repair','married','frequency',22,
'When I am wrong in an argument, I say so plainly, without qualifying it into half an apology.',
false,
'{"christformed":"Says ''I was wrong'' plainly, with no qualification or counter-complaint attached","rooted":"Admits fault clearly, occasionally with minor hedging","growing":"Admits fault but usually pairs it with an explanation that softens it","awakening":"Apologies are frequently conditional (''I''m sorry, but...'')","unengaged":"Rarely admits fault plainly, if at all"}'::jsonb,
'{"condition":"frequency_high_scenario_low","cross_ref":["CR_SC_02"],"flag_level":"minor"}'::jsonb,
'["CR_SC_02"]'::jsonb, true),

('MH_FR_03','mutual_honor','married','frequency',23,
'I show my spouse respect in front of others — family, friends, our children — even when I am annoyed with them.',
false,
'{"christformed":"Respect in public holds completely regardless of private annoyance","rooted":"Holds consistently, with rare visible slips","growing":"Mostly holds, but irritation occasionally leaks out publicly","awakening":"Annoyance regularly becomes visible to others","unengaged":"My spouse is regularly diminished or corrected in front of others"}'::jsonb,
NULL, NULL, true),

('SV_FR_03','shared_vision','married','frequency',24,
'I keep no secrets from my spouse about money, debt, or spending.',
false,
'{"christformed":"Full financial transparency, as a matter of course, not discipline","rooted":"Transparent, with everything eventually disclosed","growing":"Mostly transparent but some spending goes unmentioned","awakening":"Specific debts or spending are being actively kept from my spouse","unengaged":"Significant financial secrecy is present"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- CROSS-PILLAR FREQUENCY (position 25)
-- ═══════════════════════════════════════════════════════════

('X_FR_01','cross_pillar','married','frequency',25,
'Overall, I would say my spouse and I are growing closer to each other over time, not drifting apart.',
false,
'{"christformed":"Closeness is visibly, consistently increasing","rooted":"Generally growing closer, with normal seasonal dips","growing":"Mixed — some closeness, some drift, roughly balanced","awakening":"More drift than closeness lately","unengaged":"Clearly drifting apart"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- SCENARIO — Round 1 (positions 26–33)
-- ═══════════════════════════════════════════════════════════

('CF_SC_01','covenant_faithfulness','married','scenario',26,
'Describe a recent situation where honoring a commitment to your spouse cost you something real — time, money, pride, or another relationship. What did you actually do?',
false,
'{"christformed":"Honored the commitment fully, at real cost, without resentment or later mention of the cost as leverage","rooted":"Honored it, with the cost acknowledged but not used to extract credit","growing":"Honored it partially, or honored it while making the cost visibly known","awakening":"Found a technically-compliant workaround that reduced the real cost to be paid","unengaged":"Let the commitment slide once the cost became real"}'::jsonb,
NULL, NULL, true),

('ON_SC_01','oneness','married','scenario',27,
'Describe the last significant decision you made that affected your marriage. Did you make it with your spouse, or around them?',
false,
'{"christformed":"Genuinely joint from the start — shaped together, not just approved by the other","rooted":"Made together with minor unilateral elements","growing":"Decided largely alone, then brought to my spouse for buy-in","awakening":"Decided alone and informed my spouse after the fact","unengaged":"Made and acted on without meaningfully involving my spouse at all"}'::jsonb,
NULL, NULL, true),

('SL_SC_01','sacrificial_love','married','scenario',28,
'Describe the last time you gave up something you wanted so your spouse could have what they needed. What was it, and how did you feel about it afterward?',
false,
'{"christformed":"Gave freely; the giving itself, not the wanting, is what is remembered","rooted":"Gave genuinely; some cost was felt but did not curdle into resentment","growing":"Gave, but with noticeable reluctance or a mental note kept","awakening":"Gave only after visible hesitation or negotiation","unengaged":"Avoided giving it up, or gave it resentfully in a way that was felt by my spouse"}'::jsonb,
NULL, NULL, true),

('IN_SC_01','intimacy','married','scenario',29,
'Describe the last time you and your spouse were physically close and something felt off — distant, obligatory, disconnected. Did you name it to each other, or let it pass?',
false,
'{"christformed":"Named it gently and directly in the moment or soon after, and it was received as care, not criticism","rooted":"Named it eventually, even if not immediately","growing":"Noticed it internally but said nothing to my spouse","awakening":"Noticed it and actively avoided bringing it up out of discomfort","unengaged":"This has become normal enough that it no longer registers as something to name"}'::jsonb,
NULL, NULL, true),

('TC_SC_01','truthful_communication','married','scenario',30,
'Describe the last time you did not tell your spouse something true because it would have caused friction. What was it, and what did you tell yourself about why that was okay?',
false,
'{"christformed":"Told the truth anyway, trusting the friction over the silence","rooted":"Told it, though delayed or carefully timed","growing":"Withheld it temporarily, with a genuine intention to disclose later","awakening":"Withheld it and constructed a reasonable-sounding justification for staying quiet","unengaged":"Withheld it and has no real intention of ever disclosing it"}'::jsonb,
NULL, NULL, true),

('CR_SC_01','conflict_repair','married','scenario',31,
'Describe your last real argument with your spouse in detail — how it started, what each of you did, and how, or whether, it actually ended.',
false,
'{"christformed":"Both the conflict and the repair are described specifically, with real ownership of my own part in both","rooted":"Describes a real conflict that reached genuine resolution, with minor loose ends","growing":"Describes a conflict that ended in a truce rather than real resolution","awakening":"Describes a conflict that simply faded without being addressed","unengaged":"Describes a conflict that is still actively unresolved, named as such"}'::jsonb,
NULL, NULL, true),

('MH_SC_01','mutual_honor','married','scenario',32,
'Describe the last time you were genuinely frustrated with your spouse in front of other people. What did you actually do or say?',
false,
'{"christformed":"Held the frustration privately and addressed it with my spouse directly, later and alone","rooted":"Mostly held it, with a small visible sign of frustration quickly managed","growing":"Let the frustration show in tone or expression, though said nothing explicit","awakening":"Made a pointed comment or correction in front of others","unengaged":"Openly criticized or embarrassed my spouse in front of others"}'::jsonb,
NULL, NULL, true),

('SV_SC_01','shared_vision','married','scenario',33,
'Describe the last significant purchase or financial decision you made. Did your spouse know about it before it happened?',
false,
'{"christformed":"Discussed and decided together before any money moved","rooted":"Mentioned it beforehand, even if the final call was made quickly","growing":"Decided largely alone, informed my spouse close to or after the fact","awakening":"My spouse learned about it only once it was already done","unengaged":"My spouse still does not fully know about it"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- SCENARIO — Round 2 (positions 34–41)
-- ═══════════════════════════════════════════════════════════

('CF_SC_02','covenant_faithfulness','married','scenario',34,
'Describe the last time you were tempted to quietly let a promise to your spouse slide because keeping it had become inconvenient. What happened?',
false,
'{"christformed":"Noticed the temptation and kept the promise anyway, without my spouse ever needing to notice the struggle","rooted":"Kept the promise, after a real but brief internal negotiation","growing":"Kept a reduced or delayed version of the promise","awakening":"Let it slide and offered an explanation when asked","unengaged":"Let it slide without ever circling back to it"}'::jsonb,
NULL, NULL, true),

('ON_SC_02','oneness','married','scenario',35,
'Describe the last time your family of origin — parents, siblings — disagreed with a decision you and your spouse made together. What did you do?',
false,
'{"christformed":"Held the shared decision firmly while still honoring the family relationship","rooted":"Held the decision, with some visible effort against the family pressure","growing":"Held the decision formally, while privately second-guessing it under the pressure","awakening":"Quietly adjusted the decision to appease family, without renegotiating it with my spouse","unengaged":"Let family opinion override the decision my spouse and I had made together"}'::jsonb,
NULL, NULL, true),

('SL_SC_02','sacrificial_love','married','scenario',36,
'Describe a recent disagreement about whose preference would win — where to spend an evening, how to spend money, how to spend a Saturday. What actually happened, and why?',
false,
'{"christformed":"Yielded or found genuine mutual ground, without treating it as a loss","rooted":"Yielded willingly, if not instantly","growing":"Negotiated a compromise that mostly favored me","awakening":"My preference won by default, without real negotiation","unengaged":"My preference wins as a matter of course, by habit rather than discussion"}'::jsonb,
NULL, NULL, true),

('IN_SC_02','intimacy','married','scenario',37,
'Describe the last time your spouse tried to get emotionally close to you — shared something vulnerable, asked how you really are — and you pulled back or deflected. What happened?',
false,
'{"christformed":"Cannot identify a recent instance — vulnerability is reliably met, not deflected","rooted":"Identifies a minor, brief instance, quickly corrected","growing":"Identifies a real instance of deflection, with some awareness of doing it","awakening":"Identifies a pattern of deflection, described somewhat defensively","unengaged":"Describes consistently shutting down or deflecting vulnerability, without much reflection on it"}'::jsonb,
NULL, NULL, true),

('TC_SC_02','truthful_communication','married','scenario',38,
'Describe the last time your spouse asked you a direct question you did not want to answer honestly. What did you actually say?',
false,
'{"christformed":"Answered fully and honestly despite not wanting to","rooted":"Answered honestly, after a visible pause or difficulty","growing":"Gave a technically true but incomplete answer","awakening":"Deflected the question without directly lying","unengaged":"Gave an answer that was not true"}'::jsonb,
NULL, NULL, true),

('CR_SC_02','conflict_repair','married','scenario',39,
'Describe the last time you were clearly in the wrong in a conflict with your spouse. What did you actually say to them afterward?',
false,
'{"christformed":"Named the fault plainly and specifically, with no attached justification","rooted":"Apologized clearly, with only minor softening","growing":"Apologized, but paired it with an explanation that shifted some blame","awakening":"Offered a vague or partial apology (''sorry about earlier'') without naming the fault","unengaged":"Did not apologize, or framed myself as equally or more wronged"}'::jsonb,
NULL, NULL, true),

('MH_SC_02','mutual_honor','married','scenario',40,
'Describe the last decision where you had more practical power than your spouse — financially, socially, or otherwise. Did you use that power to decide for both of you, or with them?',
false,
'{"christformed":"Actively used the power imbalance to make space for my spouse''s voice, not less of it","rooted":"Decided together despite having more leverage","growing":"Decided mostly alone but checked in out of courtesy","awakening":"Used the power to decide, then presented it to my spouse as settled","unengaged":"The power imbalance was used to simply override my spouse''s preference"}'::jsonb,
NULL, NULL, true),

('SV_SC_02','shared_vision','married','scenario',41,
'Describe the last conversation you and your spouse had about where your life together is actually headed, five to ten years out. When was it, and what came of it?',
false,
'{"christformed":"A recent, substantive conversation with real shared direction that is actively shaping current decisions","rooted":"A real conversation happened reasonably recently, with some follow-through","growing":"A vague or long-ago conversation that has not really been revisited","awakening":"Cannot recall a real conversation like this, only logistics-level talk","unengaged":"No such conversation has meaningfully happened"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- REFLECTIVE DISCLOSURE — Round 1 (positions 42–49)
-- ═══════════════════════════════════════════════════════════

('CF_RE_01','covenant_faithfulness','married','reflective_disclosure',42,
'Describe, honestly, a season or a single moment when your commitment to your marriage was genuinely tested — not just annoyed, but tested. What carried you through it, or what did not — and what do you now see in yourself, not just the circumstances, that made it harder?',
false,
'{"christformed":"Names a real test with full honesty, including what nearly broke it, and what specifically held","rooted":"Names a real test honestly, with a reasonably clear account of what held","growing":"Names a test but stays somewhat general about what actually carried it through","awakening":"Describes difficulty in the abstract without naming a specific tested moment","unengaged":"Minimizes or avoids naming any real test of commitment"}'::jsonb,
NULL, NULL, true),

('ON_RE_01','oneness','married','reflective_disclosure',43,
'Describe a specific way your life and your spouse''s life are still run as two separate lives rather than one shared one — a schedule, a bank account, a friend group, a future plan. Be concrete.',
false,
'{"christformed":"Names a specific, concrete area of real separateness with no minimizing","rooted":"Names a real area, described specifically, with light minimizing","growing":"Names an area but keeps it vague or frames it as not really a problem","awakening":"Deflects toward generalities about busyness or personality rather than naming the actual area","unengaged":"Claims no real separateness exists, implausibly"}'::jsonb,
NULL, NULL, true),

('SL_RE_01','sacrificial_love','married','reflective_disclosure',44,
'Describe one way you love your spouse that costs you something you have never admitted out loud resenting a little. Be honest about the resentment, not just the love.',
false,
'{"christformed":"Names both the sacrifice and the resentment specifically and without self-protection","rooted":"Names a real sacrifice and acknowledges some resentment honestly","growing":"Names the sacrifice but softens or minimizes the resentment","awakening":"Describes the sacrifice in a way that avoids naming any resentment at all","unengaged":"Cannot or will not identify a real cost being carried"}'::jsonb,
NULL, NULL, true),

('IN_RE_01','intimacy','married','reflective_disclosure',45,
'Describe, as honestly as you can, where you and your spouse are not fully known to each other right now — physically, emotionally, or both. Not what should be true. What is.',
false,
'{"christformed":"Names the actual distance specifically and without deflecting into generic marital advice","rooted":"Names a real area of unknownness, with reasonable specificity","growing":"Acknowledges some distance but stays vague about where exactly","awakening":"Gestures at the question without really answering it","unengaged":"Denies any real distance, implausibly, or avoids the question entirely"}'::jsonb,
NULL, NULL, true),

('TC_RE_01','truthful_communication','married','reflective_disclosure',46,
'Name one thing that is true about how you feel in your marriage right now that your spouse does not know, because you have not told them. You do not have to resolve it here — just name it honestly.',
false,
'{"christformed":"Names something real and specific, without hedging it into vagueness","rooted":"Names something real, if a little softened","growing":"Names something but keeps it abstract enough to stay safe","awakening":"Offers something minor or low-stakes as a stand-in for the real thing","unengaged":"Claims there is nothing unsaid, implausibly"}'::jsonb,
NULL, NULL, true),

('CR_RE_01','conflict_repair','married','reflective_disclosure',47,
'Describe a conflict with your spouse that was never actually resolved — just stopped. What is still sitting underneath it?',
false,
'{"christformed":"Names a specific unresolved conflict and what is genuinely still unresolved beneath it","rooted":"Names a real unresolved conflict with reasonable specificity","growing":"Names a conflict but is vague about what remains underneath it","awakening":"Describes conflict in general terms without naming a specific unresolved one","unengaged":"Claims nothing is unresolved, implausibly"}'::jsonb,
NULL, NULL, true),

('MH_RE_01','mutual_honor','married','reflective_disclosure',48,
'Describe a specific way you treat your spouse with less honor in private than you would ever show them in public. Be concrete about what that looks like.',
false,
'{"christformed":"Names a specific private pattern honestly, without defending it","rooted":"Names a real pattern with reasonable specificity","growing":"Acknowledges something but stays general about what it actually looks like","awakening":"Minimizes it as ''just how we talk'' rather than naming it plainly","unengaged":"Denies any gap between public and private honor, implausibly"}'::jsonb,
NULL, NULL, true),

('SV_RE_01','shared_vision','married','reflective_disclosure',49,
'Describe one area of your shared life — money, parenting, calling, extended family, or what you each actually believe and practice as faith — where you and your spouse are quietly building two different futures rather than one. Be specific about where the divergence actually is.',
false,
'{"christformed":"Names a specific, real divergence with clarity about where it actually is","rooted":"Names a real divergence with reasonable specificity","growing":"Acknowledges some divergence but stays vague about where","awakening":"Deflects toward general busyness rather than naming an actual divergence","unengaged":"Claims full alignment, implausibly"}'::jsonb,
NULL, NULL, true),

-- ═══════════════════════════════════════════════════════════
-- CROSS-PILLAR REFLECTIVE — final synthesis (position 50)
-- ═══════════════════════════════════════════════════════════

('X_RE_01','cross_pillar','married','reflective_disclosure',50,
'If your spouse answered every question in this assessment honestly, where do you expect the biggest difference between your answers and theirs would be — and why do you think that gap exists?',
false,
'{"christformed":"Names a specific, plausible pillar and gives a genuinely self-critical account of why the gap exists","rooted":"Names a plausible pillar with a reasonably honest account of the likely gap","growing":"Names a pillar but the explanation leans toward explaining it away","awakening":"Stays vague about which pillar, or offers a surface-level guess","unengaged":"Claims no real gap would exist, implausibly"}'::jsonb,
NULL, NULL, true);
