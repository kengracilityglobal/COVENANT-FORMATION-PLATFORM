// scripts/demo-answer-pool.ts
// Written answers for the demo accounts (see scripts/generate-demo-seed.ts).
// Two first-person paragraphs per pillar per level. {SP} is replaced with the
// person in the story ("my wife", "my fiancé", "my brother"...). Invented.

export type Level = 'christformed' | 'rooted' | 'growing' | 'awakening' | 'unengaged'
export const LEVELS: Level[] = ['christformed', 'rooted', 'growing', 'awakening', 'unengaged']

const P: Record<string, Record<Level, [string, string]>> = {
  covenant_faithfulness: {
    christformed: ["A client called with a better offer the same afternoon I had promised {SP} I would be at the school event. I turned it down, told {SP} about it later, and felt no regret.", "I had promised to help {SP}'s family move on a Saturday when I was exhausted. I went, stayed until the end, and did not mention how tired I was."],
    rooted: ["I told {SP} I would handle the tax paperwork by Friday. It got hard and I nearly let it go, but I finished it Sunday night and told them it was late.", "I promised to call {SP} every evening while I was travelling. I missed two nights, and I said so the next day instead of hoping it went unnoticed."],
    growing: ["I said I would be home for dinner and a project ran over. I texted late, kept working, and told myself that {SP} would understand.", "I promised to cut back on my phone in the evenings. It held for a week, then slowly slipped, and neither of us mentioned it."],
    awakening: ["I agreed to go to {SP}'s event, then found a reason to cancel the day before. It was not the first time I had done that, and I called it a scheduling problem.", "I told {SP} I would stop spending on things we had agreed to avoid. I kept doing it quietly and hoped it would not show up on the statement."],
    unengaged: ["I rarely treat what I tell {SP} as binding. If something better comes up, the earlier plan just quietly disappears and I deal with the reaction later.", "I cannot think of a time I kept a promise to {SP} when it actually cost me something. I usually find a reason it no longer applies."],
  },
  oneness: {
    christformed: ["We were choosing between two cities for work. I laid out my thinking, asked {SP} to challenge it, and we decided together after two long evenings.", "When a family expense came up, I called {SP} before saying yes to anyone. It felt natural, not like asking permission."],
    rooted: ["We disagreed about taking on a new commitment. We talked it through and landed somewhere we both owned, though I had already half-decided.", "I usually check with {SP} before big purchases. Last month I bought something small without asking and told them straight away."],
    growing: ["A decision about our weekend came up and I just made it, assuming {SP} would not mind. They said it was fine, but I noticed I had not asked.", "We make the big calls together, but most daily choices I handle myself and tell {SP} about afterward, if I remember."],
    awakening: ["I accepted an invitation for both of us without checking. When {SP} was surprised, I said it was easier than going back and forth.", "Money decisions mostly happen on my side. {SP} finds out through a statement or a passing comment, and I have not wanted to change that."],
    unengaged: ["I decided on the move alone and told {SP} after it was settled. I told myself it was simpler, and I knew they would object.", "We mostly live parallel lives. Decisions, plans and money are handled separately, and neither of us has pushed to change it."],
  },
  sacrificial_love: {
    christformed: ["{SP} was sick for a week. I took over everything, rearranged my work, and did not think of it as a sacrifice, only as what the week needed.", "I gave up a trip I had saved for so we could cover a family emergency. I did not bring it up afterward, and it did not feel like a loss."],
    rooted: ["I stayed up late helping {SP} with a deadline that was not mine. I was tired the next day, but I would do it again.", "I covered an expense for {SP}'s family without being asked. It took me a few days to stop thinking about the amount."],
    growing: ["I helped {SP} with a move, but I mentioned afterward how much of my weekend it took. They heard it, and I wish I had not said it.", "I do a lot for {SP}, and I notice when it is not acknowledged. I try not to bring it up, and it comes out in small remarks."],
    awakening: ["I will help {SP} when it is convenient. When I am tired or busy, their needs feel like an interruption, and I let that show.", "I keep a rough tally of who has done what. When it tips against me, I get quieter and less generous for a few days."],
    unengaged: ["I give when I expect something back. If {SP} does not return it, I stop, and I have never really asked myself whether that is love.", "I cannot remember the last time I gave something up for {SP} without it being traded for something. I mostly protect my time."],
  },
  intimacy: {
    christformed: ["I told {SP} about a mistake at work that I was ashamed of, before anyone else knew. It was uncomfortable, and it brought us closer than I expected.", "When I felt distant, I said so plainly instead of waiting for it to pass. {SP} listened and we spent the evening talking."],
    rooted: ["I told {SP} about a fear I had carried for years. I almost stopped halfway, but I finished and I am glad I did.", "I share most things openly, but there is one old failure I have never fully explained. {SP} has sensed it, and I have not opened that door."],
    growing: ["When I was struggling at work, I told {SP} it was a bit slow. It was months before I admitted how bad it really was.", "I open up when asked directly. Left to myself, I would carry things alone, and {SP} usually has to notice something is wrong first."],
    awakening: ["I show {SP} the manageable version of how I am doing. The real version, the worry and the shame, stays with me.", "When {SP} tries to talk about something vulnerable, I tend to change the subject or find a task. I do not enjoy that about myself."],
    unengaged: ["I have not told {SP} what I am actually afraid of. I am not sure I have said it aloud to anyone, including myself.", "Most of what is real in my life stays private. {SP} knows my schedule and my opinions, but not much of what is underneath."],
  },
  truthful_communication: {
    christformed: ["I told {SP} I was not comfortable with a financial decision, even though it was awkward. I said it plainly and kindly, and we sorted it out that night.", "I admitted I had been less than honest about how I spent a day. It was embarrassing, but I told {SP} the full version."],
    rooted: ["I told {SP} something hard about a habit that was affecting us. I rehearsed it a little too much, but I said it clearly.", "Usually I say what is true. Occasionally I soften it. Last week I caught myself doing it and went back to say the rest."],
    growing: ["I needed to tell {SP} I was uncomfortable lending money to their cousin. I joked about it first and said it seriously only days later.", "I am honest when asked directly. When something is bothering me, it tends to come out as irritation rather than words."],
    awakening: ["I avoid hard topics by giving answers that are technically true. {SP} often realises later that I did not say what I meant.", "I hint and sigh instead of saying what is wrong. I expect {SP} to pick it up, and I am frustrated when they do not."],
    unengaged: ["I mostly say what keeps the peace. What I actually think stays unsaid, and {SP} is left guessing at it.", "I cannot recall the last time I told {SP} something uncomfortable and true. It feels safer to keep it all to myself."],
  },
  conflict_repair: {
    christformed: ["After a sharp argument, I went to {SP} the same evening and named my part in it. We resolved the real issue before bed.", "We disagreed about money, and I raised it again the next day, calmer, to finish it properly. It took an hour and it was worth it."],
    rooted: ["We argued about plans. I stayed upset for a while but reached out that evening, and we talked it through.", "Most arguments get repaired. One recurring topic keeps lingering, and I know I avoid naming what is really behind it."],
    growing: ["After our argument I knew I should apologise, but I waited until {SP} moved first. It took two days, which was longer than either of us wanted.", "I usually repair things eventually, after a stretch of coldness. Pride gets in the way more than I would like to admit."],
    awakening: ["We argued about money and then barely spoke for days. It ended when {SP} made tea one evening, and we never really discussed it.", "Fights tend to stop rather than get resolved. I go quiet, time passes, and the issue is still sitting there."],
    unengaged: ["After arguments I withdraw until it blows over. I cannot remember the last time we actually worked out what the fight was about.", "Most disagreements end in distance. We both avoid the subject, and over time there are more things we avoid."],
  },
  mutual_honor: {
    christformed: ["In front of friends, {SP} told a story that was not flattering to me. I laughed, then later thanked them for being honest about it.", "I defended {SP}'s opinion in a family discussion even though I privately disagreed, and then talked it through with them afterward."],
    rooted: ["I was frustrated with {SP} and still spoke respectfully. Later I told them I had been stressed and apologised for my tone.", "I usually speak well of {SP}. Once I rolled my eyes in front of others and felt it immediately. I apologised in private."],
    growing: ["I corrected how {SP} pronounced a word in front of colleagues. They went quiet, and I knew it was a mistake but said nothing.", "Respect comes easily when things are calm. Under pressure, my tone sharpens and I say things I would not say to a friend."],
    awakening: ["I make small jokes at {SP}'s expense that I call teasing. I have noticed they have stopped laughing at them.", "I tend to treat my view as the sensible one. {SP} has learned to stop pushing, and I have not asked why."],
    unengaged: ["When I am frustrated, I am dismissive and sarcastic with {SP}, including in front of others. I do not stop to think about how that lands.", "I seldom think about how I come across to {SP}. If they feel small around me, I have either not noticed it or ignored it."],
  },
  shared_vision: {
    christformed: ["{SP} and I spent an evening writing down what we want in ten years, then swapped lists. We were surprised by how much we matched and by where we differed.", "Before we committed to anything large, we sat down and set a plan for money, where we would live, and family. We revisit it every few months."],
    rooted: ["We have talked about the big picture and agreed on the basics. The details of family and where we will live are still open, and we know it.", "We both want a home and a family, and we have said so. We have not yet worked out how we handle money if our incomes change."],
    growing: ["We both say we want some land and a growing family. I have not actually asked {SP} where, or what they would give up to get there.", "Our plans are real but vague. I assume {SP} pictures the same future, and I have never checked."],
    awakening: ["We do not talk about where we are heading. Each of us makes decisions assuming the other will go along.", "I have made plans about work and location without asking {SP}, and I was surprised when they did not share my excitement."],
    unengaged: ["We have not talked about our future in any detail. I suspect we want different things, and I would rather not find out.", "I do not know what {SP} wants in ten years, and they probably do not know what I want. It has not felt urgent to ask."],
  },
}

// Shared vision for someone with no partner: about their own picture of the future.
export const SV_SOLO: Record<Level, [string, string]> = {
  christformed: ["I wrote down what I want my life to look like in ten years, including where I will live and how I will handle money, and I showed it to a mentor.", "I have decided what I want about work, home and family, and I can say it plainly. I am still open to being shaped by someone else's view."],
  rooted: ["I know the shape of what I want. Money is the thin area, and I have not worked out how I would support my parents and a household together.", "I have a clear picture of home and calling. The practical details of money are still fuzzy, and I know that."],
  growing: ["I see myself married with a small family, working in something I believe in. I could not tell you where, or what I would earn, or how I would support my parents.", "I have general ideas about the future. When it comes to specifics, I tend to change the subject."],
  awakening: ["I tell myself I will work out what I want once the right person appears. In the meantime I do not decide much about money, place or family.", "I avoid thinking seriously about my future because the answers feel risky. I let things drift and call it being flexible."],
  unengaged: ["I have not really decided what I want about money, family or where I will live. I have been avoiding the subject for years.", "If someone asked me what my life should look like in ten years, I would not know. I have never sat down and tried to answer."],
}
export default P
