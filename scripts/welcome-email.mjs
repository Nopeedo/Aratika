/**
 * welcome-email.mjs — send the one-off welcome email to newly confirmed accounts.
 *
 *   node scripts/welcome-email.mjs                  → DRY RUN (lists who would get it)
 *   node scripts/welcome-email.mjs --preview out.html → write the rendered email to a file
 *   node scripts/welcome-email.mjs --self you@x.nz  → send ONE real email to you (test)
 *   node scripts/welcome-email.mjs --send           → send for real
 *
 * SAFETY, in the order it matters:
 *
 *  1. Nothing is delivered without --send or --self. Same rule as newsletter.mjs.
 *  2. CONFIRMED ACCOUNTS ONLY. An unconfirmed address is one nobody has proved
 *     they own — it may be a typo of a real person's address, and mailing it
 *     hurts both them and our sending reputation.
 *  3. AGE CAP (--max-age-days, default 3). Without it the first real run emails
 *     every account that ever existed, and "welcome!" to someone who signed up
 *     two months ago reads as a breach, not a greeting. Older accounts are
 *     reported as skipped, not silently dropped, and --backfill overrides it
 *     deliberately.
 *  4. BATCH CAP (--max, default 200). A signup spike should not turn into an
 *     unbounded send in one run; the remainder is reported and goes next run.
 *
 * Dedup is notification_prefs.welcome_sent_at (migration 0017), not a committed
 * state file — the other detectors here dedup with files in scripts/.state/,
 * but this repo is public and a file listing accounts is a list of our users.
 */

import dotenv from 'dotenv'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { sb, emailUser, userEmailMap, maskEmail } from './lib/notify.mjs'
import { renderWelcome } from './welcome/template.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
dotenv.config({ path: join(root, '.env.local') })

const args = process.argv.slice(2)
const flagVal = (name) => {
  const eq = args.find((a) => a.startsWith(`${name}=`))
  if (eq) return eq.slice(name.length + 1)
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}

const SELF = flagVal('--self')
const PREVIEW = flagVal('--preview')
const LIVE = args.includes('--send') || !!SELF
const BACKFILL = args.includes('--backfill')
const MAX = Number(flagVal('--max') || 200)
const MAX_AGE_DAYS = BACKFILL ? Infinity : Number(flagVal('--max-age-days') || 3)

const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://politika.nz').replace(/\/$/, '')

// Dates come from the committed electoral calendar, never from memory. See the
// header of src/constants/electoral-calendar.ts: 2026 closes enrolment 13 days
// before polling day, which is NOT how 2023 worked, and getting it wrong here
// costs someone their vote.
const calendar = JSON.parse(readFileSync(join(root, 'src/constants/electoral-calendar.json'), 'utf8'))
const enrolMilestone = calendar.milestones.find((m) => /last day to enrol/i.test(m.label))
if (!enrolMilestone) {
  console.error('Could not find the enrolment-closing milestone in electoral-calendar.json. Refusing to send an email whose main point is that date.')
  process.exit(1)
}
const ENROLMENT_CLOSES = enrolMilestone.date
const ELECTION_DAY = calendar.electionDay
const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const daysToEnrolment = Math.round((Date.parse(`${ENROLMENT_CLOSES}T00:00:00Z`) - Date.parse(`${todayNZ}T00:00:00Z`)) / 864e5)

console.log(`Welcome email — ${todayNZ} (Pacific/Auckland)`)
console.log(`Enrolment closes ${ENROLMENT_CLOSES} (${daysToEnrolment} days) · election ${ELECTION_DAY}`)
console.log(LIVE ? (SELF ? `MODE: single test send to ${SELF}` : 'MODE: LIVE SEND') : 'MODE: dry run — nothing will be delivered')
console.log(BACKFILL ? 'BACKFILL: age cap disabled' : `Age cap: accounts confirmed within ${MAX_AGE_DAYS} day(s)`)
console.log('')

// ── A single test send, to an address given on the command line ──────────────
// Deliberately does not touch the database: it neither reads who is pending nor
// marks anyone as welcomed, so testing the template can never consume a real
// user's one-and-only welcome.
if (SELF) {
  const { subject, html, text } = renderWelcome({
    name: 'Nopera', siteUrl: SITE,
    unsubscribeUrl: `${SITE}/api/newsletter/unsubscribe?token=preview`,
    manageUrl: `${SITE}/settings`,
    enrolmentCloses: ENROLMENT_CLOSES, electionDay: ELECTION_DAY, daysToEnrolment,
  })
  const ok = await emailUser(SELF, subject, text, html)
  console.log(ok ? `Sent test to ${maskEmail(SELF)}.` : 'Mailer not configured (ZOHO_SMTP_USER / ZOHO_SMTP_PASS missing) — nothing sent.')
  process.exit(ok ? 0 : 1)
}

// ── Preview: render one and write it to a file, touching nothing ─────────────
// Above the database read on purpose. Looking at the email is how you decide
// whether to ship it, and that must not require the migration to be applied
// first — otherwise reviewing the copy is blocked on a schema change made to
// support sending copy nobody has reviewed.
if (PREVIEW) {
  const { subject, html } = renderWelcome({
    name: 'Nopera', siteUrl: SITE,
    unsubscribeUrl: `${SITE}/api/newsletter/unsubscribe?token=preview`,
    manageUrl: `${SITE}/settings`,
    enrolmentCloses: ENROLMENT_CLOSES, electionDay: ELECTION_DAY, daysToEnrolment,
  })
  writeFileSync(PREVIEW, html)
  console.log(`Subject: ${subject}`)
  console.log(`Preview written to ${PREVIEW}`)
  process.exit(0)
}

// ── Who is waiting ───────────────────────────────────────────────────────────
const { data: prefs, error } = await sb()
  .from('notification_prefs')
  .select('user_id, email_digest_enabled, unsubscribe_token, welcome_sent_at')
  .is('welcome_sent_at', null)
if (error) {
  // A failed read must not look like "nobody to welcome".
  console.error(`Could not read notification_prefs: ${error.message}`)
  console.error('If this says the column does not exist, apply supabase/migrations/0017_welcome_email.sql first.')
  process.exit(1)
}

const emails = await userEmailMap()

// listUsers gives confirmation status and signup time, which the prefs table
// does not carry. Both gates below need it.
const meta = new Map()
{
  let page = 1
  for (;;) {
    const { data, error: e } = await sb().auth.admin.listUsers({ page, perPage: 1000 })
    if (e) { console.error(`listUsers: ${e.message}`); process.exit(1) }
    for (const u of data.users) meta.set(u.id, { confirmed: u.email_confirmed_at, created: u.created_at })
    if (data.users.length < 1000) break
    page++
  }
}

const skipped = { unconfirmed: 0, tooOld: 0, noEmail: 0, optedOut: 0 }
const pending = []
for (const r of prefs || []) {
  const m = meta.get(r.user_id)
  const address = emails.get(r.user_id)
  if (!address) { skipped.noEmail++; continue }
  if (!m?.confirmed) { skipped.unconfirmed++; continue }
  // An explicit opt-out is respected even for this one. Someone who turned
  // emails off between signing up and this run has told us something.
  if (r.email_digest_enabled === false) { skipped.optedOut++; continue }
  const ageDays = (Date.now() - Date.parse(m.confirmed)) / 864e5
  if (ageDays > MAX_AGE_DAYS) { skipped.tooOld++; continue }
  pending.push({ userId: r.user_id, address, token: r.unsubscribe_token, ageDays })
}

pending.sort((a, b) => a.ageDays - b.ageDays)
const overflow = Math.max(0, pending.length - MAX)
const batch = pending.slice(0, MAX)

console.log(`Never welcomed: ${(prefs || []).length}`)
console.log(`  skipped — unconfirmed ${skipped.unconfirmed} · older than cap ${skipped.tooOld} · opted out ${skipped.optedOut} · no address ${skipped.noEmail}`)
console.log(`  eligible: ${pending.length}${overflow ? ` (sending ${batch.length}, ${overflow} next run)` : ''}\n`)

if (!batch.length) { console.log('Nobody to welcome.'); process.exit(0) }

if (!LIVE) {
  for (const u of batch) console.log(`  [DRY] ${maskEmail(u.address)}  confirmed ${u.ageDays.toFixed(1)}d ago`)
  console.log(`\nDry run — ${batch.length} email(s) would be sent. Re-run with --send.`)
  process.exit(0)
}

// ── Send ─────────────────────────────────────────────────────────────────────
let sent = 0, failed = 0
for (const u of batch) {
  const { subject, html, text } = renderWelcome({
    name: null, siteUrl: SITE,
    unsubscribeUrl: `${SITE}/api/newsletter/unsubscribe?token=${u.token}`,
    manageUrl: `${SITE}/settings`,
    enrolmentCloses: ENROLMENT_CLOSES, electionDay: ELECTION_DAY, daysToEnrolment,
  })

  let ok = false
  try { ok = await emailUser(u.address, subject, text, html) } catch (e) {
    console.error(`  ✗ ${maskEmail(u.address)}: ${String(e?.message || e).slice(0, 140)}`)
  }
  if (!ok) { failed++; continue }

  // Stamp only AFTER a successful send. The other order — mark then send —
  // loses the email entirely if the send throws, and a welcome that silently
  // never arrives is indistinguishable from one that was never due.
  const { error: e2 } = await sb()
    .from('notification_prefs')
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq('user_id', u.userId)
  if (e2) {
    // Sent but not recorded: the next run will send a second copy. Say so
    // loudly rather than let a duplicate arrive with no explanation.
    console.error(`  ⚠ ${maskEmail(u.address)}: sent, but could not stamp welcome_sent_at (${e2.message}). This user may receive a duplicate.`)
  }
  sent++
  console.log(`  ✓ ${maskEmail(u.address)}`)
}

console.log(`\nSent ${sent}${failed ? `, ${failed} failed` : ''}.${overflow ? ` ${overflow} remaining for the next run.` : ''}`)
process.exit(failed ? 1 : 0)
