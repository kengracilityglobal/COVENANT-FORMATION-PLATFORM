// app/(public)/page.tsx
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Covenant Formation | Marriage Character Formation',
  description:
    'A dyadic formation diagnostic for couples, built around the eight pillars of covenant marriage. Taken independently by each spouse, read together with a Formation Guide. For premarital couples and married couples alike.',
}

const PILLARS = [
  { name: 'Covenant Faithfulness',        anchor: 'Chesed',    number: 'I',    verse: 'Hosea 2:19',      desc: 'Keeping your word when it is costly, and whether your deepest values actually line up.' },
  { name: 'Oneness',                      anchor: 'Echad',     number: 'II',   verse: 'Genesis 2:24',    desc: 'Whether you function as a team, or as two lives sharing an address.' },
  { name: 'Sacrificial Love',             anchor: 'Agape',     number: 'III',  verse: 'Ephesians 5:25',  desc: 'What you actually give up for your spouse, freely, without keeping score.' },
  { name: 'Intimacy',                     anchor: 'Yada',      number: 'IV',   verse: 'Genesis 4:1',     desc: 'How fully known you let your spouse be to you — physically, emotionally, and in affection.' },
  { name: 'Truthful Communication',       anchor: 'Aletheia',  number: 'V',    verse: 'Ephesians 4:15',  desc: 'Whether what you say matches what is true and felt, and how well you each listen.' },
  { name: 'Conflict & Repair',            anchor: 'Eirene',    number: 'VI',   verse: 'Ephesians 4:26',  desc: 'Whether disagreements actually get resolved, or just stop.' },
  { name: 'Mutual Honor',                 anchor: 'Timao',     number: 'VII',  verse: 'Ephesians 5:21',  desc: 'How you treat each other under frustration, and in front of others.' },
  { name: 'Shared Vision & Stewardship',  anchor: 'Koinonia',  number: 'VIII', verse: 'Amos 3:3',        desc: 'Whether you are building one future together — money, family, calling — or two.' },
]

const WHAT_OTHERS_DONT = [
  {
    them: 'Premarital courses teach principles. They rarely measure whether a specific couple has actually absorbed them.',
    us:   'Covenant Formation measures where each of you actually are, independently, then shows you where your answers agree and where they quietly don’t.',
  },
  {
    them: 'Most compatibility quizzes score the two of you as one blended result.',
    us:   'Averaging hides exactly what matters. We score you separately, then show the gap — because a couple who both score "growing" on a pillar is in a very different place than one partner "rooted" and the other "unengaged."',
  },
  {
    them: 'Counseling happens after a couple already knows something is wrong.',
    us:   'This surfaces the gap before it becomes a crisis — premarital couples catch it before the wedding, married couples catch it before it calcifies.',
  },
  {
    them: 'Tools produce reports. Reports sit in drawers.',
    us:   'Your report goes to a Formation Guide who reads both of your answers and begins walking with you — the report is the beginning, not the product.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: 'rgba(13,11,8,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--bg-border)',
      }}>
        <div className="page-container-wide flex items-center justify-between h-16">
          <span className="font-display font-bold tracking-[0.1em] text-lg" style={{ color: 'var(--gold)' }}>
            COVENANT FORMATION
          </span>
          <div className="flex items-center gap-6">
            <Link href="/taster" className="text-sm font-display hidden md:block" style={{ color: 'var(--text-muted)' }}>
              Free Taster
            </Link>
            <Link href="#for-whom" className="text-sm font-display hidden md:block" style={{ color: 'var(--text-muted)' }}>
              For Whom
            </Link>
            <Link href="#how-it-works" className="text-sm font-display hidden md:block" style={{ color: 'var(--text-muted)' }}>
              How It Works
            </Link>
            <Link href="/login" className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>
              Sign In
            </Link>
            <Link href="/register" className="btn-gold text-sm py-2 px-5">
              Take the Assessment
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">

        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(184,151,42,0.07) 0%, transparent 65%)',
        }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative page-container w-full text-center py-16 md:py-20 max-w-5xl">

          <p className="pillar-number tracking-[0.4em] mb-8" style={{ color: 'var(--gold-muted)' }}>
            GOD&apos;S KINGDOM MALAK MINISTRIES
          </p>

          <h1 className="font-display"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            COVENANT<br />FORMATION
          </h1>

          <div className="gold-rule max-w-xs mx-auto my-10" />

          <p className="font-display text-2xl md:text-3xl font-light mb-5"
             style={{ color: 'var(--text-secondary)' }}>
            A formation diagnostic built for two.
          </p>

          <p className="text-lg mb-4 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
            For engaged and married couples who want more than a compatibility score —
            <em style={{ color: 'var(--text-secondary)' }}> a real, honest mirror</em> of where you
            each actually are across the eight pillars of a covenant marriage, and where you quietly
            see things differently.
          </p>

          <p className="font-display text-base italic mb-12 max-w-xl mx-auto"
             style={{ color: 'var(--text-faint)' }}>
            &ldquo;Can two walk together, except they be agreed?&rdquo;
            <span className="block mt-2 not-italic text-xs tracking-widest" style={{ color: 'var(--gold)' }}>
              AMOS 3:3
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="btn-gold text-lg px-10 py-4">
              Take the Free Assessment
            </Link>
            <Link href="/taster" className="btn-ghost">
              Try the 6-question taster →
            </Link>
          </div>

          <p className="mt-5 text-xs" style={{ color: 'var(--text-faint)' }}>
            Free to assess · No card required · 25–35 minutes per partner
          </p>

        </div>

        <div className="relative hidden [@media(min-height:820px)]:block pb-8">
          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-faint)' }}>
            <span className="text-xs tracking-widest pillar-number">SCROLL</span>
            <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, var(--gold), transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── For Whom ── */}
      <section id="for-whom" className="py-32" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-5xl">

          <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
            FOR WHOM
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-12" style={{ color: 'var(--text-primary)' }}>
            Two tracks. One mechanism.
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              {
                who:   'Premarital couples',
                when:  'You are engaged or seriously considering marriage, and you want to go into it with your eyes open — not just agreeing on the venue and the budget, but actually knowing where you align and where you don’t, before the wedding, not after.',
                signal: 'You have asked each other the easy questions. You have not yet asked, separately and honestly, the hard ones — and compared the answers.',
              },
              {
                who:   'Married couples',
                when:  'You have been married for a while and want an honest read on where things actually stand — not a counseling intake form, a real diagnostic across eight specific domains, read independently and compared.',
                signal: 'You suspect you and your spouse would answer some questions about your own marriage differently from each other. You want to know, specifically, which ones.',
              },
            ].map(item => (
              <div key={item.who} className="eikon-card p-8">
                <div className="gold-rule-left mb-5" />
                <h3 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {item.who}
                </h3>
                <p className="formation-prose text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {item.when}
                </p>
                <div style={{ padding: '12px 16px', background: 'rgba(184,151,42,0.05)', borderLeft: '2px solid var(--gold)' }}>
                  <p className="text-xs italic" style={{ color: 'var(--gold-muted)', lineHeight: '1.7' }}>
                    {item.signal}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Who it's NOT for */}
          <div className="eikon-card p-8" style={{ borderColor: 'rgba(139,32,32,0.3)' }}>
            <p className="pillar-number text-xs mb-4" style={{ color: '#8B2020' }}>
              THIS IS NOT FOR YOU IF —
            </p>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-3">
              {[
                'You want a quick compatibility percentage to post somewhere.',
                'Only one of you is willing to take the assessment — the mechanism depends on both.',
                'You want to feel good about the relationship rather than see it honestly.',
                'You are not willing to have a Formation Guide read both of your reports.',
              ].map(item => (
                <p key={item} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  <span style={{ color: '#8B2020', flexShrink: 0, marginTop: '2px' }}>✗</span>
                  {item}
                </p>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-24" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-4xl">

          <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
            THE PROBLEM
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-12" style={{ color: 'var(--text-primary)' }}>
            Most tools score the couple.<br />None of them show the gap.
          </h2>

          <div className="space-y-5">
            {WHAT_OTHERS_DONT.map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-0"
                   style={{ border: '1px solid var(--bg-border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="p-6" style={{ background: 'rgba(139,32,32,0.06)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B2020', letterSpacing: '0.12em' }}>
                    EVERY OTHER TOOL
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    {item.them}
                  </p>
                </div>
                <div className="p-6" style={{ background: 'rgba(184,151,42,0.04)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--gold)', letterSpacing: '0.12em' }}>
                    COVENANT FORMATION
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    {item.us}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── The Eight Pillars ── */}
      <section className="py-32">
        <div className="page-container">

          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
              THE FRAMEWORK
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Eight Pillars of<br />Covenant Marriage
            </h2>
            <p className="formation-prose">
              These eight domains name the places a covenant is either being kept and deepened, or
              quietly neglected — each with its own Hebrew or Greek anchor word and a specific
              Scripture. Every question in the assessment traces back to one of these eight domains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
               style={{ border: '1px solid var(--bg-border)', borderRadius: '2px', overflow: 'hidden' }}>
            {PILLARS.map((pillar) => (
              <div key={pillar.name} className="p-7 eikon-card"
                   style={{ borderRadius: 0, border: 'none', borderRight: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="pillar-number text-xs" style={{ color: 'var(--gold-muted)' }}>
                    {pillar.number}
                  </span>
                  <span className="text-xs font-display italic" style={{ color: 'var(--text-faint)' }}>
                    {pillar.verse}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {pillar.name}
                </h3>
                <p className="font-display text-sm italic mb-3" style={{ color: 'var(--gold-muted)' }}>
                  {pillar.anchor}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)', lineHeight: '1.7' }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-32" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-5xl">

          <div className="text-center mb-20">
            <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
              HOW IT WORKS
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Separately, then together.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Pair and Assess',
                time:  '25–35 minutes each',
                desc: 'You register and invite your partner with a code. Each of you takes the assessment independently and privately — questions across all eight pillars, combining frequency scales, real scenarios, and reflective disclosure questions designed to surface what a managed answer would conceal.',
                note: 'Free to take. No card required.',
              },
              {
                step: '02',
                title: 'Your Own Report',
                time:  'Generated in minutes',
                desc: 'A formation portrait written from your own answers — not a table of scores. Each pillar gets a narrative naming where you are and what the formation frontier looks like from there.',
                note: 'Available as soon as you finish.',
              },
              {
                step: '03',
                title: 'The Perception Gap',
                time:  'Once you’ve both finished',
                desc: 'The report your relationship actually needs: a side-by-side comparison of your two sets of answers, pillar by pillar, showing where you agree and where you quietly don’t. Your Formation Guide reads both reports and the gap, and begins walking with you.',
                note: 'The core difference this platform exists for.',
              },
            ].map((phase) => (
              <div key={phase.step} className="eikon-card p-8">
                <div className="font-display text-5xl font-bold mb-6" style={{ color: 'var(--bg-elevated)' }}>
                  {phase.step}
                </div>
                <div className="gold-rule-left mb-4" />
                <h3 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {phase.title}
                </h3>
                <p className="text-xs mb-5 pillar-number tracking-wider" style={{ color: 'var(--gold-muted)' }}>
                  {phase.time.toUpperCase()}
                </p>
                <p className="formation-prose text-sm mb-6">
                  {phase.desc}
                </p>
                <p className="text-xs font-bold" style={{ color: 'var(--gold)', letterSpacing: '0.05em' }}>
                  → {phase.note}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Sample Report Preview ── */}
      <section className="py-32" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-5xl">

          <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
            WHAT YOU WILL ACTUALLY RECEIVE
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            This is what the Perception Gap looks like.
          </h2>
          <p className="formation-prose max-w-2xl mb-16" style={{ color: 'var(--text-muted)' }}>
            An illustrative excerpt — the kind of side-by-side table your report shows once both
            of you have completed the assessment.
          </p>

          <div className="eikon-card p-10 max-w-3xl" style={{ borderLeft: '3px solid var(--gold)' }}>
            <p className="pillar-number text-xs mb-6" style={{ color: 'var(--gold-muted)' }}>
              THE PERCEPTION GAP · SAMPLE
            </p>

            <div className="space-y-4 mb-8">
              {[
                { pillar: 'Truthful Communication', you: 78, spouse: 74, band: 'Aligned', color: '#4A7A4A' },
                { pillar: 'Conflict & Repair',       you: 71, spouse: 42, band: 'Significant Gap', color: '#8B2020' },
                { pillar: 'Shared Vision & Stewardship', you: 66, spouse: 51, band: 'Notable Gap', color: '#C47A1A' },
              ].map(row => (
                <div key={row.pillar}>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <span className="text-sm font-display font-medium" style={{ color: 'var(--text-primary)' }}>{row.pillar}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>You: <strong style={{ color: 'var(--gold)' }}>{row.you}</strong></span>
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Spouse: <strong style={{ color: 'var(--gold)' }}>{row.spouse}</strong></span>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: row.color }}>{row.band}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="formation-prose text-base mb-6" style={{ lineHeight: '1.9' }}>
              A gap is not necessarily a sign that someone is wrong. It is a sign of something
              neither of you has fully said out loud to the other yet. The pillars with the widest
              gaps — not just the lowest individual scores — are what your Formation Guide
              addresses first, because an unseen gap is its own kind of risk to a marriage.
            </p>

            <div className="mt-6">
              <Link href="/register" className="btn-gold">
                Take the assessment to see your own gap →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Formation Guide ── */}
      <section className="py-32">
        <div className="page-container max-w-4xl">

          <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
            THE FORMATION GUIDE
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            A human who has read both of your reports before you speak.
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="formation-prose text-lg mb-6" style={{ lineHeight: '1.9' }}>
                A Formation Guide is not a counsellor and not a wedding officiant reciting
                principles. They are assigned to your couple specifically, and they read both of
                your individual reports — and the Perception Gap between you — before your
                first session.
              </p>
              <p className="formation-prose mb-8">
                Nothing in your written answers is shared with your spouse directly. What your Guide
                brings into the room is the shape of the gap between you: where you see your
                marriage the same way, and where, quietly, you don&apos;t.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Assigned Per Couple', desc: 'Your Guide is assigned to your couple, not to either of you individually — one relationship, walked with together.' },
                  { label: 'Pastoral Confidentiality', desc: 'Your individual written answers are never shown to your spouse. Only the scores and the gap between them are shared, inside the couple.' },
                  { label: 'Score Override, With Reason', desc: 'A Guide’s pastoral judgment can override a computed score when their reading of a couple’s real situation calls for it — always recorded, with the original score kept alongside it.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-1 flex-shrink-0 mt-1" style={{ background: 'var(--gold)', opacity: 0.5, borderRadius: '2px' }} />
                    <div>
                      <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-faint)', lineHeight: '1.7' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eikon-card p-8" style={{ borderLeft: '3px solid rgba(184,151,42,0.4)' }}>
              <p className="pillar-number text-xs mb-4" style={{ color: 'var(--gold-muted)' }}>
                WHAT A FIRST SESSION LOOKS LIKE
              </p>
              <p className="formation-prose text-sm mb-6" style={{ lineHeight: '1.9' }}>
                Your Guide opens with what is strong — named specifically, from your actual
                answers, not a generic affirmation. Then the gap: the one or two pillars where your
                answers diverged most, put in front of both of you together, as a question rather
                than a verdict.
              </p>
              <p className="formation-prose text-sm" style={{ lineHeight: '1.9' }}>
                The goal of the first session is not to resolve the gap. It is to say it out loud,
                together, for the first time — which is usually most of the work.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Access ── */}
      <section className="py-24" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-3xl text-center">
          <p className="pillar-number tracking-[0.3em] mb-4" style={{ color: 'var(--gold-muted)' }}>
            ACCESS
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
            Start with the assessment. Free.
          </h2>
          <p className="formation-prose mb-10 max-w-xl mx-auto">
            The assessment is free for both partners to take. No card. No commitment. Invite your
            partner with a code, each take it independently, and see your report as soon as you
            finish — the Perception Gap appears once you both have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-gold text-lg px-10 py-4">
              Take the Free Assessment
            </Link>
            <Link href="/taster" className="btn-ghost">
              Try the Taster First →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {/* Deliberately an honest empty state, not invented quotes — see the equivalent
          note that was here in the EIKON original. Replace with real couples' accounts,
          with real consent, once there are some. */}
      <section id="testimonials" className="py-32" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="page-container max-w-6xl">

          <p className="pillar-number tracking-[0.3em] mb-4 text-center" style={{ color: 'var(--gold-muted)' }}>
            FORMATION ACCOUNTS
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
            What couples find.
          </h2>
          <p className="formation-prose text-center max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            The first couples are still walking the pathway. Once they have, their own accounts —
            not endorsements, including what was uncomfortable — will appear here, with their
            permission.
          </p>

        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-40 text-center">
        <div className="page-container">

          <div className="scripture-block max-w-xl mx-auto mb-16">
            <p>The two will become one flesh.</p>
            <cite>Genesis 2:24</cite>
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
            The journey begins<br />with the mirror.
          </h2>

          <p className="formation-prose text-xl mb-12 max-w-lg mx-auto">
            What would it mean to actually see your marriage as it is — not as either of you
            privately assumes it to be — and to walk the gap together, guided, with a destination
            already declared?
          </p>

          <Link href="/register" className="btn-gold text-lg px-12 py-5">
            Begin the Assessment
          </Link>

          <p className="mt-6 text-sm" style={{ color: 'var(--text-faint)' }}>
            Free to take · No card required · 25–35 minutes per partner
          </p>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}>
        <div className="page-container py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display font-bold text-lg tracking-widest mb-1" style={{ color: 'var(--gold)' }}>
                COVENANT FORMATION
              </p>
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                God&apos;s Kingdom Malak Ministries
              </p>
            </div>
            <div className="flex flex-wrap gap-8 text-sm justify-center" style={{ color: 'var(--text-muted)' }}>
              <Link href="/register">Start Free Assessment</Link>
              <Link href="/login">Sign In</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div className="gold-rule mt-8" />
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
            &copy; {new Date().getFullYear()} God&apos;s Kingdom Malak Ministries. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
