// lib/report/offline-depth.ts
//
// Two extra authored layers under the short portrait, for every area at every
// level. The taster and the full report both show them, because the taster is
// what decides whether someone goes on.
//
//   UNDERNEATH  what usually sits beneath what the short paragraph describes.
//               The root, told with grace. Written once for both families, so
//               it never names a spouse, a partner or a marriage.
//   AHEAD_COUPLE   what the next season looks like, for married and premarital
//                  readers. Uses the same tokens as the couple portraits:
//                  {sp} {Sp} {mar}.
//   AHEAD_READINESS the same for a single reader, written separately and
//                  forward looking. No tokens, never "your spouse".
//   LEAN        one sentence on where the score sits inside its level (lower
//               or upper third), written for both families.
//
// Same rules as offline-content.ts: plain English, no framework words, short
// sentences, the lower the score the more grace, never less. Nothing is
// assembled from fragments at render time.

import type { FormationDescriptor } from '@/types'
import type { CorePillar } from '@/lib/scoring/aggregate'
import type { Bank } from './offline-content'

// ═══════════════════════════════════════════════════════════════════════
// WHAT USUALLY SITS UNDERNEATH (both families)
// ═══════════════════════════════════════════════════════════════════════
export const UNDERNEATH: Bank = {
  covenant_faithfulness: {
    christformed: "Faithfulness this steady is usually learned, not born. Somewhere you saw a promise kept at real cost, or you were let down once and decided never to do that to anyone. Either way, your word became part of who you are. The quiet danger is pride in it, and a hard edge toward people whose word bends.",
    rooted: "The promise that bends usually bends for a reason that sounded fair at the time. You were tired, or things changed, or the other person had let you down first. Each reason was real. Together they teach you that a promise is firm until it becomes expensive.",
    growing: "A promise made in warm feeling often fades when the feeling does, because the feeling was doing the work. Commitment that rests on mood needs mood to continue. What is missing is usually a decision made in advance, one that does not ask how you feel on the day.",
    awakening: "Treating commitments as intentions often begins in a home or a season where promises were broken around you. If words did not hold for you, holding yours may never have felt safe or worth it. You learned to keep your options open. It protected you then. It keeps people at arm's length now.",
    unengaged: "Provisional promises usually grow from disappointment. If people you trusted did not follow through, staying free to leave can feel like the only safe way to love. It is a way of avoiding being hurt again. The price is that nobody can rest on your word, and you cannot rest on theirs.",
  },
  oneness: {
    christformed: "Sharing control this fully usually comes from trusting that the other person wants your good. You stopped needing to be the one steering. That trust was built slowly, through many small decisions that went well. It is easy to stop tending once it feels automatic.",
    rooted: "The area where you still decide first usually has a story. Maybe money was a source of fear when you were young, or you were once let down by someone else's choice. Taking charge felt safer. The habit outlived the reason.",
    growing: "Sharing the large decisions while running daily life alone often comes from being independent for a long time. Alone is efficient. Together is slower, and it asks you to explain yourself. Under pressure, efficiency wins, because it feels like protecting everyone.",
    awakening: "Holding your own corner is often a sign that you learned to rely on yourself. Needing someone else's agreement can feel like losing speed, or losing a say. Underneath may sit a fear that your view will be overruled, or that depending on someone invites disappointment.",
    unengaged: "Separate tracks usually begin as a way to avoid conflict. If deciding together once led to fights, deciding apart was a kind of peace. Over time it hardened into separate lives. The loneliness in it does not mean anything is broken beyond repair. It means the connection has been starved.",
  },
  sacrificial_love: {
    christformed: "Giving without a ledger usually comes from having been loved freely yourself. You do not have to earn your place, so you do not need to count. The risk lies in your own limits. People who give like this often ignore their tiredness until it speaks through a short temper or a sudden coldness.",
    rooted: "The ledger tends to open around one particular kind of giving, such as time, money, or being the one who always adapts. You may be fine for months, and then one more unreturned effort tips it. The count is rarely about that last thing. It is about everything that went unnamed before it.",
    growing: "Mentioning what went unreturned often comes from a need to be seen. You gave quietly for a long time, and no one noticed. The receipt is a way of asking to be acknowledged. It would be kinder, and more effective, to ask for the acknowledgement directly.",
    awakening: "Giving with strings usually has an old source: love that had to be earned. If you learned that affection followed performance, then giving always carried an invoice. You may not know you are sending one. The other person usually does.",
    unengaged: "Giving shaped by what comes back is often learned in a place where love was conditional. Being generous without a return can feel dangerous, like handing over power. The result is a quiet standoff where both sides watch the balance. The way out begins with noticing that you are watching.",
  },
  intimacy: {
    christformed: "Being known this fully usually follows an experience of being loved after being seen at your worst. That is what made hiding unnecessary. It can fade without notice, because comfort feels like closeness. Depth needs fresh questions, even after years.",
    rooted: "The room you keep closed often holds something you once showed and were hurt for. Perhaps you were mocked, or dismissed, or simply not understood. The door closed to protect a tender place. It is usually smaller inside than you fear, and lonelier outside than you admit.",
    growing: "Sharing when asked, and not before, is often a sign of waiting for permission. Somewhere you learned that your inner life is a burden unless someone requests it. So you wait to be invited. People close to you may be waiting for the same thing from you.",
    awakening: "Presenting an edited version often begins with being the capable one. Somewhere your struggles became inconvenient to others, or you decided you could not afford them. Competence became a mask that is hard to remove, because everyone has come to rely on it.",
    unengaged: "Keeping your struggles private, even from those closest to you, often follows an experience of being shamed for need. Hiding is a sensible response to that. It is also lonely, and that loneliness tends to deepen inside close relationships, where it is least expected.",
  },
  truthful_communication: {
    christformed: "Honesty that is both true and kind usually takes years to learn. You have probably been on both sides of it: hurt by a harsh truth and starved by a soft lie. That is what keeps your honesty gentle. The danger is comfort. Familiarity can quietly turn candour into bluntness.",
    rooted: "The conversation you avoid is usually tied to a fear about what it will start. Perhaps it once led to a fight that lasted for days. So you wait for a better time, and the better time does not come. The topic keeps returning because it never got finished.",
    growing: "Telling the truth only when asked often comes from wanting to keep the peace. Raising something unprompted feels like starting trouble. But truths held back do not disappear. They come out as tone, a sigh, a joke with an edge. That is harder to receive than the plain words would have been.",
    awakening: "Hints and silences often start in places where plain speech was punished or ignored. You learned to send messages sideways and hope they were received. It is an exhausting way to communicate, for you and for the person who has to decode it.",
    unengaged: "Staying at the surface usually follows a belief that real thoughts are unwelcome. If honesty once cost you a relationship or a peace you valued, silence became the price of belonging. But the cost of silence builds slowly, and it tends to arrive all at once.",
  },
  conflict_repair: {
    christformed: "Repair this reliable usually comes from a settled belief that the relationship matters more than being right. You have likely learned that apologising first does not lose anything. The risk is skipping the hard part. Quick repair can smooth over the real issue and leave it waiting.",
    rooted: "The argument that keeps returning usually has a deeper cause than the topic of the day. It is often about being respected, being chosen, or being heard. Settling the surface leaves the cause untouched. That is why it returns in a new outfit.",
    growing: "Late repair often comes from pride that has learned to look like waiting. You are not unsure how to apologise. You are waiting to be sure it will be met well, or for the other person to move first. The delay feels safe. It is usually the most costly part of the argument.",
    awakening: "Stopping a fight without ending it is often a learned skill. If conflict at home was loud or dangerous, quiet meant safety. You learned to end the noise and not to solve the problem. The habit protects you from heat and keeps you from resolution.",
    unengaged: "Distance after disagreement usually has a long history. If arguments once felt unsafe, or ended without anyone listening, staying out of each other's way began to feel kinder than trying. It is a lonely kind of peace. It can be broken gently, and it does not take a speech.",
  },
  mutual_honor: {
    christformed: "Honor that holds under pressure usually comes from seeing the other person as a gift and not as a project. You stopped trying to improve them and started trying to know them. That changes how you speak about them when they are absent. It is worth protecting.",
    rooted: "The moment honor slips usually has a trigger: stress, an audience, or a particular old argument. The eye roll or the joke comes out before you decide. It is a reflex that was formed long before this relationship. It can be changed, and it responds to attention.",
    growing: "Respect that frays under pressure often means respect that depends on things going well. On calm days it is easy. When you are tired, it takes effort. Honor becomes steady only when it stops depending on how the other person is behaving.",
    awakening: "Correcting more than championing often comes from a lifetime of being the one who notices what is wrong. That was useful at work, or at home growing up. In close relationships it makes the other person feel assessed instead of loved.",
    unengaged: "Honor that is not yet a habit often reflects a home where it was not modelled. If criticism or sarcasm was the family language, kindness may feel unnatural or even weak. That can be learned, one small act at a time, and every single act counts at once.",
  },
  shared_vision: {
    christformed: "A vision shared this fully was built by repeatedly talking about unglamorous things: money, family, time, calling. You treated these as ongoing, not settled. The risk is assuming that a plan agreed years ago still holds. People change, and so do circumstances.",
    rooted: "The thin area, whether money, extended family, or the next ten years, is often the one that feels risky to raise. It touches fear or loyalty or old wounds. So it waits. A difference left unspoken becomes harder, not easier, to discuss once a decision forces it open.",
    growing: "Having talked about the big picture and not the details is common. The big picture is inspiring. The details are where disagreement lives, so they get postponed. Each side fills the gaps with its own assumptions, and the assumptions rarely match.",
    awakening: "Hoping the future will become clear on its own is often a way of avoiding a conversation that might reveal a difference. It feels kinder to wait. But decisions keep being made in the meantime, and each one quietly assumes an agreement that was never checked.",
    unengaged: "Heading toward futures that have not been reconciled usually means the hard conversation has felt too risky to start. Money, family and calling carry strong feelings, and difference can feel like danger. But the longer it waits, the more everyone builds on guesses.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// WHAT THE NEXT SEASON LOOKS LIKE · COUPLE (married and premarital)
// Tokens: {sp} {Sp} {mar}
// ═══════════════════════════════════════════════════════════════════════
export const AHEAD_COUPLE: Bank = {
  covenant_faithfulness: {
    christformed: "Staying well means making your reliability visible. Say aloud to {sp} what you have kept, and thank them for trusting it. Faithfulness that is never named gets taken for granted, and what is taken for granted gets less care. A short, regular check keeps it alive.",
    rooted: "The next level is one promise treated as final. Find the kind that gets renegotiated, and make a plain decision with {sp} that you will not bargain with it again. When it is inconvenient, you keep it, and tell them how it felt. {Sp} will start to rest.",
    growing: "The next level is deciding in advance. Choose one commitment to {sp} and settle it on a calm day, so that on the hard day you are not deciding, only doing. {Sp} will notice the difference first in what they stop checking.",
    awakening: "The next level is smaller than a vow. It is one promise this week that you keep when you would rather not. Tell {sp} before you make it, and tell them after you keep it. A record of small kept words is how trust is rebuilt.",
    unengaged: "A first step is naming one promise honestly to {sp}. Say what you said, what you did, and what you will do now. This is not a pledge to be perfect. One plain, kept thing is a solid stone to build on.",
  },
  oneness: {
    christformed: "Staying well means protecting the habit of asking. Choose one decision this month that you could make alone and bring it to {sp} anyway. Joined living survives busy seasons by being practised in small things, not only in large ones.",
    rooted: "The next level is giving up first say in the one area where you still take it. Tell {sp} that this is where you tend to decide alone, and that you would like to decide it together. The relief for {sp} is usually larger than the effort for you.",
    growing: "The next level is bringing the small decisions across. Pick one daily area that runs in parallel and make it shared for a month. It will feel slower. It will also mean that when stress comes, you are already used to turning toward {sp}, not away.",
    awakening: "The next level is asking {sp} before, not after, a decision that affects them. One decision a week is enough. You are not giving up your say. You are letting {sp} have one, and that changes how living together feels.",
    unengaged: "A first step is a conversation about one shared thing, such as money or time, that has been run on separate tracks. Keep it short and without blame. The aim is not to solve it. It is to sit in the same place and look at it together.",
  },
  sacrificial_love: {
    christformed: "Staying well means letting {sp} give to you. Ask for one thing this week, and accept what they offer without improving it. Love that only gives eventually wears out. Love that also receives lasts, and it honors the other person's wish to give.",
    rooted: "The next level is finding the moment the count begins. This week, notice when you start tallying, and say so to {sp} without accusation. Tell them you are keeping score on this and you do not want to. Said early, it rarely turns into resentment.",
    growing: "The next level is a gift with no receipt. Choose one thing to do for {sp} this week and tell no one, including them. Notice how hard it is to let it go unremarked. That discomfort is where the ledger is kept, and it loosens each time.",
    awakening: "The next level is naming the strings. Tell {sp} one place where you give hoping for something back, and say what that something is. Asking plainly is more honest than hinting, and it gives them a real chance to answer.",
    unengaged: "A first step is a single act of giving that expects nothing. Make it small, and make it private. Afterwards, notice what you wanted. That wanting tells you where love once had to be earned, and there is no shame in it.",
  },
  intimacy: {
    christformed: "Staying well means asking new questions. After years together, it is easy to assume you know {sp}. This week ask one thing you have never asked, and listen to the whole answer. Closeness grows where curiosity continues.",
    rooted: "The next level is opening one closed room, a little. Choose the smallest thing behind the door and tell {sp} about it in two or three sentences. You do not need to explain it fully. Letting them see that the door exists is a large step.",
    growing: "The next level is volunteering. This week, tell {sp} one thing about your inner life before they ask: a worry, a need, a small joy. Starting the conversation yourself changes how {sp} knows you, from reported to shared.",
    awakening: "The next level is a small, unedited moment. Tell {sp} one honest feeling that is not capable or positive, such as being tired, unsure, or hurt. You do not have to resolve it. Being seen without the polish is the whole point.",
    unengaged: "A first step is saying one true thing about your inner life, first to yourself and then to {sp}. Begin with the smallest honest sentence you can find. The first telling is the hardest, and it usually brings more relief than risk.",
  },
  truthful_communication: {
    christformed: "Staying well means checking how honesty lands. After a hard conversation, ask {sp} whether it was said in a way they could take in. Truth that is received builds closeness. Truth that is only delivered can slowly wear it down.",
    rooted: "The next level is starting the conversation you keep avoiding. Pick the topic, choose a calm time, and open with one sentence: there is something I have not said. You do not need the whole speech. The first sentence is the part that matters.",
    growing: "The next level is saying it before it comes out sideways. When you notice irritation, name the thing underneath, in plain words, within a day. {Sp} will respond to what you meant and not to the tone, and arguments get shorter.",
    awakening: "The next level is replacing one hint with one sentence. Next time you sigh or go quiet, say what the sigh means. A single plain statement costs less than the guessing it replaces, and {sp} will be able to answer it.",
    unengaged: "A first step is one honest sentence to {sp} about something real, even something small. Start with a feeling, not an accusation. The gap between what you think and what you say closes one sentence at a time.",
  },
  conflict_repair: {
    christformed: "Staying well means asking whether repair has reached the root. After the next quick reconciliation, ask {sp} whether there is anything you have not actually settled. Real peace includes the thing underneath the argument.",
    rooted: "The next level is naming the trigger instead of the latest argument. Together with {sp}, say what keeps coming back, in one sentence. Once the pattern has a name, it loses much of its power to surprise either of you.",
    growing: "The next level is moving first and sooner. Next time, decide to be the one who reaches out within the hour, before pride finishes its argument. You do not need to concede everything. A short sentence like I want us to be okay is enough.",
    awakening: "The next level is returning to an argument that only stopped. Choose one that was never settled, and ask {sp} when you could talk about it calmly. Being the one who comes back changes what raising a problem means in your home.",
    unengaged: "A first step is saying aloud that there is a distance. You need no solution. Tell {sp} you have noticed it and that you would like it smaller. That one sentence, said kindly, begins repair.",
  },
  mutual_honor: {
    christformed: "Staying well means checking how you speak about {sp} when they are absent. This week, notice one moment where you could say something generous, and do. Honor in private is what keeps honor in public real.",
    rooted: "The next level is catching the reflex. Learn the specific condition where honor slips, such as stress or an audience, and decide in advance what you will do instead. When it slips anyway, apologise to {sp} without explaining.",
    growing: "The next level is steadiness under pressure. Choose one tense situation and practise one respectful response, such as lowering your voice or pausing before you answer. {Sp} will start to feel that your kindness no longer has a limit they must find.",
    awakening: "The next level is making honor a habit with one small repeated act. Each day, say one specific, true thing you respect about {sp}. Do it in front of others at least once this week. Habits made of small acts last longer than good intentions.",
    unengaged: "A first step is one act of honor today. Say thank you for something specific, or speak well of {sp} to someone else. It will feel small. It is not. Every single act counts right away, and {sp} will feel the change before you do.",
  },
  shared_vision: {
    christformed: "Staying well means reviewing the plan on a schedule. Once a year, sit down with {sp} and ask what has changed in money, family, and calling. A vision that is revisited stays shared. One that is only assumed slowly drifts apart.",
    rooted: "The next level is working on the thin area. Pick the one topic that feels least discussed, whether money, extended family, or the next ten years, and set a time to talk with {sp}. Come to listen first. The point is to see the same picture.",
    growing: "The next level is turning the big picture into specifics. Write down, separately, what you each expect in one area, such as where you will live or how you will handle money. Then compare. The differences you find are the work, and they are much easier to find now.",
    awakening: "The next level is a deliberate conversation. Set aside an hour with {sp} and talk through one area of the future you have only assumed. Do not try to finish it. Agreeing to keep talking is already progress.",
    unengaged: "A first step is asking {sp} one question about the future that you have not asked, such as how they picture the next five years. Listen without defending. Knowing the difference is the first thing that can be built on.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// WHAT THE NEXT SEASON LOOKS LIKE · READINESS (single reader, no tokens)
// ═══════════════════════════════════════════════════════════════════════
export const AHEAD_READINESS: Bank = {
  covenant_faithfulness: {
    christformed: "Staying well means making your reliability known to yourself. Notice one promise you keep this month that nobody would have checked. That is the habit a marriage will lean on. Keep it honest, and keep it small enough to continue.",
    rooted: "The next level is one promise treated as final. Find the kind you tend to renegotiate, and decide now that it is not up for bargaining. Keep it when it becomes inconvenient, and notice what that was like.",
    growing: "The next level is deciding in advance. Choose one commitment, settle it on a calm day, and let the hard day find the decision already made. Over time you will learn what your word is worth when the feeling has gone.",
    awakening: "The next level is smaller than a vow. It is one promise this week, to a friend or a family member, that you keep even when you would rather not. Tell them first, and tell them afterward. A record of small kept words is how trust is built.",
    unengaged: "A first step is naming one promise honestly. Write down what you said, what you did, and what you will do now. This is not a pledge to be perfect. One plain kept thing is a foundation, and it can be laid long before any wedding.",
  },
  oneness: {
    christformed: "Staying well means keeping the habit of asking. Choose one decision this month that you could make alone and bring it to someone you trust anyway. Sharing control is a muscle, and it stays strong by use.",
    rooted: "The next level is handing over first say in the one area where you still take it. Tell someone close that this is where you tend to decide alone, and ask them to push back next time. It is easier to learn this now than later with a spouse.",
    growing: "The next level is bringing small decisions across. Pick one everyday matter you usually handle alone, and ask someone else's view before you decide, for a month. It will feel slower. It will also build the habit marriage tests the most.",
    awakening: "The next level is asking before, not after. Next time a decision touches someone else, check their view first, and take it seriously. You are not giving up your say. You are practising letting another person have one.",
    unengaged: "A first step is one shared decision. Pick something small, such as where to eat or how to spend a Saturday, and let the other person choose, or choose together. Notice what it felt like to give up the steering.",
  },
  sacrificial_love: {
    christformed: "Staying well means learning to receive. Ask someone for help this week, and accept what they offer without fixing it. Love that can only give wears out. Love that also receives lasts, and a marriage needs both.",
    rooted: "The next level is finding the moment the count begins. This week, notice when you begin tallying, and say so plainly to someone you trust. Said early, a count rarely grows into bitterness.",
    growing: "The next level is a gift with no receipt. Do one kind thing for someone this week and tell nobody. Notice how hard it is to let it go unremarked. That discomfort is where the ledger lives, and it loosens each time.",
    awakening: "The next level is naming the strings. Think of one place where you give hoping for something back, and write down what you hope for. Asking plainly, when the time comes, is more honest than hinting.",
    unengaged: "A first step is one act of giving that expects nothing. Make it small and private. Afterwards, notice what you wanted back. That wanting tells you where love once had to be earned, and it is no cause for shame.",
  },
  intimacy: {
    christformed: "Staying well means staying curious. Ask a close friend one question you have never asked, and listen to the whole answer. Depth does not stay by itself. It grows where curiosity continues.",
    rooted: "The next level is opening one closed room, a little. Choose the smallest thing behind the door and tell one trusted person about it in a few sentences. Letting someone see that the door exists is a large step.",
    growing: "The next level is volunteering. This week, tell someone close one true thing about your inner life before they ask. Starting the conversation yourself is the skill a marriage will need most.",
    awakening: "The next level is one unedited moment. Tell a trusted person one honest feeling that is not capable or positive, such as being tired, unsure, or hurt. You do not have to resolve it. Being seen without the polish is the whole point.",
    unengaged: "A first step is saying one true thing about your inner life, first to yourself and then to one safe person. Begin with the smallest honest sentence you can find. It usually brings more relief than risk.",
  },
  truthful_communication: {
    christformed: "Staying well means checking how your honesty lands. After a hard conversation, ask the other person whether it was said in a way they could take in. Truth that is received builds closeness. Truth that is only delivered wears it down.",
    rooted: "The next level is starting the conversation you keep avoiding. Pick the topic, choose a calm time, and open with one sentence: there is something I have not said. The first sentence is the part that matters.",
    growing: "The next level is saying it before it comes out sideways. When you notice irritation, name the thing underneath, in plain words, within a day. People will answer what you meant, not your tone.",
    awakening: "The next level is replacing one hint with one sentence. Next time you sigh or go quiet, say what the sigh means. One plain statement costs less than the guessing it replaces.",
    unengaged: "A first step is one honest sentence to someone safe about something real, even something small. Start with a feeling, not an accusation. The gap between what you think and what you say closes one sentence at a time.",
  },
  conflict_repair: {
    christformed: "Staying well means asking whether repair has reached the root. After the next quick reconciliation, ask whether there is anything you have not actually settled. Real peace includes what lies under the argument.",
    rooted: "The next level is naming the trigger instead of the latest argument. Think about what keeps coming back, and say it in one sentence to someone you trust. Once a pattern has a name, it loses its power to surprise you.",
    growing: "The next level is moving first and sooner. Next time, decide to reach out within the hour, before pride finishes its argument. A short sentence like I want us to be okay is enough.",
    awakening: "The next level is returning to an argument that only stopped. Choose one that was never settled, and ask when you could talk about it calmly. Being the one who comes back builds the habit a marriage will ask for.",
    unengaged: "A first step is staying one minute longer in a hard conversation than you normally would. You need no solution. Say that you need a moment, and that you will come back. Then come back.",
  },
  mutual_honor: {
    christformed: "Staying well means noticing how you speak about people when they are absent. This week, find one moment to say something generous, and say it. Honor in private is what keeps honor in public real.",
    rooted: "The next level is catching the reflex. Learn the specific condition where honor slips, such as stress or an audience, and decide in advance what you will do instead. When it slips anyway, apologise without explaining.",
    growing: "The next level is steadiness under pressure. Choose one tense situation and practise one respectful response, such as lowering your voice or pausing before you answer. Kindness that holds when you are tired is the kind a marriage needs.",
    awakening: "The next level is making honor a habit with one small repeated act. Each day, say one specific, true thing you respect about someone close. Do it in front of others at least once this week.",
    unengaged: "A first step is one act of honor today. Say thank you for something specific, or speak well of someone to a third person. It will feel small, and it is not. Every single act counts right away.",
  },
  shared_vision: {
    christformed: "Staying well means keeping your own vision open to being shaped. Talk through one part of your future, such as money or calling, with someone who knows you well, and ask what they see that you do not.",
    rooted: "The next level is working on the thin area. Pick the topic you have thought least about, whether money, family, or the next ten years, and write down what you actually want. A person who knows their own picture can share it.",
    growing: "The next level is turning the big picture into specifics. Write down what you would do about money, where you would live, and how you would handle family. Vague hopes are hard to bring to another person.",
    awakening: "The next level is a deliberate conversation with yourself first. Set aside an hour to write what you want from the next ten years, then share it with someone you trust. Do not try to finish it.",
    unengaged: "A first step is one question about the future that you have avoided, such as what you want your money to be for. Write the answer you actually believe, not the one you think you should give. Knowing it is the first thing that can be built on.",
  },
}

// ═══════════════════════════════════════════════════════════════════════
// WHERE THE SCORE SITS INSIDE ITS LEVEL (both families)
// `low` = lower third, `high` = upper third. The middle gets nothing, and so
// does a score within 3 points of an edge (the position note speaks there).
// ═══════════════════════════════════════════════════════════════════════
export const LEAN: Record<CorePillar, Record<FormationDescriptor, { low: string; high: string }>> = {
  covenant_faithfulness: {
    christformed: { low: "You sit in the lower part of this level. Your word is firm, and it keeps its strength by being named and kept.", high: "You sit near the top of the range. Few people keep their word this reliably. Guard it from becoming something you assume." },
    rooted: { low: "You sit in the lower part of this level, so the promise that bends may bend more often than you notice.", high: "You sit in the upper part of this level. Your word holds nearly everywhere. One kind of promise remains." },
    growing: { low: "You sit in the lower part of this level, where feeling still decides whether a promise gets kept.", high: "You sit in the upper part of this level, so more promises survive a change of mood than you may give yourself credit for." },
    awakening: { low: "You sit in the lower part of this level, where most commitments still move with how you feel. That can change one promise at a time.", high: "You sit in the upper part of this level, and a few of your promises are already firm." },
    unengaged: { low: "Your score sits at the low end. It describes where you are standing, not what you are made of. Small kept promises begin the climb.", high: "You sit at the upper end of this level. One kept promise at a time would carry you across." },
  },
  oneness: {
    christformed: { low: "You sit in the lower part of this level. Sharing real decisions is a strength here, and it needs tending in busy seasons.", high: "You sit near the top of the range. Decisions are truly shared. Keep asking, even when it is faster not to." },
    rooted: { low: "You sit in the lower part of this level, so the area where you decide first may be wider than it seems.", high: "You sit in the upper part of this level. Nearly everything is shared already. One area still leans your way." },
    growing: { low: "You sit in the lower part of this level, where daily life still runs mostly in parallel.", high: "You sit in the upper part of this level, so much of daily life is already shared." },
    awakening: { low: "You sit in the lower part of this level, where you mostly run your own corner.", high: "You sit in the upper part of this level, and shared decisions are already more than the exception." },
    unengaged: { low: "Your score sits at the low end, which often reflects a long habit of handling things alone. The habit can loosen with one shared decision.", high: "You sit at the upper end of this level. Sharing one more decision would change the picture." },
  },
  sacrificial_love: {
    christformed: { low: "You sit in the lower part of this level. Your giving is generous, and it needs rest built in.", high: "You sit near the top of the range. You give without counting. Make sure you also let yourself receive." },
    rooted: { low: "You sit in the lower part of this level, where the ledger opens a little more often than you would like.", high: "You sit in the upper part of this level. The tally rarely starts. When it does, it is worth catching early." },
    growing: { low: "You sit in the lower part of this level, where unreturned giving is noticed quickly.", high: "You sit in the upper part of this level, so a good deal of your giving is already free." },
    awakening: { low: "You sit in the lower part of this level, where most giving carries an expectation.", high: "You sit in the upper part of this level, and some of your giving already comes with no string at all." },
    unengaged: { low: "Your score sits at the low end, which often follows a time when love had to be earned. There is room to give freely and be safe.", high: "You sit at the upper end of this level. One gift with no receipt would move you." },
  },
  intimacy: {
    christformed: { low: "You sit in the lower part of this level. Being known is real, and it needs fresh questions to stay deep.", high: "You sit near the top of the range. You are truly known. Keep making room for it to deepen." },
    rooted: { low: "You sit in the lower part of this level, where the closed rooms are larger than you may admit.", high: "You sit in the upper part of this level. Most doors are open. One or two are not." },
    growing: { low: "You sit in the lower part of this level, where you share mostly when asked.", high: "You sit in the upper part of this level, so you already volunteer more than you realise." },
    awakening: { low: "You sit in the lower part of this level, where the edited version leads.", high: "You sit in the upper part of this level, and parts of the real you are already visible." },
    unengaged: { low: "Your score sits at the low end, which often follows being shamed for need. Safety here is built slowly, and it can be built.", high: "You sit at the upper end of this level. One honest sentence about your inner life would help." },
  },
  truthful_communication: {
    christformed: { low: "You sit in the lower part of this level. Your honesty is real, and it stays kind by being checked.", high: "You sit near the top of the range. You say the true thing and say it well. Watch for bluntness as familiarity grows." },
    rooted: { low: "You sit in the lower part of this level, so the conversation you avoid may be bigger than it feels.", high: "You sit in the upper part of this level. You are direct nearly everywhere. One topic remains." },
    growing: { low: "You sit in the lower part of this level, where hard truths mostly wait until asked.", high: "You sit in the upper part of this level, so you already raise some hard things before anyone asks." },
    awakening: { low: "You sit in the lower part of this level, where hints and silences carry much of the meaning.", high: "You sit in the upper part of this level, and plain sentences are already replacing some hints." },
    unengaged: { low: "Your score sits at the low end, which often follows a time when plain speech was unsafe. One true sentence is a real beginning.", high: "You sit at the upper end of this level. A single honest sentence would carry you across." },
  },
  conflict_repair: {
    christformed: { low: "You sit in the lower part of this level. Repair is reliable here, and worth checking for depth.", high: "You sit near the top of the range. Your arguments truly end. Make sure the root is reached too." },
    rooted: { low: "You sit in the lower part of this level, where the repeating argument lingers longer than you would choose.", high: "You sit in the upper part of this level. Almost every disagreement gets repaired. One keeps returning." },
    growing: { low: "You sit in the lower part of this level, where repair still comes late.", high: "You sit in the upper part of this level, so the delay before repair is already shrinking." },
    awakening: { low: "You sit in the lower part of this level, where fights mostly stop instead of end.", high: "You sit in the upper part of this level, and some arguments are already being finished." },
    unengaged: { low: "Your score sits at the low end, which often follows arguments that never felt safe. Repair can start very small.", high: "You sit at the upper end of this level. One honest sentence after a disagreement would help." },
  },
  mutual_honor: {
    christformed: { low: "You sit in the lower part of this level. Honor is real, and it holds best when you speak well in private.", high: "You sit near the top of the range. Honor holds under strain. Keep an eye on how you talk when no one is listening." },
    rooted: { low: "You sit in the lower part of this level, so the moments where honor slips may be more frequent than you think.", high: "You sit in the upper part of this level. Honor is the default. One trigger still gets past it." },
    growing: { low: "You sit in the lower part of this level, where respect shows mostly on calm days.", high: "You sit in the upper part of this level, so respect already survives some pressure." },
    awakening: { low: "You sit in the lower part of this level, where correcting comes before championing.", high: "You sit in the upper part of this level, and championing is already a habit in some moments." },
    unengaged: { low: "Your score sits at the low end, which often follows a home where honor was not shown. Each small act counts at once.", high: "You sit at the upper end of this level. One practised act of honor a day would move you." },
  },
  shared_vision: {
    christformed: { low: "You sit in the lower part of this level. Your picture of the future is clear, and it needs regular review.", high: "You sit near the top of the range. The future is clearly pictured. Keep revisiting it as life changes." },
    rooted: { low: "You sit in the lower part of this level, so the thin area may be thinner than it looks.", high: "You sit in the upper part of this level. Your direction is mostly clear. One area has not been looked at." },
    growing: { low: "You sit in the lower part of this level, where the details are still mostly assumed.", high: "You sit in the upper part of this level, so some details are already being settled." },
    awakening: { low: "You sit in the lower part of this level, where the real conversation has not yet begun.", high: "You sit in the upper part of this level, and the conversation is close to starting." },
    unengaged: { low: "Your score sits at the low end, which often follows a conversation that felt too risky to begin. One question is enough.", high: "You sit at the upper end of this level. Asking one real question about the future would move you." },
  },
}
