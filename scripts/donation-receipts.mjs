/**
 * donation-receipts.mjs — email a receipt for every donation that hasn't had one.
 *
 * Donations arrive in public.donations (migration 0020) from /api/stripe/webhook
 * when Stripe reports a completed Checkout session. This sends each
 * one a receipt from hello@politika.nz through the same Zoho mailer as the
 * welcome email and newsletter (scripts/lib/notify.mjs), then stamps
 * receipt_sent_at so it never goes twice. Runs every 10 minutes from
 * .github/workflows/donation-receipts.yml.
 *
 * DRY BY DEFAULT: lists what it would send and sends nothing.
 *   node scripts/donation-receipts.mjs                 → dry run
 *   node scripts/donation-receipts.mjs --send          → send for real
 *   node scripts/donation-receipts.mjs --preview a.html → render a sample receipt to a file
 *
 * A send that fails records receipt_error and counts an attempt; after five
 * attempts a donation is left alone (and shows in the log) rather than
 * retried every ten minutes forever.
 */

import dotenv from 'dotenv'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, emailUser, maskEmail, emailConfigured } from './lib/notify.mjs'
import { renderReceipt } from './donation-receipt/template.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local'), quiet: true })

const args = process.argv.slice(2)
const LIVE = args.includes('--send')
const previewAt = args.indexOf('--preview')
const PREVIEW = previewAt >= 0 ? args[previewAt + 1] : null
const MAX_ATTEMPTS = 5
const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://politika.nz').replace(/\/$/, '')

if (PREVIEW) {
  const { subject, html } = renderReceipt({
    name: 'Aroha Smith', amountCents: 2500, currency: 'nzd', reference: 'POL-3F9A21BC',
    paidAt: new Date().toISOString(), siteUrl: SITE,
  })
  writeFileSync(PREVIEW, html)
  console.log(`Wrote "${subject}" to ${PREVIEW}`)
  process.exit(0)
}

// Nothing to do when donations are off. The schedule kept running against a
// two-row table through the whole period DONATIONS_ENABLED was false.
//
// Read the REAL constant, not an env var. The first version of this guard
// checked process.env.DONATIONS_ENABLED, which this workflow does not set and
// which exists nowhere outside constants/features.ts — so it would have exited
// every single time and silently stopped sending receipts. Node strips the
// types on import, so the script can read the same flag the site reads and the
// two cannot drift.
//
// Fails OPEN. If the import ever breaks, this continues and sends; a missed
// receipt is worse than a wasted run.
//
// Scheduled runs only — a manual workflow_dispatch still goes through, so a
// catch-up right after switching donations on is unaffected.
const scheduled = !process.env.GITHUB_EVENT_NAME || process.env.GITHUB_EVENT_NAME === 'schedule'
if (scheduled) {
  let donationsOn = true
  try {
    ;({ DONATIONS_ENABLED: donationsOn } = await import('../src/constants/features.ts'))
  } catch (e) {
    console.warn('could not read DONATIONS_ENABLED, continuing:', e.message)
  }
  if (donationsOn !== true) {
    console.log('DONATIONS_ENABLED is false — nothing to send.')
    process.exit(0)
  }
}

if (LIVE && !emailConfigured()) {
  console.error('ZOHO_SMTP_USER / ZOHO_SMTP_PASS not set: receipts cannot be sent.')
  process.exit(1)
}

const { data: queue, error } = await sb()
  .from('donations')
  .select('id, stripe_session_id, reference, amount_cents, currency, donor_email, donor_name, paid_at, received_at, receipt_attempts')
  .is('receipt_sent_at', null)
  .lt('receipt_attempts', MAX_ATTEMPTS)
  .order('received_at', { ascending: true })
  .limit(100)

if (error) {
  console.error('Could not read the donations queue:', error.message)
  process.exit(1)
}

console.log(`${queue.length} donation${queue.length === 1 ? '' : 's'} waiting for a receipt${LIVE ? '' : ' (dry run, sending nothing)'}`)

let sent = 0, failed = 0, skipped = 0
for (const d of queue) {
  const label = `${d.reference} $${(d.amount_cents / 100).toFixed(2)} → ${d.donor_email ? maskEmail(d.donor_email) : '(no email)'}`
  if (!d.donor_email) {
    // Nothing to send to. Mark it handled so it doesn't sit in the queue.
    skipped++
    console.log(`  skip  ${label}`)
    if (LIVE) await sb().from('donations').update({ receipt_error: 'no donor email', receipt_attempts: MAX_ATTEMPTS }).eq('id', d.id)
    continue
  }
  const { subject, html, text } = renderReceipt({
    name: d.donor_name, amountCents: d.amount_cents, currency: d.currency,
    reference: d.reference, paidAt: d.paid_at || d.received_at, siteUrl: SITE,
  })
  if (!LIVE) { console.log(`  would send  ${label}`); continue }

  // CLAIM BEFORE SENDING. The queue above is a single snapshot, and each send
  // takes seconds, so by the time this loop reaches a row the webhook may
  // already have receipted it. Sending straight from the snapshot would post
  // a second receipt for the same donation. /api/stripe/webhook claims the
  // same way; a guard only one of two senders respects is not a guard.
  let claimedAt = null
  try {
    claimedAt = new Date().toISOString()
    const { data: mine } = await sb().from('donations')
      .update({ receipt_sent_at: claimedAt, receipt_error: null })
      .eq('id', d.id).is('receipt_sent_at', null).select('id')
    if (!mine || mine.length === 0) {
      claimedAt = null
      skipped++
      console.log(`  taken  ${label}: already receipted`)
      continue
    }

    const ok = await emailUser(d.donor_email, subject, text, html)
    if (!ok) throw new Error('mailer not configured')
    sent++
    console.log(`  sent  ${label}`)
  } catch (e) {
    failed++
    const msg = String(e?.message || e).slice(0, 300)
    // Release only the claim this iteration took.
    let q = sb().from('donations')
      .update({ receipt_sent_at: null, receipt_error: msg, receipt_attempts: (d.receipt_attempts || 0) + 1 })
      .eq('id', d.id)
    if (claimedAt) q = q.eq('receipt_sent_at', claimedAt)
    await q
    console.log(`  FAIL  ${label}: ${msg}`)
  }
}

console.log(`Done: ${sent} sent, ${failed} failed, ${skipped} skipped.`)
if (failed > 0) process.exit(1)
