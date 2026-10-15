# Demo data

Invented people, scores and written answers for testing the admin, guide and participant sides without answering 48-66 questions each time. Everything computed from the answers (scores, flags, priority order) comes from the app's real scoring code.

## Use it
1. Run `001_demo_data.sql` in the Supabase SQL editor, as one query. Re-running resets the demo accounts.
2. Sign in as any account below. Password for all of them: `DemoPass!2026`
3. Remove everything with `002_remove_demo_data.sql`.

Sign in to a different account in a private window or another browser profile; one browser holds one session.

| Email | Name | Role | What it demonstrates |
|---|---|---|---|
| guide.naomi@demo.covenant.test | Naomi Okafor (Guide) | Guide | Guide with 2 couples (married + premarital) and 1 individual (Chidi) |
| guide.emeka@demo.covenant.test | Emeka Nwosu (Guide) | Guide | Guide with nobody assigned: use to test the admin assign-guide control |
| daniel@demo.covenant.test | Daniel Adeyemi | Participant | Married, report ready, partner of Grace, has an integrity flag (Truthful Communication) |
| grace@demo.covenant.test | Grace Adeyemi | Participant | Married, report ready, has fruit reflections (2 shared with guide) |
| tunde@demo.covenant.test | Tunde Bakare | Participant | Premarital, completed (report not yet generated), partner of Amaka |
| amaka@demo.covenant.test | Amaka Ugwu | Participant | Premarital, report ready, partner of Tunde |
| kelechi@demo.covenant.test | Kelechi Obi | Participant | Premarital, report ready, partner has not joined yet, no guide |
| chidi@demo.covenant.test | Chidi Eze | Participant | Readiness (single), report ready, guide = Naomi (individual assignment) |
| sam@demo.covenant.test | Sam Bello | Participant | Readiness, report ready, answered every rating the same way (shows the contradiction flags) |
| ife@demo.covenant.test | Ife Lawal | Participant | Readiness, in progress (20 of 48 answered) |
| bola@demo.covenant.test | Bola Hassan | Participant | Readiness, has not started |

## If sign-in fails for the demo accounts
The accounts are inserted straight into Supabase's auth tables. If your Supabase version rejects that, register the same email addresses through /register instead (confirm the email, or confirm it by SQL), then run the file again: it fills in everything else by matching on email.

Regenerate after changing the question banks: `npx tsx scripts/generate-demo-seed.ts`.
