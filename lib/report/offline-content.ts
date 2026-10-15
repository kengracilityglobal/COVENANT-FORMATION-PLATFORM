// lib/report/offline-content.ts
//
// Authored copy for the offline (no-API-key) report. Everything here is
// written by hand, once, to the same rules the AI portrait prompt follows
// (lib/report/generate.ts): plain English, no framework jargon, first
// sentence something the reader recognises, name the cost, short
// sentences, and end with ONE specific thing to do. Nothing in this file
// is assembled from smaller parts at render time — the engine in
// offline-portrait.ts only chooses between finished pieces and fills in
// the person's own evidence around them.
//
// Couple copy (married + premarital) uses three tokens, resolved by the
// engine:  {sp} "your spouse" / "your partner"
//          {Sp} the same, capitalised for a sentence start
//          {mar} "your marriage" / "your relationship"
// Readiness copy is written separately (a solo, forward-looking reading —
// there is no spouse yet) and uses no tokens.

import type { FormationDescriptor } from '@/types'
import type { CorePillar } from '@/lib/scoring/aggregate'

export type Bank = Record<CorePillar, Record<FormationDescriptor, string>>

// ═══════════════════════════════════════════════════════════════════════
// COUPLE · WHAT IS TRUE (recognition + cost)
// ═══════════════════════════════════════════════════════════════════════
export const COUPLE_PORTRAIT: Bank = {
  covenant_faithfulness: {
    christformed: "When you tell {sp} you'll do something, they stop thinking about it. That is a rare thing to be able to give someone, and your answers say you have earned it, including on days when keeping your word cost you. The risk now is quiet. Reliability that gets taken for granted slowly stops being protected.",
    rooted: "Your word holds almost everywhere, and {sp} knows it. There is one kind of promise that still gets renegotiated once it becomes inconvenient. Usually it is a small one. Small slips add up to a question {sp} may never ask out loud: can I count on this one?",
    growing: "You mean it when you promise. The trouble comes later, when the feeling fades and the promise turns into a chore. {Sp} has probably learned to hold your commitments loosely and not to count on them until they are done. That caution is a cost they pay every week.",
    awakening: "Right now, what you commit to tends to move with how you feel about it later. {Sp} has likely noticed which of your promises are firm and which are really intentions. Living with that is tiring. They have to guess, check, or quietly lower their expectations.",
    unengaged: "Promises are being treated as provisional here, good until something easier comes along. {Sp} cannot build on that, so they have likely stopped trying and carry alone what was meant to be carried together. This is not a verdict on your character. It is where your answers say you are standing today.",
  },
  oneness: {
    christformed: "You and {sp} make decisions as a team, and neither of you disappears into the other. Nobody asks permission or announces a decision after the fact. It reads as one household with two people in it. The danger is drift. Busy seasons quietly turn two partners back into two schedules.",
    rooted: "You work as a team most of the time. There is one area, often money, time, or the children, where one of you still decides first and informs the other later. It rarely causes a fight. It does leave {sp} with a small, steady sense of being managed instead of consulted.",
    growing: "You share the big decisions, and you do it well. The day-to-day is different. Most of it runs in parallel, each of you handling your own corner. That holds until stress arrives. Then each of you goes back to solving things alone, and {sp} finds out afterward.",
    awakening: "You both know this should look more joined than it does. In practice, each of you largely runs your own life, and deciding together is the exception. {Sp} may feel they live beside you more than with you, and may not have said so.",
    unengaged: "At the moment this reads as two separate lives sharing an address more than one shared life. Decisions, money, and time mostly stay on separate tracks. That is lonely for both of you, even when neither of you is angry. Seeing it clearly is where change starts.",
  },
  sacrificial_love: {
    christformed: "You give to {sp} without keeping a ledger. You notice what they need, act on it, and do not wait for thanks. Your answers say this is how you actually live, not how you hope to. Watch for one thing. Generosity that never rests can slide into quiet exhaustion, and then into silent martyrdom.",
    rooted: "You give freely most of the time. Now and then you catch yourself counting what you did against what came back. It has not turned into resentment yet. It could, if it goes on unspoken. The ledger usually starts in one specific moment, and that moment is worth finding.",
    growing: "You do give, and you mean it. You also notice, and sometimes mention, what has not been returned. {Sp} feels that even when you say nothing. A gift with a silent receipt feels like a loan, and it does not warm {mar} the way a free gift does.",
    awakening: "Giving tends to come with strings, even unspoken ones. Help is offered expecting something comparable back, and when it does not come, it is remembered. {Sp} probably senses the strings. It makes receiving from you feel like taking on a debt.",
    unengaged: "What you give is mostly shaped by what you expect to get back. That is rarely a flaw you were born with. It is usually learned, often somewhere that love had to be earned. In {mar}, it means both of you are quietly keeping score, and neither can rest.",
  },
  intimacy: {
    christformed: "You let {sp} see the real you, fears and failures included, and you make room for the same from them. Closeness here is not just physical or routine. It is being known on purpose. The thing to guard is comfort. Over time, closeness can settle into familiarity and stop asking deeper questions.",
    rooted: "There is real openness between you and {sp}, and there are also rooms you keep closed. Maybe a fear, a past mistake, a need you are embarrassed by. You are not hiding on purpose. You are protecting something. {Sp} can feel where the door is, even if they cannot see inside.",
    growing: "You share honestly when asked, or when something forces it open. Starting that kind of conversation yourself is still rare. So {sp} mostly knows you by what you report, not by what you volunteer. That keeps you safe, and it keeps you a little out of reach.",
    awakening: "What {sp} mostly sees is a managed version of you: capable, mostly positive, a bit edited. That is a habit more than a decision. But an edited person cannot be loved the way a real one can, and part of you probably knows it.",
    unengaged: "Your real struggles stay private, even from the person closest to you. Being alone with your own heart inside {mar} is a quiet kind of loneliness, and it tends to grow. Nothing about being closer matters until this is said, first to yourself and then to {sp}.",
  },
  truthful_communication: {
    christformed: "What you say to {sp} matches what is true, even when it costs you, and you say it in a way they can actually receive. You do not use honesty as a weapon, and you do not hide behind kindness. As familiarity grows, watch the slide from honest to blunt.",
    rooted: "You are generally direct, and {sp} mostly knows where they stand with you. There is one kind of hard conversation you would rather not start. Often it is about money, family, or a habit of theirs. The cost is that it keeps returning in other forms.",
    growing: "You can be honest when asked directly. Raising a hard truth before anyone asks is harder, so it often waits until it comes out sideways, as irritation or sarcasm. {Sp} ends up answering the tone rather than the thing.",
    awakening: "A lot of what you mean gets carried by hints, sighs, and silences instead of words. {Sp} is left guessing, and guessing wrong, more often than either of you would like. They may be arguing with a version of you that you never actually said.",
    unengaged: "What is actually true and felt mostly stays unsaid, and conversation stays at the surface. {Sp} is living with a version of you they can only half read. The gap between what you think and what you say is the whole problem, and it is smaller to close than it feels.",
  },
  conflict_repair: {
    christformed: "Arguments between you and {sp} actually end. You come back to them, you can say what your part was without needing to win first, and you rarely let a day close with anger still in the room. That peace was worked for. The risk is smoothness. Make sure quick repair is not skipping the real issue.",
    rooted: "Most disagreements get repaired. The exception is a recurring one, usually the same trigger, that lingers longer than it should. It tends to come back in a new outfit. Naming the trigger itself, not the latest argument, is what finally ends it.",
    growing: "You know how to repair, and you do it, just late. The delay is rarely confusion. It is usually pride, or waiting to see who will move first. Those hours or days of cold distance cost more than the apology would have.",
    awakening: "Fights tend to stop rather than get resolved. The noise ends, but the actual disagreement is still there, waiting. Over time {sp} learns that raising something leads to a fight and then a silence, so they raise less.",
    unengaged: "Disagreement mostly ends in distance, not repair. The gap tends to widen quietly, one unresolved thing at a time, until staying out of each other's way feels easier than being honest. That is not hopeless. Repair can start from where you are, but it cannot start until its absence is admitted.",
  },
  mutual_honor: {
    christformed: "You treat {sp} with honor when you are frustrated, when you are tired, and when no one is watching. You also champion who they are becoming, not just who they are now. Watch how you speak about them when they are not in the room. That is where honor usually wears thin first.",
    rooted: "Honor is the default between you. There is one condition, usually frustration or an audience, where it holds less well. In that moment a joke at their expense, an eye-roll, or a correction in front of others slips out. It is small, and {sp} remembers it longer than you do.",
    growing: "You respect {sp}, and it shows on calm days. Under pressure the respect frays: a sharper tone, a dismissive answer, a sigh. {Sp} learns that your kindness has a limit, and starts arranging their behavior around finding it.",
    awakening: "You know what honoring {sp} looks like, but it has not become a habit, especially when you are stressed or others are around. {Sp} is more likely to feel managed or corrected than championed. It rarely feels like contempt. It still wears.",
    unengaged: "Honor toward {sp} is not yet a practiced habit, especially under stress or in front of others. They may feel small around you more often than you realize. This area changes quickly once it is faced, because every single act of honor counts right away.",
  },
  shared_vision: {
    christformed: "You and {sp} are building one future, not two that happen to overlap. Money, family, children, work, and calling have been talked through, not just assumed. A vision agreed once can still drift, so the work now is to keep checking it as life changes.",
    rooted: "You are mostly walking the same direction. One area, such as money, extended family, or the shape of the next ten years, is thinner than the rest. That kind of difference stays quiet until a big decision forces it into the open, and then it is harder to discuss.",
    growing: "You have talked about the big picture. The specifics are vaguer than either of you admits: what you will actually do about money, where you will live, how you will handle family. Each of you is probably carrying a picture in your head that the other has never seen.",
    awakening: "You both know a shared vision matters, but the detailed conversation has not happened. You are hoping it will become clear instead of building it on purpose. Meanwhile each of you makes decisions that quietly assume the other's agreement.",
    unengaged: "At the moment you and {sp} are heading toward futures that have not been reconciled. Assumed agreement is standing in for a real conversation about money, family, and calling. That is fixable, and early. The only thing that cannot be fixed is not knowing.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// COUPLE · ONE THING TO DO TOGETHER THIS WEEK
// ═══════════════════════════════════════════════════════════════════════
export const COUPLE_ACTION: Bank = {
  covenant_faithfulness: {
    christformed: "Ask {sp} two questions this week: \"What do I do that makes you feel you can rely on me?\" and \"Where would you like to rely on me more?\" Listen to both answers without explaining anything.",
    rooted: "Think of the last small promise that slid. Tell {sp} you noticed, apologize in one sentence with no reason attached, and keep the replacement promise before the week ends.",
    growing: "Make one small, specific promise to {sp} that you can finish by Sunday. Say it out loud to them, and keep it even if it becomes inconvenient.",
    awakening: "Ask {sp}: \"Which promise of mine have you stopped counting on?\" Do not defend yourself. Write the answer down and keep one item from that list before the week ends.",
    unengaged: "Pick one thing you told {sp} you would do and have not done. Do it this week, and tell them you did it because you said you would. Small is fine.",
  },
  oneness: {
    christformed: "Sit with {sp} for twenty minutes and look at the coming month together. Ask each other: \"Where are we running separate operations that should be joint?\" Change one thing.",
    rooted: "Name the one area where you decide first and tell {sp} afterward. Hand the next decision there to both of you, and wait for their input before acting.",
    growing: "For one day this week, tell {sp} your small decisions before you make them: what to buy, when to leave, who to call. Notice how often your instinct is to just act.",
    awakening: "Choose one recurring decision, like the weekly budget check or the schedule, and make it a standing joint conversation. Fifteen minutes, same time each week, starting now.",
    unengaged: "Ask {sp} for twenty minutes to describe how you each spend a normal weekday. Do not fix anything. Just see where your lives actually touch, and where they do not.",
  },
  sacrificial_love: {
    christformed: "Ask {sp}: \"Is there anything I carry that you wish I would put down, or anything you would like to carry for me?\" Then take one thing off your own plate this week.",
    rooted: "The next time you notice the ledger starting, say it in plain words to {sp} before it hardens: \"I'm feeling stretched on this. Can we look at it together?\"",
    growing: "Do one act of service for {sp} this week in secret and tell no one, including them. Pay attention to whether you want credit for it.",
    awakening: "Choose one thing you will do for {sp} this week with no expectation of anything back, and do not mention it afterward. Notice what it is like to give without a receipt.",
    unengaged: "Ask {sp} what one small thing you could do for them this week would mean the most. Do it fully, and do not bring it up again.",
  },
  intimacy: {
    christformed: "Ask {sp} one question you have never asked, about a fear or something they hope for. Give them room to answer, then answer the same question honestly yourself.",
    rooted: "Tell {sp} one true thing you have not told them: a worry, a want, or something you have been embarrassed by. Start with a small one.",
    growing: "Start one real conversation without being asked. Say, \"Something has been on my mind, and I'd rather you hear it from me.\" Then say it.",
    awakening: "At the end of one day this week, tell {sp} how you actually are, not how you are fine. One honest sentence is enough.",
    unengaged: "Tell {sp} one thing you have been keeping to yourself, however small. If a whole conversation feels too big, start with: \"I've found this hard to tell you.\"",
  },
  truthful_communication: {
    christformed: "Ask {sp}: \"Is there anything I say that is true but lands harder than I mean it to?\" Take the answer as information, not criticism.",
    rooted: "Name the hard conversation you have been avoiding and schedule it with {sp} this week. Say, \"I'd like to talk about this. Is Thursday good?\" in those words.",
    growing: "Say one hard but true thing to {sp} before they ask for it, calmly and kindly. Pick the smallest one on your list.",
    awakening: "Replace one hint this week with a plain sentence. Instead of a sigh or a silence, say \"I'm upset about this\" or \"I need this.\"",
    unengaged: "Tell {sp} one thing that is true and that you have been leaving unsaid. If it is too big, say, \"There's something I haven't been saying.\" That sentence alone counts.",
  },
  conflict_repair: {
    christformed: "Ask {sp}: \"Is there anything we settled quickly that we never actually fixed?\" Pick one and go back to it properly.",
    rooted: "Identify the trigger behind your longest-running disagreement. Tell {sp} what you think it is, and ask whether they see it the same way.",
    growing: "Next time there is friction, apologize within the hour. Even if you only own a small part, say that part out loud to {sp}.",
    awakening: "Bring up one disagreement that stopped without being settled. Say, \"I don't think we finished that one. Can we?\" Give it fifteen minutes.",
    unengaged: "Tell {sp}: \"I don't want us to keep drifting apart after fights. Can we agree to say one sentence of repair whenever we disagree?\" Then try it once this week.",
  },
  mutual_honor: {
    christformed: "Say something good about {sp} to another person this week, in front of them if you can. Then ask {sp}: \"How can I back you in the thing you care about most right now?\"",
    rooted: "Decide ahead of time what you will do the next time you are frustrated in front of others, such as pausing, or saving it for private. Tell {sp} your plan.",
    growing: "The next time you feel your tone sharpen with {sp}, slow down: a breath, then a softer sentence. If you miss it, apologize afterward.",
    awakening: "Do one small, visible act of honor for {sp} this week: thank them specifically, defer on something minor, or speak well of them to others.",
    unengaged: "Ask {sp}: \"When do I make you feel small?\" Do not answer back. Say thank you, and choose one of those moments to change this week.",
  },
  shared_vision: {
    christformed: "Pick one area of your future, like money, home, or work, and spend thirty minutes asking: \"Is this still what we both want?\" Write the answer down.",
    rooted: "Take the thinner area, whether money, extended family, or the next ten years, and give it a dedicated conversation with {sp}. Ask \"What do you picture?\" before you describe your own picture.",
    growing: "Choose one specific you have been leaving vague, like a savings goal, where you will live, or how you will handle family, and make one concrete decision about it with {sp}.",
    awakening: "Each of you write five sentences, separately, about what you want your lives to look like in ten years. Swap them this week and read them aloud.",
    unengaged: "Ask {sp} for an hour to talk about the next five years without trying to settle anything. Just find out what each of you is actually picturing.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// READINESS · WHAT IS TRUE (solo, forward-looking; no spouse yet)
// ═══════════════════════════════════════════════════════════════════════
export const READINESS_PORTRAIT: Bank = {
  covenant_faithfulness: {
    christformed: "When you tell the people close to you that you will do something, they can plan around it. Your answers say you keep your word even after the feeling behind it has gone. That is exactly what a marriage leans on hardest, on its tired and ordinary days. Keep an eye on the one place it might quietly bend when no one is checking.",
    rooted: "Your word holds in most places. There is a particular kind of promise, often a small one, that gets quietly renegotiated once it becomes inconvenient. In a marriage that kind of slip is felt daily. It is much easier to find it now.",
    growing: "You mean it when you promise, but the follow-through fades along with the feeling. Friends and family may already hold your commitments a little loosely. In a marriage that loose hold would be felt far more, because there is no one else to catch what drops.",
    awakening: "What you commit to tends to move with how you feel about it later. The people close to you have probably noticed which promises are firm and which are really intentions. This is worth seeing now, while a dropped promise costs a friendship and not a household.",
    unengaged: "Right now, a promise from you is treated as provisional, and the people who rely on you have likely learned not to. That is hard to read, and it is also the cheapest time to change it. Faithfulness is a practiced habit. It does not appear at the altar.",
  },
  oneness: {
    christformed: "You already know how to act as part of a team and not just near one. You share real decisions instead of only wanting agreement with ones you have already made. That will carry over. The thing to watch is how you respond once someone is newly and intensely close to you, and the habit is tested.",
    rooted: "You share decisions well in most places. There is one area, usually under stress, where you still take control and inform others afterward. In a marriage that area would be used every day, so it is worth looking at closely now.",
    growing: "You share the big decisions. Day to day, you default to doing things your own way. That is fine in a single life, and it is exactly the habit marriage puts pressure on, since the small decisions are the ones that fill most days.",
    awakening: "Sharing real decisions with another person has not become a habit yet. You would rather have agreement with what you have already decided. Better to see that now, in friendships and family, than to find it out with someone who has taken your name.",
    unengaged: "At the moment control mostly stays with you. That is not a fault of character. It may come from being used to handling things alone. Marriage will still ask you to hand over some of the steering, and that muscle can be built before you need it.",
  },
  sacrificial_love: {
    christformed: "You give to people you love without keeping a tally, and you notice what they need before they ask. That quality is what sustains a marriage once the first excitement settles into ordinary life. The one thing to watch is giving until you are empty and calling it love.",
    rooted: "You give freely most of the time. Now and then you notice an imbalance, though it has not turned bitter. It is worth asking yourself what you would do if it never evened out. In marriage that question arrives sooner or later.",
    growing: "You give, and you mean it. You also notice, and sometimes mention, what was not returned. That is love that has not yet learned to let go of the receipt. In a marriage, where giving never stops, the receipts would pile up quickly.",
    awakening: "Your giving tends to come with a quiet expectation of something back. People close to you probably sense the string. A spouse would sense it faster, because they would live inside it every day.",
    unengaged: "What you give is mostly shaped by what you expect in return. The question is not whether you are selfish. It is whether you have ever given without a transaction attached, even once. That is the thing to practice before a marriage depends on it.",
  },
  intimacy: {
    christformed: "You let people close to you see real fears and struggles, not a polished version, and you invite the same from them. Most people do not build that habit until marriage forces it. You already have. Keep it alive as relationships grow more comfortable.",
    rooted: "You are open with the people closest to you, with a few rooms you keep shut. It might be a fear, a past mistake, or a need you are embarrassed by. It is worth asking what you are protecting, because a spouse will eventually be standing at that door.",
    growing: "You share honestly when asked, but rarely start those conversations yourself. People know you mostly by what you report, not what you volunteer. In a marriage, a partner can tell the difference between being informed and being let in.",
    awakening: "What most people see in you is a managed, mostly positive version. It is habit more than hiding. A spouse would live with that edited version daily, and it is hard to be fully loved while only part of you is present.",
    unengaged: "Your real struggles stay private, even from the people closest to you. Being known is a skill, and it grows with use. Better to begin practicing with someone safe now than to try for the first time with a spouse.",
  },
  truthful_communication: {
    christformed: "What you say matches what is true and felt, even when it costs you, and you can hear hard feedback without shutting down. That is rarer than most people think before marriage. Keep your honesty warm as the stakes grow.",
    rooted: "You are generally direct. There is one kind of hard conversation you tend to avoid starting. Ask what you are afraid will happen if you start it, because that same fear would sit across the breakfast table in a marriage.",
    growing: "You are honest when asked directly. Bringing up a hard truth on your own is still the harder move, so it can wait until it leaks out as irritation. Marriage tends to expose that pattern quickly.",
    awakening: "Hints, sighs, and withdrawal carry a lot of what you mean. People around you are left guessing. A spouse would be left guessing every day, and the guessing would cost you both.",
    unengaged: "What is actually true and felt mostly stays unsaid. You may not even notice it, because that has been how you handled things for a long time. Left alone, this is the habit that leaves a spouse never quite knowing what you think.",
  },
  conflict_repair: {
    christformed: "Disagreements with people close to you actually get resolved. You come back, and you can say what your part was without waiting to be proven right. As the stakes of conflict rise in marriage, that habit becomes one of your best assets.",
    rooted: "Most conflicts get repaired. One lingers longer than it should, usually around the same trigger. It is worth knowing what it is, since marriage tends to find your triggers quickly and use them often.",
    growing: "You know how to repair, and you do it, late. The delay is usually pride, not confusion. In a marriage those cold hours cost more, because you share a roof while you wait.",
    awakening: "Conflicts tend to stop rather than get resolved. The noise ends and the real disagreement stays put. A marriage holds many disagreements that never go away, and the skill you will need most is the one you have practiced least.",
    unengaged: "Disagreement mostly ends in distance, not repair. That is a pattern, not a destiny. It will not fix itself when a relationship gets more serious. It tends to get louder, which makes now a good time to start learning another way.",
  },
  mutual_honor: {
    christformed: "You treat the people close to you with honor, even when frustrated, and you know how to back someone else's growth instead of just tolerating it. It is among the clearest signs of a marriage that lasts. Keep it up when no one is watching.",
    rooted: "Honor shows up consistently, with one condition, usually frustration or an audience, where it holds less well. That specific moment is worth knowing before there is a spouse to feel it.",
    growing: "You mean to honor people, and it shows when things are calm. Under pressure it frays. A spouse sees you under pressure more than anyone, so how you speak then matters most.",
    awakening: "You know what honoring someone looks like, but it has not become a habit when you are stressed. The people closest to you may feel corrected more than championed. Marriage multiplies the number of moments where this shows up.",
    unengaged: "Honor toward people close to you is not yet a practiced habit, especially under frustration. It changes fast once faced, because every single act of honor counts right away. It is far easier to build now than to meet for the first time inside a marriage.",
  },
  shared_vision: {
    christformed: "You have done the work of knowing your own mind: money, family, calling, where you want to live. That clarity is a gift to bring into a marriage, because a shared future only works between two people who each know what they are bringing.",
    rooted: "You are mostly clear on your direction. One area, money, family, or calling, is thinner than the rest. It is better to get clear on it alone first than to negotiate it with someone while you are still deciding.",
    growing: "You have a general sense of where you are headed. The specifics, what you actually want about money, family, or where you will live, are vaguer than you may admit. Those specifics are exactly what two people have to reconcile.",
    awakening: "You know a clear direction matters, but the work of deciding what you want has not happened yet. You are hoping it will become clear. Marriage is much harder to enter while your own answers are still unformed.",
    unengaged: "Your own direction, money, family, calling, is still unclear and more hoped for than decided. That is an honest and common place to be. It is also where a shared future starts, with each person knowing their own mind first.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// READINESS · ONE THING TO DO THIS WEEK (alone, or with a trusted person)
// ═══════════════════════════════════════════════════════════════════════
export const READINESS_ACTION: Bank = {
  covenant_faithfulness: {
    christformed: "Ask someone who knows you well: \"Where have you seen me not follow through?\" Listen without defending, and keep one thing from their answer in front of you this month.",
    rooted: "Identify the one kind of promise you most often renegotiate. This week, do not make that promise unless you intend to keep it, and then keep it.",
    growing: "Make one small commitment to a friend or family member that you can finish by Sunday. Say it out loud, and keep it even if it becomes inconvenient.",
    awakening: "List three promises you made this past month. Mark each one kept, slid, or dropped. Share the list with someone you trust and fix one.",
    unengaged: "Pick something you said you would do for someone and have not done. Do it this week, and tell them you did it because you said you would.",
  },
  oneness: {
    christformed: "The next time you have a decision to make in a close relationship, ask the other person what they think before you share your own opinion. Notice how it feels.",
    rooted: "Name the area where you decide first and tell people afterward. This week, flip that order once: ask first, then decide.",
    growing: "Pick a small decision, like a plan, a purchase, or a schedule, and make it jointly with a friend or family member, even if you would normally just do it yourself.",
    awakening: "For one decision this week, ask someone close to you what they would do, and let their answer actually shape what you choose.",
    unengaged: "Ask someone you trust to tell you honestly how you come across when you make decisions. Write down what they say and do not argue with it.",
  },
  sacrificial_love: {
    christformed: "Ask someone close to you whether there is something you carry for them that they would be glad to take back. Giving well includes letting others give.",
    rooted: "The next time you notice yourself keeping score, say what you feel out loud to someone safe, before it turns into resentment.",
    growing: "Do one thing for someone this week and mention it to no one, including them. Notice whether you want credit.",
    awakening: "Do something costly for someone this week, in time or money, with no expectation of thanks. Do not bring it up afterward.",
    unengaged: "Choose one person and give them something this week, a half hour, a favor, a meal, without waiting for anything in return. Notice what is hard about it.",
  },
  intimacy: {
    christformed: "Choose a person you trust and ask them a real question about their life. Then answer the same question honestly about yourself.",
    rooted: "Tell a trusted friend or mentor about one thing you usually keep to yourself. Pick the smallest one if you need to.",
    growing: "Start one real conversation this week without being asked. Say, \"There's something I've been thinking about, and I'd like you to hear it from me.\"",
    awakening: "The next time someone asks how you are, give the true answer in one honest sentence instead of the polished one.",
    unengaged: "Write down one thing you have never told anyone. You do not have to share it yet. Decide who the first safe person might be.",
  },
  truthful_communication: {
    christformed: "Ask someone who knows you well: \"Is there anything I say that is true but lands harder than I mean it to?\" Take the answer as information.",
    rooted: "Name the hard conversation you have been avoiding and schedule it this week, using the words \"I'd like to talk about this.\"",
    growing: "Say one hard but true thing to someone this week before they ask for it. Pick the smallest one on your list.",
    awakening: "Replace one hint this week with a plain sentence: \"I'm upset about this\" or \"I need this.\"",
    unengaged: "Tell someone one thing that is true and that you have left unsaid. If it feels too big, begin with \"There's something I haven't been saying.\"",
  },
  conflict_repair: {
    christformed: "Ask a close friend or relative: \"Is there anything between us that we smoothed over without really resolving?\" If so, go back to it.",
    rooted: "Think about the trigger behind your longest-running disagreement. Write down what it is and bring it to a mentor.",
    growing: "The next time there is friction, apologize within the hour. Even if you only own a small part, say that part out loud.",
    awakening: "Revisit one disagreement that stopped without being settled. Say, \"I don't think we finished that one. Can we talk?\"",
    unengaged: "Pick one conflict from the past year and write down what your part in it was. Then tell the other person, in one sentence, that you see it.",
  },
  mutual_honor: {
    christformed: "Say something good about someone close to you in front of others this week. Then ask them how you could back what they care about most right now.",
    rooted: "Decide in advance what you will do the next time you get frustrated in front of other people, such as pausing or saving it for private. Tell a trusted friend your plan.",
    growing: "The next time you feel your tone sharpen with someone, slow down: a breath, then a softer sentence. If you miss it, apologize afterward.",
    awakening: "Do one small, visible act of honor this week: thank someone specifically, defer on something minor, or speak well of them to others.",
    unengaged: "Ask a close friend or family member: \"When do I make you feel small?\" Do not answer back. Say thank you, and change one thing.",
  },
  shared_vision: {
    christformed: "Write one page on what you want your life to look like in ten years: money, home, family, work, faith. Share it with a mentor.",
    rooted: "Take the area that is thinner than the rest, money, family, or calling, and spend an hour this week writing down what you actually want there.",
    growing: "Pick one specific you have left vague, such as a savings target, where you want to live, or what you expect from family, and make one concrete decision about it.",
    awakening: "Write five sentences about your life in ten years. Read them again in a week and see which ones still feel true.",
    unengaged: "Set aside an hour to ask yourself three questions: where do I want to live, what do I want to do with my money, and what do I believe I am called to? Write down the first honest answers.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// COUPLE · PERCEPTION GAP LINES
// {other} = the partner's first name, or "your spouse" / "your partner".
// Written per pillar, per direction, because "you rate this higher" means
// something different for faithfulness than it does for intimacy.
// ═══════════════════════════════════════════════════════════════════════
export interface GapLines { youHigher: string; otherHigher: string; bothLow: string }

export const GAP_LINES: Record<CorePillar, GapLines> = {
  covenant_faithfulness: {
    youHigher: "You see your reliability more favorably than {other} seems to. Ask them which promises they have learned not to count on.",
    otherHigher: "{other} sees more faithfulness here than you do. Ask what you are holding yourself to that they are not, or what they are choosing to overlook.",
    bothLow: "You both see this as an area still being built. That makes it easier to start, since neither of you has to defend a story.",
  },
  oneness: {
    youHigher: "You feel more like a team than {other} does. Ask them where they feel they are carrying things, or deciding, alone.",
    otherHigher: "{other} feels more joined than you do. Ask yourself what is missing for you, and say it before it hardens into distance.",
    bothLow: "You both feel more like two lives than one. That is an honest shared starting point.",
  },
  sacrificial_love: {
    youHigher: "You believe you give more freely than {other} feels it. Ask what they would call generous, and what they would call strings.",
    otherHigher: "{other} sees more generosity here than you feel you are giving, or getting. Ask where each of you is quietly keeping count.",
    bothLow: "You both feel the giving is conditional. Name that together, and pick one place to give without a receipt.",
  },
  intimacy: {
    youHigher: "You feel closer than {other} does. Ask them what would help them feel more known by you.",
    otherHigher: "{other} feels closer than you do. Ask yourself what you are holding back, and whether you are ready to say so.",
    bothLow: "Neither of you feels fully known. It is a shared lack, and it is easier to approach as a team than alone.",
  },
  truthful_communication: {
    youHigher: "You think you are saying what is true more than {other} experiences. Ask them what they sense you leave unsaid.",
    otherHigher: "{other} feels more honest communication than you do. Ask yourself what you wish you could say, and whether you have told them.",
    bothLow: "Both of you feel that real things go unsaid. Begin by agreeing to say one true thing each this week.",
  },
  conflict_repair: {
    youHigher: "You feel arguments get resolved more than {other} does. Ask them which disagreement still feels open.",
    otherHigher: "{other} feels repair is happening more than you do. Ask yourself which one felt stopped instead of settled.",
    bothLow: "You both feel fights end without repair. Agree on one sentence you will each use to come back after one.",
  },
  mutual_honor: {
    youHigher: "You feel you honor {other} more than they feel honored. Ask when they feel smallest or most overlooked.",
    otherHigher: "{other} feels more honored than you do. Ask yourself whether you have told them what you need in order to feel respected.",
    bothLow: "Both of you feel honor is thin under stress. Choose a shared signal to pause before a conversation turns sharp.",
  },
  shared_vision: {
    youHigher: "You feel more aligned on the future than {other} does. Ask what picture of the future they are holding that you have not seen.",
    otherHigher: "{other} feels more aligned on the future than you do. Say what you have been assuming, and what you are not sure you agree on.",
    bothLow: "Neither of you feels the future has been settled. Start with one topic, and write down what you each want.",
  },
}

export const GAP_ALIGNED_STRONG = "You see this the same way, and you both see it as a strength. Say that to each other."
export const GAP_ALIGNED_MID = "You see this the same way. That is worth knowing, and it is solid ground to stand on together."

// ═══════════════════════════════════════════════════════════════════════
// CROSS-PILLAR PATTERNS — chosen by score logic in the engine
// ═══════════════════════════════════════════════════════════════════════
export interface PatternText { couple: string; readiness: string }

export const PATTERNS: Record<string, PatternText> = {
  giving_without_saying: {
    couple: "A pattern worth noticing: you give a lot, but you say little about what you need. Giving without saying can look like generosity from outside and feel like resentment from inside. {Sp} cannot meet a need they have never heard.",
    readiness: "A pattern worth noticing: you give generously, but you say little about what you need. In a marriage, giving without saying tends to turn into quiet resentment, because a spouse cannot meet a need they have never heard.",
  },
  close_but_fragile: {
    couple: "A pattern worth noticing: you and {sp} are open with each other, but conflict leaves a mark that is slow to repair. The closeness that makes you honest also makes fights feel personal. Faster repair would protect the closeness.",
    readiness: "A pattern worth noticing: you let people in, but conflict leaves a mark that is slow to repair. The closeness that makes you honest also makes disagreements feel personal. Learning faster repair now will protect that openness later.",
  },
  reliable_not_reachable: {
    couple: "A pattern worth noticing: {sp} can rely on you completely and still not feel they know you. Dependable is not the same as known. Both matter, and the second is the one that tends to be missing.",
    readiness: "A pattern worth noticing: people can rely on you completely and still not feel they know you. Dependable is not the same as known. A marriage needs both.",
  },
  truth_without_tenderness: {
    couple: "A pattern worth noticing: you say what is true, but it does not always arrive with honor attached. {Sp} may hear the accuracy and miss the care. The words are not the problem. The delivery is.",
    readiness: "A pattern worth noticing: you say what is true, but it does not always arrive with honor attached. People may hear the accuracy and miss the care. The words are not the problem. The delivery is.",
  },
  team_without_destination: {
    couple: "A pattern worth noticing: you and {sp} work well as a team, without a clear picture of where you are heading. A team with no destination ends up busy instead of going anywhere. A shared picture would give your teamwork a point.",
    readiness: "A pattern worth noticing: you work well alongside others, but your own picture of where you are heading is still thin. Cooperation is a strength. It works best when it is pointed somewhere.",
  },
  plans_without_partnership: {
    couple: "A pattern worth noticing: you have clear ideas about the future, but you tend to build them more on your own than together. A plan one person holds is a plan the other is just living inside. {Sp} needs to help write it.",
    readiness: "A pattern worth noticing: you have clear ideas about your future, but sharing real decisions is still hard for you. A marriage will ask you to hold your plans more loosely, and to build some of them with someone else.",
  },
  peace_by_silence: {
    couple: "A pattern worth noticing: arguments between you end well, but part of that peace may come from saying less. Quiet is not always repair. Check whether a few things have stopped being raised because it is easier not to.",
    readiness: "A pattern worth noticing: conflicts in your life tend to end smoothly, but part of that may come from saying less. Quiet is not always repair. Check whether a few things have stopped being raised.",
  },
  polite_not_costly: {
    couple: "A pattern worth noticing: you treat {sp} with respect, but your giving tends to stay within comfortable limits. Courtesy is real. Love in {mar} is eventually measured by what it costs you, not how it sounds.",
    readiness: "A pattern worth noticing: you treat people with respect, but your giving tends to stay within comfortable limits. Courtesy is real. Love in a marriage is eventually measured by what it costs, not how it sounds.",
  },
  even_shape: {
    couple: "Your answers are unusually even across the eight areas. There is no single crisis to point to and no single standout strength. A steady base like this is good. It also means growth will come from choosing one area on purpose, not from fixing an emergency.",
    readiness: "Your answers are unusually even across the eight areas. There is no single weak spot to point to and no single standout strength. A steady base like this is good. It also means growth will come from choosing one area on purpose.",
  },
  lopsided: {
    couple: "Your answers are lopsided: strong in some areas and thin in others. That is common, and it is useful. Strength in one area can be borrowed to support another, for example by using the honesty you already have to raise the area that is thin.",
    readiness: "Your answers are lopsided: strong in some areas and thin in others. That is common, and it is useful. Strength in one area can be borrowed to support another, for example by using the honesty you already have to work on the area that is thin.",
  },
  low_across: {
    couple: "Most areas are still early. That can feel heavy, so hold it gently. It is more often the sign of a season, such as a hard stretch, a transition, or never having been taught these skills, than a sign of what {mar} is. Start with one area, not eight.",
    readiness: "Most areas are still early. That can feel heavy, so hold it gently. It is far more often a sign of never having been taught these skills than of who you are. Start with one area, not eight, and bring it to a mentor.",
  },
  high_across: {
    couple: "Real strength shows up in nearly every area. Strong is not the same as finished. The couples who stay strong are the ones who keep asking where they have stopped looking.",
    readiness: "Real strength shows up across nearly every area. Strong is not the same as ready for everything marriage will bring. Keep asking where you have not yet been tested.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// OVERALL OPENING (one per band, per family)
// ═══════════════════════════════════════════════════════════════════════
export const OVERALL_OPENING: Record<'couple' | 'readiness', Record<FormationDescriptor, string>> = {
  couple: {
    christformed: "Taken as a whole, your answers describe {mar} built on strong ground in almost every area. This report is less about repair and more about staying honest, and protecting what is working.",
    rooted: "Taken as a whole, your answers describe {mar} that is genuinely working, with a handful of places where it holds less reliably. Those places are specific and findable, which is good news. The pages that follow name them.",
    growing: "Taken as a whole, your answers describe {mar} with real intention in it and inconsistent practice. Most of what is here is a matter of habit, not damage. Habits change when they are named and practiced, one at a time.",
    awakening: "Taken as a whole, your answers describe {mar} where much of the good intention has not yet turned into habit. That can feel discouraging to read. It is also useful to see clearly, and clear sight is where the work begins.",
    unengaged: "Taken as a whole, your answers describe {mar} under real strain in most areas. Please read this as a starting point and not a verdict. Strain this widespread usually calls for help from another person, and this report is meant to help you ask for it.",
  },
  readiness: {
    christformed: "Taken as a whole, your answers describe someone who already brings real strength into close relationships in nearly every area. This report is less about fixing and more about knowing what you carry, and keeping it honest.",
    rooted: "Taken as a whole, your answers describe someone who relates well to the people closest to them, with a few specific places that hold less reliably. Those places are findable, and it is far easier to work on them before a marriage.",
    growing: "Taken as a whole, your answers describe someone with real intention and inconsistent practice. Most of what is here is a matter of habit. Habits change when they are named and practiced, and you have time to practice.",
    awakening: "Taken as a whole, your answers show that many of the habits a marriage depends on are not yet habits for you. That can be uncomfortable to read. It is also the best time to see it, before anyone else is depending on them.",
    unengaged: "Taken as a whole, your answers show that most of the habits a marriage depends on are still early for you. Please read this as a starting point and not a verdict. Good guidance, and some time, can change a great deal.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// SMALL FRAMES
// ═══════════════════════════════════════════════════════════════════════
export const NEAR_NEXT = "At {score}, you are {n} {points} from the next level up. Small, steady practice would carry you across."
export const NEAR_PREV = "At {score}, this sits close to the line below it, and it can slip back when life gets busy. Treat it as something to protect."
export const CONSISTENT = "Your answers in this area were consistent from one question to the next, which makes the picture above easier to trust."

export const FLAG_SIGNIFICANT = "There is a notable gap in {name} between how you rated yourself in general and how you answered when a real situation made the cost clear. This is not an accusation. It is the most useful signal the assessment can produce, because the general answer shows who you want to be and the specific one shows what you do under pressure. Bring it to your Guide."
export const FLAG_MINOR = "Your answers in {name} did not fully line up: what you said about yourself in general was a little different from how you responded to a specific situation. Worth raising with your Guide."

export const FLAG_KEYWORD = "Your rating and your written answer in {name} pointed different ways. Your written answers were scored by a simple method this time, one that looks at how specific and candid the writing is and not at what it says about this area, so treat this as a question to talk through and not a finding."

export const FLAG_CONTRADICTION = "Two of your ratings in {name} pull against each other. {detail} That usually means one of them was answered quickly, or that this area is more mixed for you than one number can show. Worth a second look, and a good thing to raise with your Guide."

export const STRAIGHTLINE_NOTE = "You gave the same answer to nearly every rating question. When that happens, the ratings tell us less about you than usual, so what you wrote, and a conversation with your Guide, deserve more weight than the numbers here."

export const FLAG_DETAIL = "For example, you said \"{said}\" was {label}, while your written answer to a related question showed less of it."

// Week four of the first-month plan.
export const WEEK_FOUR: { couple: string; readiness: string } = {
  couple: "Sit down with {sp} for an hour. Read each other's list of where to begin, and tell each other one thing that changed this month and one thing that did not.",
  readiness: "Meet with a mentor or your Formation Guide. Bring this report, and tell them what you tried this month, what you noticed, and what you want to try next.",
}
