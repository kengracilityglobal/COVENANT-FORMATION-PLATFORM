// app/api/emails/templates/eikon-email-templates.ts
// 
// These three emails are the entire trial-to-paid conversion sequence.
// Send via Resend. Wire to the following triggers:
//
//   EMAIL 1 → trigger: assessment.status === 'report_generated'
//   EMAIL 2 → trigger: cron job, day 7 after registration, subscription_status !== 'active'
//   EMAIL 3 → trigger: cron job, day 14 after registration, subscription_status !== 'active'
//
// All three are plain-text-first. No gratuitous HTML. Formation organisations
// are sceptical of marketing aesthetics. Pastoral prose closes more than
// button-heavy campaigns.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailTemplateData = {
  full_name: string
  first_name: string
  assessment_id?: string
  overall_score?: number
  top_priority_pillar?: string
  top_priority_descriptor?: string
  report_url?: string
  subscribe_url: string
  unsubscribe_url: string
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 1: Report Ready
// Trigger: report generation complete
// Goal: get them to open the report and experience the aha moment
// Tone: personal, unhurried, pastoral — not transactional
// ─────────────────────────────────────────────────────────────────────────────

export function reportReadyEmail(data: EmailTemplateData) {
  const subject = `${data.first_name}, your Covenant Formation report is ready`

  const text = `${data.first_name},

Your report is ready.

Before you open it, I want to say one thing: what you are about to read is a portrait, not a verdict.

It shows you where you and your spouse are right now — not where you will remain. The distance between where you are and where God is forming you is not a rebuke. It is an invitation.

Open your report here:
${data.report_url}

A few things worth knowing before you read:

Your overall formation score is ${data.overall_score}. That number is a starting point, not a ceiling.

The assessment has identified your highest formation priority across the eight pillars of covenant marriage. It will be named clearly in the report. Read that section slowly. Read it more than once.

Some of what you find will confirm what you already suspected. Some of it may surprise you. Receive both with the same seriousness. What surprises you is usually the more important finding.

Once your spouse has also completed their assessment, your report will also show the Perception Gap — where your two sets of answers agree, and where they quietly don't. That is often the most useful page in the whole report.

Your Formation Guide will read both of your reports and personally begin your pathway with you.

In formation,
Ken Ojiri
God's Kingdom Malak Ministries — Covenant Formation

---
To stop receiving these emails: ${data.unsubscribe_url}`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0D0B08;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Logo -->
  <tr><td style="padding:0 0 32px;">
    <p style="font-family:Georgia;font-size:20px;font-weight:700;color:#B8972A;letter-spacing:0.1em;margin:0;">COVENANT FORMATION</p>
    <p style="font-family:Georgia;font-size:10px;color:#4A3F2F;letter-spacing:0.25em;text-transform:uppercase;margin:4px 0 0;">God's Kingdom Malak Ministries</p>
  </td></tr>

  <!-- Rule -->
  <tr><td style="padding:0 0 28px;">
    <div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);"></div>
  </td></tr>

  <!-- Greeting -->
  <tr><td>
    <p style="font-family:Georgia;font-size:16px;color:#F5E6C0;margin:0 0 20px;line-height:1.7;">${data.first_name},</p>
    <p style="font-family:Georgia;font-size:16px;color:#F5E6C0;margin:0 0 20px;line-height:1.7;">Your report is ready.</p>
    <p style="font-family:Georgia;font-size:14.5px;color:#C4A96A;margin:0 0 24px;line-height:1.85;font-style:italic;">
      Before you open it, I want to say one thing: what you are about to read is a portrait, not a verdict.
      It shows you where you and your spouse are right now — not where you will remain.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:8px 0 28px;">
    <table cellpadding="0" cellspacing="0">
    <tr><td style="background:#B8972A;border-radius:2px;">
      <a href="${data.report_url}"
         style="display:inline-block;padding:14px 32px;font-family:Georgia;font-size:14px;font-weight:700;color:#0D0B08;text-decoration:none;letter-spacing:0.06em;">
        Open My Report →
      </a>
    </td></tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      Your overall formation score is <strong style="color:#C4A96A;">${data.overall_score}</strong>.
      That number is a starting point, not a ceiling.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      The assessment has identified your highest formation priority across the eight pillars of
      covenant marriage. It will be named clearly in the report. Read that section slowly. Read it
      more than once.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      Some of what you find will confirm what you already suspected. Some of it may surprise you.
      Receive both with the same seriousness. What surprises you is usually the more important finding.
    </p>
  </td></tr>

  <!-- The Perception Gap -->
  <tr><td style="padding:20px 0;">
    <div style="padding:20px 24px;background:rgba(184,151,42,0.05);border-left:2px solid #B8972A;">
      <p style="font-family:Georgia;font-size:13px;font-weight:700;color:#B8972A;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 10px;">Once your spouse has finished too</p>
      <p style="font-family:Georgia;font-size:13px;color:#C4A96A;margin:0;line-height:1.75;">
        Your report will also show the Perception Gap — where your two sets of answers agree, and
        where they quietly don't. That page is often the most useful one in the whole report.
      </p>
    </div>
  </td></tr>

  <!-- Sign off -->
  <tr><td>
    <div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);margin:0 0 24px;"></div>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 6px;line-height:1.7;">In formation,</p>
    <p style="font-family:Georgia;font-size:14px;font-weight:700;color:#C4A96A;margin:0 0 3px;">Ken Ojiri</p>
    <p style="font-family:Georgia;font-size:12px;color:#4A3F2F;margin:0;">God's Kingdom Malak Ministries — Covenant Formation</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 0 0;">
    <p style="font-family:Georgia;font-size:11px;color:#3D3325;margin:0;line-height:1.7;">
      You are receiving this because you completed the Covenant Formation Assessment.<br/>
      <a href="${data.unsubscribe_url}" style="color:#4A3F2F;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, text, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 2: Day 7 — The Formation Mirror
// Trigger: day 7 post-registration, not yet subscribed
// Goal: deepen the conviction that the report is worth opening fully
// Tone: pastoral, gentle urgency, no hard sell
// This email does not mention the price. It deepens the desire.
// ─────────────────────────────────────────────────────────────────────────────

export function daySevenEmail(data: EmailTemplateData) {
  const subject = `${data.first_name}, a thought about your ${data.top_priority_pillar ?? 'formation'} score`

  const pillarName = data.top_priority_pillar
    ? data.top_priority_pillar.charAt(0).toUpperCase() + data.top_priority_pillar.slice(1)
    : 'your priority pillar'

  const text = `${data.first_name},

Seven days ago you completed the Covenant Formation assessment.

I want to ask you something directly: have you sat with your report yet?

Not glanced at it. Sat with it. Read the section on ${pillarName} slowly. Let what it says actually land.

If you have — you already know what I am about to say. If you have not, I want to tell you what the formation data shows about people who take the assessment but do not engage the report.

They already knew, before they took the assessment, that something needed attention. The assessment simply named it. And naming something without doing anything about it does not help. In fact, it can make things worse — because now you know, and you are choosing not to engage it.

That is not a condemnation. It is a description of exactly the kind of gap between intention and action that formation is designed to address.

Your ${pillarName} score places you in the ${data.top_priority_descriptor ?? 'growing'} band. The full narrative for that pillar — what it means, what the formation frontier looks like from where you are, what the pathway ahead involves — is in the report.

It is worth reading. Not because you will feel good afterward. Because you will know something true about yourself that most people who sit in church for twenty years never learn to name clearly.

Your report is here:
${data.report_url}

The full portrait — all seven pillars, the priority stack, the pathway — is available when you're ready:
${data.subscribe_url}

I am not in a hurry on your behalf. But I am honest enough to say: the gap between where you are and who you are being formed into does not close by itself.

In formation,
Ken Ojiri
Covenant Formation — God's Kingdom Malak Ministries

---
To stop receiving these emails: ${data.unsubscribe_url}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0D0B08;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="padding:0 0 32px;">
    <p style="font-family:Georgia;font-size:22px;font-weight:700;color:#B8972A;letter-spacing:0.15em;margin:0;">COVENANT FORMATION</p>
    <p style="font-family:Georgia;font-size:10px;color:#4A3F2F;letter-spacing:0.25em;text-transform:uppercase;margin:4px 0 0;">God's Kingdom Malak Ministries</p>
  </td></tr>
  <tr><td style="padding:0 0 28px;"><div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);"></div></td></tr>

  <tr><td>
    <p style="font-family:Georgia;font-size:16px;color:#F5E6C0;margin:0 0 20px;line-height:1.7;">${data.first_name},</p>
    <p style="font-family:Georgia;font-size:14.5px;color:#C4A96A;margin:0 0 20px;line-height:1.85;">
      Seven days ago you completed the Covenant Formation assessment.
    </p>
    <p style="font-family:Georgia;font-size:14.5px;color:#8A7340;margin:0 0 20px;line-height:1.85;font-style:italic;">
      I want to ask you something directly: have you sat with your report yet?
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      Not glanced at it. <em>Sat with it.</em> Read the section on <strong style="color:#C4A96A;">${pillarName}</strong>
      slowly. Let what it says actually land.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      If you have — you already know what I am about to say. If you have not, I want to tell you what the
      formation data shows about people who take the assessment but do not engage the report.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      They already knew, before they took the assessment, that something needed attention.
      The assessment simply named it. And naming something without doing anything about it does not help.
      In fact, it can make things worse — because now you know, and you are choosing not to engage it.
    </p>
  </td></tr>

  <!-- Priority pillar callout -->
  <tr><td style="padding:16px 0;">
    <div style="padding:20px 24px;background:rgba(184,151,42,0.05);border-left:2px solid #B8972A;">
      <p style="font-family:Georgia;font-size:13px;color:#8A7340;margin:0 0 8px;line-height:1.75;">
        Your <strong style="color:#C4A96A;">${pillarName}</strong> score places you in the
        <strong style="color:#C4A96A;">${data.top_priority_descriptor ?? 'growing'}</strong> band.
      </p>
      <p style="font-family:Georgia;font-size:13px;color:#8A7340;margin:0;line-height:1.75;font-style:italic;">
        The full narrative for that pillar — what it means, what the formation frontier looks like
        from where you are, what the pathway ahead involves — is waiting in the report.
      </p>
    </div>
  </td></tr>

  <tr><td>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:18px 0;line-height:1.85;">
      It is worth reading. Not because you will feel good afterward. Because you will know something
      true about yourself that most people who sit in church for twenty years never learn to name clearly.
    </p>
  </td></tr>

  <!-- CTAs -->
  <tr><td style="padding:8px 0 20px;">
    <table cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-right:12px;">
        <table cellpadding="0" cellspacing="0"><tr><td style="background:#B8972A;border-radius:2px;">
          <a href="${data.report_url}" style="display:inline-block;padding:12px 24px;font-family:Georgia;font-size:13px;font-weight:700;color:#0D0B08;text-decoration:none;">Open Report →</a>
        </td></tr></table>
      </td>
      <td>
        <table cellpadding="0" cellspacing="0"><tr><td style="border:1px solid #B8972A;border-radius:2px;">
          <a href="${data.subscribe_url}" style="display:inline-block;padding:12px 24px;font-family:Georgia;font-size:13px;font-weight:700;color:#B8972A;text-decoration:none;">Unlock Full Portrait →</a>
        </td></tr></table>
      </td>
    </tr>
    </table>
  </td></tr>

  <tr><td>
    <div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);margin:20px 0 24px;"></div>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 6px;line-height:1.7;">In formation,</p>
    <p style="font-family:Georgia;font-size:14px;font-weight:700;color:#C4A96A;margin:0 0 3px;">Ken Ojiri</p>
    <p style="font-family:Georgia;font-size:12px;color:#4A3F2F;margin:0;">Covenant Formation — God's Kingdom Malak Ministries</p>
  </td></tr>

  <tr><td style="padding:28px 0 0;">
    <p style="font-family:Georgia;font-size:11px;color:#3D3325;margin:0;line-height:1.7;">
      <a href="${data.unsubscribe_url}" style="color:#4A3F2F;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, text, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 3: Day 14 — The Decision
// Trigger: day 14 post-registration, not yet subscribed
// Goal: convert. This is the close.
// Tone: honest, direct, no pressure tactics — but no ambiguity about the offer
// This is the last email in the sequence. After this, silence.
// ─────────────────────────────────────────────────────────────────────────────

export function dayFourteenEmail(data: EmailTemplateData) {
  const subject = `${data.first_name}, a final word`

  const text = `${data.first_name},

This is the last email I will send you about your Covenant Formation report.

Fourteen days ago you completed the assessment. I have written to you once since then. I am going to say one more thing and then leave the decision with you entirely.

Here is what I know about the people who take this assessment and do not continue:

Some of them are in the wrong season. The assessment surfaced something that needs time to settle before they are ready to engage it. That is legitimate, and the data will be here when the season is right.

Some of them are not sure whether the report will say anything they do not already know. My experience is that the people who feel most certain of this are almost always the ones with the highest-priority gaps in the Integrity or Humility domains — the two pillars that are hardest to see clearly from the inside.

Some of them are waiting until they have more time, more money, or more certainty that it is worth it. I understand this, and I cannot resolve it for you.

What I can tell you is what the Koinonia formation journey costs in practice:

₦18,000 per month. About ₦600 a day. Less than a takeaway meal, for a guided seven-month journey toward becoming the person you say you want to be.

If the cost is genuinely prohibitive in your current season, write to me directly. We have financial hardship provisions for people in active ministry. My email is derealkenneth@gmail.com.

If you are ready:
${data.subscribe_url}

If you are not, I pray that what was named in the assessment stays with you, that the Spirit continues the work that the questions began, and that the right season arrives soon.

In formation,
Ken Ojiri
Covenant Formation — God's Kingdom Malak Ministries

P.S. One thing worth knowing: your assessment data never expires. Whether you return in a month or a year, everything you completed is exactly where you left it.

---
To stop receiving these emails: ${data.unsubscribe_url}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0D0B08;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="padding:0 0 32px;">
    <p style="font-family:Georgia;font-size:22px;font-weight:700;color:#B8972A;letter-spacing:0.15em;margin:0;">COVENANT FORMATION</p>
    <p style="font-family:Georgia;font-size:10px;color:#4A3F2F;letter-spacing:0.25em;text-transform:uppercase;margin:4px 0 0;">God's Kingdom Malak Ministries</p>
  </td></tr>
  <tr><td style="padding:0 0 28px;"><div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);"></div></td></tr>

  <tr><td>
    <p style="font-family:Georgia;font-size:16px;color:#F5E6C0;margin:0 0 20px;line-height:1.7;">${data.first_name},</p>
    <p style="font-family:Georgia;font-size:16px;color:#C4A96A;margin:0 0 24px;line-height:1.85;font-style:italic;">
      This is the last email I will send you about your Covenant Formation report.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      Fourteen days ago you completed the assessment. I have written to you once since then.
      I am going to say one more thing and then leave the decision with you entirely.
    </p>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      Here is what I know about the people who take this assessment and do not continue:
    </p>
  </td></tr>

  <!-- Three types callout -->
  <tr><td style="padding:0 0 20px;">
    ${[
      {
        label: 'Some are in the wrong season.',
        body: 'The assessment surfaced something that needs time to settle before they are ready to engage it. That is legitimate, and the data will be here when the season is right.',
      },
      {
        label: 'Some are not sure they will learn anything new.',
        body: 'My experience is that the people who feel most certain of this are almost always the ones with the highest-priority gaps in the Integrity or Humility domains — the two pillars that are hardest to see clearly from the inside.',
      },
      {
        label: 'Some are waiting.',
        body: 'For more time, more money, more certainty. I understand this, and I cannot resolve it for you.',
      },
    ].map(item => `
      <div style="padding:14px 18px;margin-bottom:8px;background:rgba(184,151,42,0.04);border-left:1px solid rgba(184,151,42,0.2);">
        <p style="font-family:Georgia;font-size:13px;font-weight:700;color:#C4A96A;margin:0 0 6px;">${item.label}</p>
        <p style="font-family:Georgia;font-size:13px;color:#8A7340;margin:0;line-height:1.75;">${item.body}</p>
      </div>
    `).join('')}
  </td></tr>

  <!-- Cost anchor -->
  <tr><td>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      What I can tell you is what the Koinonia formation journey costs in practice:
    </p>
    <div style="padding:20px 24px;background:rgba(184,151,42,0.07);border:1px solid rgba(184,151,42,0.2);text-align:center;margin:0 0 20px;">
      <p style="font-family:Georgia;font-size:28px;font-weight:700;color:#B8972A;margin:0 0 4px;">₦18,000/month</p>
      <p style="font-family:Georgia;font-size:12px;color:#8A7340;margin:0;font-style:italic;">About ₦600 a day. Less than a meal, for a guided seven-month formation journey.</p>
    </div>
    <p style="font-family:Georgia;font-size:13px;color:#4A3F2F;margin:0 0 20px;line-height:1.75;font-style:italic;">
      If the cost is genuinely prohibitive, write to us directly at derealkenneth@gmail.com.
      We have financial hardship provisions for people in active ministry.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:8px 0 28px;">
    <table cellpadding="0" cellspacing="0">
    <tr><td style="background:#B8972A;border-radius:2px;">
      <a href="${data.subscribe_url}"
         style="display:inline-block;padding:14px 32px;font-family:Georgia;font-size:14px;font-weight:700;color:#0D0B08;text-decoration:none;letter-spacing:0.06em;">
        Begin the Journey →
      </a>
    </td></tr>
    </table>
  </td></tr>

  <!-- Closing -->
  <tr><td>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 18px;line-height:1.85;">
      If you are not ready, I pray that what was named in the assessment stays with you —
      that the Spirit continues the work that the questions began, and that the right season arrives soon.
    </p>
    <div style="height:1px;background:linear-gradient(to right,#B8972A,transparent);margin:0 0 24px;"></div>
    <p style="font-family:Georgia;font-size:14px;color:#8A7340;margin:0 0 6px;line-height:1.7;">In formation,</p>
    <p style="font-family:Georgia;font-size:14px;font-weight:700;color:#C4A96A;margin:0 0 3px;">Ken Ojiri</p>
    <p style="font-family:Georgia;font-size:12px;color:#4A3F2F;margin:0;">Covenant Formation — God's Kingdom Malak Ministries</p>
    <p style="font-family:Georgia;font-size:12px;color:#4A3F2F;margin:10px 0 0;font-style:italic;">
      P.S. Your assessment data never expires. Whether you return in a month or a year, everything you completed is exactly where you left it.
    </p>
  </td></tr>

  <tr><td style="padding:28px 0 0;">
    <p style="font-family:Georgia;font-size:11px;color:#3D3325;margin:0;line-height:1.7;">
      This is the final email in this sequence.
      <a href="${data.unsubscribe_url}" style="color:#4A3F2F;">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, text, html }
}
