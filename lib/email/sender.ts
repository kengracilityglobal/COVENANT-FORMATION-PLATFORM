// @ts-nocheck
import { Resend } from 'resend'

// Lazy initialization — avoids build-time crash when env var is absent
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: from || `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error(`Email failed: ${error.message}`)
  }
}
