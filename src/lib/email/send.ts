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
    // Bounded at every stage. These are per-stage timeouts, not a budget for
    // the whole send: socketTimeout in particular is an IDLE timeout, so a
    // server that dribbles a byte occasionally resets it and the send never
    // ends. SEND_DEADLINE_MS below is the ceiling that actually holds.
    dnsTimeout: 3000,
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  })
  return cached
}

/**
 * The ceiling on one send. The receipt runs in after(), so it no longer sits
 * on Stripe's clock — but it does sit on the function's, and a send still
 * running when the function is killed leaves the donation row claimed with no
 * receipt ever delivered. Well under the route's maxDuration so the failure
 * path gets a chance to run and release the claim.
 */
const SEND_DEADLINE_MS = 15_000

/**
 * The same escape hatch scripts/lib/notify.mjs has. Without it, a developer
 * running the app against the production database sends a real receipt to a
 * real donor from their laptop.
 */
const dry = () => process.env.NOTIFY_DRY === '1' || process.env.MAIL_DRY === '1'

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
  if (dry()) {
    console.log('[mail DRY] would send', JSON.stringify(opts.subject), 'to', opts.to.replace(/(.).*@/, '$1***@'))
    return
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      m.sendMail({ from: mailFrom(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`smtp deadline exceeded after ${SEND_DEADLINE_MS}ms`)), SEND_DEADLINE_MS)
      }),
    ])
  } finally {
    // Or the pending timer holds the event loop open past the response.
    if (timer) clearTimeout(timer)
  }
}
