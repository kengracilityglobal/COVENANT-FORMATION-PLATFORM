// lib/formation/fruit.ts
//
// Fruit of the Spirit (Galatians 5:22-23) — a deliberately unscored
// reflection layer, built the way EIKON built its own. See migration 005's
// header comment and docs/PILLARS.md for the full rationale: fruit is
// produced by abiding, not achieved by trying harder at it, so nothing
// here is a Likert scale, a rubric, or a computed score. Static,
// zero-dependency content — works identically with or without an AI key,
// same principle as the pillar fallback content in lib/report/builder.ts.
//
// Framed for marriage specifically (not EIKON's individual-formation
// framing) — each fruit is described in terms of what it actually looks
// like between two people building a shared life, not as a private virtue
// in isolation.

export type FruitName =
  | 'love' | 'joy' | 'peace' | 'patience' | 'kindness'
  | 'goodness' | 'faithfulness' | 'gentleness' | 'self_control'

export const FRUIT_ORDER: FruitName[] = [
  'love', 'joy', 'peace', 'patience', 'kindness',
  'goodness', 'faithfulness', 'gentleness', 'self_control',
]

export const FRUIT_DISPLAY_NAMES: Record<FruitName, string> = {
  love: 'Love',
  joy: 'Joy',
  peace: 'Peace',
  patience: 'Patience',
  kindness: 'Kindness',
  goodness: 'Goodness',
  faithfulness: 'Faithfulness',
  gentleness: 'Gentleness',
  self_control: 'Self-Control',
}

export interface FruitContent {
  /** One sentence naming what this fruit looks like specifically between two spouses. */
  inMarriage: string
  /** What it is NOT — the counterfeit most easily mistaken for it. */
  notToBeConfusedWith: string
  /** The open reflection prompt shown on the reflection page. Never multiple-choice, never scored. */
  prompt: string
}

export const FRUIT_CONTENT: Record<FruitName, FruitContent> = {
  love: {
    inMarriage: 'Choosing your spouse\'s good, in action, on the days it costs you something and no one is watching.',
    notToBeConfusedWith: 'The warm feeling that shows up easily at the start and fades under ordinary friction — that feeling is real, but it isn\'t this.',
    prompt: 'Where in your marriage (or closest relationship) has love recently meant a choice rather than a feeling? What did you actually do?',
  },
  joy: {
    inMarriage: 'A settled gladness in your marriage that holds even when circumstances are hard — different from happiness, which depends on things going well.',
    notToBeConfusedWith: 'Performed cheerfulness, or the relief of circumstances finally improving.',
    prompt: 'Has there been real joy between you and your spouse recently — not just an absence of conflict? Where did you notice it?',
  },
  peace: {
    inMarriage: 'An inner steadiness that lets you stay present with your spouse through conflict or uncertainty, rather than needing the situation to resolve before you can settle.',
    notToBeConfusedWith: 'Conflict-avoidance, or the quiet that comes from one person simply giving up on an issue.',
    prompt: 'Where have you recently kept your peace in a hard moment with your spouse — or lost it? What actually happened inside you?',
  },
  patience: {
    inMarriage: 'Staying kind and present while your spouse is still working through something — a flaw, a slow change, a bad day — without rushing them or punishing the delay.',
    notToBeConfusedWith: 'Silent resentment that looks calm on the outside while keeping score underneath.',
    prompt: 'What is something about your spouse (or future spouse) that regularly tests your patience? Be honest about how you actually respond.',
  },
  kindness: {
    inMarriage: 'Choosing the gentler word and the generous read of your spouse, especially when you\'re tired, right, or both.',
    notToBeConfusedWith: 'Niceness that avoids every hard conversation — real kindness can still tell the truth.',
    prompt: 'Describe a recent moment you could have been sharp with your spouse and chose kindness instead — or didn\'t. What happened?',
  },
  goodness: {
    inMarriage: 'Consistent integrity in the small, unwitnessed choices of a marriage — not performing virtue when it\'s visible, but being the same person when it isn\'t.',
    notToBeConfusedWith: 'A public reputation for being a good spouse that doesn\'t match what your spouse actually experiences at home.',
    prompt: 'Is there a gap between how you\'re seen by others and how you actually show up for your spouse in private? Name it honestly.',
  },
  faithfulness: {
    inMarriage: 'Steady, reliable presence over years, not just the dramatic once-off proof of loyalty — showing up the same way on the ordinary Tuesday as in the visible crisis.',
    notToBeConfusedWith: 'Never having been tested — faithfulness is proven in repetition, not in the absence of opportunity to fail.',
    prompt: 'Where has your faithfulness to your spouse (or to the kind of spouse you want to become) actually been tested lately, in some small, unglamorous way?',
  },
  gentleness: {
    inMarriage: 'Strength held carefully — being able to push back, disagree, or hold a boundary with your spouse without using more force, volume, or coldness than the moment needs.',
    notToBeConfusedWith: 'Weakness or passivity — gentleness is strength under control, not the absence of strength.',
    prompt: 'Think of the last time you were frustrated with your spouse. Was your response proportionate, or did you use more force than the moment needed?',
  },
  self_control: {
    inMarriage: 'The gap between an impulse — a sharp word, a withdrawal, a desire, an old habit — and what you actually do with your spouse in that moment.',
    notToBeConfusedWith: 'Suppression that leaks out later as resentment or a bigger blowup — real self-control metabolizes the impulse honestly, it doesn\'t just bottle it.',
    prompt: 'Where do you most often lose the gap between impulse and action with your spouse — words, scrolling away instead of engaging, food, temper, something else? What does that cost the marriage?',
  },
}
