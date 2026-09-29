/**
 * Sending mail from the APP, rather than from a cron script.
 *
 * Until now every email Politika sent came from scripts/lib/notify.mjs, run by
 * a GitHub Actions schedule. Donation receipts can't wait for that: a receipt
 * that arrives up to ten minutes after the card is charged is a receipt the
 * donor has already gone looking for. The schedule also took roughly six
 * hours to fire for the first time after it was added, which is GitHub’s
 * normal lag on a newly added cron rather than a fault — but it means the
 * first donation a new deployment takes is the one most likely to go
 * unreceipted. So /api/stripe/webhook sends the receipt itself, the moment
 * it writes the donation row, and the schedule stays as a backstop.
 *
 * This is a deliberately small copy of notify.mjs's transport rather than an
 * import of it: notify.mjs also pulls in web-push and the Supabase client, and
 * dragging those into a serverless bundle to send one email is how cold starts
 * get slow. The transport settings below must stay in step with
 * scripts/lib/notify.mjs — same host, same port, same from-address rule.
 *
 * REQUIRES ZOHO_SMTP_USER and ZOHO_SMTP_PASS IN THE DEPLOYMENT ENVIRONMENT.
 * They have only ever been GitHub Actions secrets, because only Actions ever
 * sent mail. Vercel needs them too now, and without them this module does
 * nothing and says so — it never pretends to have sent.
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let cached: Transporter | null | undefined

function mailer(): Transporter | null {
  if (cached !== undefined) return cached
  if (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS) {
    cached = null
    return null
  }
  cached = nodemailer.createTransport({
    host: 'smtp.zoho.com.au',
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_SMTP_USER, pass: process.env.ZOHO_SMTP_PASS },
    // Bounded, because this runs inside a Stripe webhook. Stripe treats a slow
    // response as a failure and redelivers the event; a hung SMTP socket with
    // no timeout would turn one donation into a queue of retries.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })
  return cached
}

/** Whether mail can be sent at all. Check before claiming work. */
export const emailConfigured = (): boolean =>
  Boolean(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS)

/**
 * The address readers SEE mail from, which is not the address we log in as.
 * hello@politika.nz is an alias on the same Zoho user, so it sends as this
 * without changing how it authenticates. Same rule as notify.mjs — if these
 * two ever disagree, a donor gets a receipt from one address and a newsletter
 * from another, which is what a phishing attempt looks like.
 */
const mailFrom = () => `"Politika" <${process.env.MAIL_FROM || 'hello@politika.nz'}>`

/** Throws on failure. Callers decide what a failure means. */
export async function sendMail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const m = mailer()
  if (!m) throw new Error('mailer not configured')
  await m.sendMail({ from: mailFrom(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html })
}
