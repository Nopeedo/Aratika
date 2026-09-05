/**
 * alert-submission-emails.mjs — email users when a bill they track opens for
 * public submissions.
 *
 * The one notification worth sending: rare (a handful of bills at a time),
 * genuinely actionable (a real deadline), and squarely the mission — turning
 * information into participation. Deliberately NOT a news digest; no marketing.
 *
 * How it decides who gets what:
 *   open bills (bills-54.ts: submissionsCalled && close date not passed)
 *   × bookmarks (kind='bill', matched by slug then normalised title — the same
 *     fallback the command centre uses)
 *   × auth users (email from Supabase admin API)
 *   minus alerts already sent (public.email_alerts — see 0015).
 *
 * Dedupe lives in the DATABASE, not in a committed state file. It used to be
 * scripts/.state/submission-alerts.json, written after each send and committed
 * back by the ingest workflow. That made "has this person already been emailed?"
 * depend on a git push succeeding inside CI, and when the push lost a race the
 * file simply never appeared — leaving the job ready to re-send the same email
 * every morning. Exactly that happened on 21 August 2026.
 *
 * The claim is the INSERT: the primary key on (user_id, dedup_key) means two
 * concurrent runs cannot both win, and nothing depends on a later write landing.
 * If the send then throws, the claim is deleted so a future run retries.
 *
 * Sends via the existing hello@arapono.org.nz Zoho mailbox (SMTP, SPF/DKIM
 * already verified) — no third-party mail provider. Needs ZOHO_SMTP_USER and
 * ZOHO_SMTP_PASS (a Zoho app-specific password); exits cleanly if absent so
 * the CI step never fails while credentials are pending.
 *
 * Run: node scripts/alert-submission-emails.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const DRY = process.argv.includes('--dry-run')
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const ALERT_KIND = 'bill_submission'

/** Parliament's own id for a bill, out of its bills.parliament.nz URL.
 *
 *  NOT the slug. bills-54.ts slugs are derived from the title and rebuilt every
 *  morning, and bills get retitled — commonly at select committee, which is the
 *  exact stage this email fires on. A retitle would change the slug, miss the
 *  ledger, and re-email everyone tracking it. The GUID never moves.
 *
 *  Falls back to the slug if the URL shape ever changes, which restores the old
 *  rename-resends behaviour rather than silently keying everything to one value. */
function billKey(bill) {
  const m = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(bill.officialUrl || '')
  return m ? m[1] : bill.slug
}

/** One alert per (bookmark, bill).
 *
 *  Keyed on the BOOKMARK's ref_id, not the bill's slug: they are different slug
 *  spaces and this pair matched on title, not id. The bookmark tracked
 *  "bill-members-2026-302" while bills-54 calls the same bill
 *  "criminal-records-clean-slate-additional-eligibility-amendment-bill".
 *
 *  The bill is in the key too because one editorial "defining bill" bookmark can
 *  span several real bills, and each open window is its own thing to tell
 *  someone about.
 *
 *  No closing date, unlike detect-submissions.mjs, which includes it so a
 *  re-opened window notifies again. Right for push: cheap, dismissible. Wrong
 *  for email — Parliament corrects close dates, and every correction would put a
 *  second copy of the same message in every tracker's inbox. Email errs toward
 *  once, ever; a genuinely re-opened window still reaches them by push. */
const keyOf = (refId, bill) => `${ALERT_KIND}:${refId}:${billKey(bill)}`

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ── Open bills, from the daily-refreshed Parliament dataset ──────────────────
function loadBills() {
  const text = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  const line = text.split(/\r?\n/).find((l) => l.startsWith('export const BILLS_54:'))
  if (!line) throw new Error('BILLS_54 not found')
  return JSON.parse(line.slice(line.indexOf('[', line.indexOf('='))).replace(/;\s*$/, ''))
}
const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const openBills = loadBills().filter((b) => b.submissionsCalled && b.submissionsClose && b.submissionsClose >= todayNZ)
console.log(`bills currently open for submissions: ${openBills.length}`)
const bySlug = new Map(openBills.map((b) => [b.slug, b]))
const byTitle = new Map(openBills.map((b) => [normTitle(b.title), b]))

// Editorial "defining bills" pages use names that match nothing in the
// Parliament dataset — resolve those through the shared hand-written map.
// One editorial topic can span several bills; alert on every open one.
const DEFINING_MAP = JSON.parse(readFileSync(join(root, 'src/constants/defining-bill-map.json'), 'utf8'))

// ── Who tracks them ──────────────────────────────────────────────────────────
// `href` comes along because it is the page the reader tracked the bill from,
// and the only link that reliably resolves. This email used to send everyone to
// /bills, the whole tracker, leaving them to find their bill in a list of 270 —
// and /bills/[slug] is not a substitute: it serves the ten curated bills and the
// defining ones, so /bills/bill-government-2026-259 is a 404. The bookmark knows
// (/bills/… for curated, /legislation/… for the register), so ask it.
const { data: bms, error: e1 } = await sb.from('bookmarks').select('user_id, ref_id, label, href').eq('kind', 'bill')
if (e1) { console.error(e1.message); process.exit(1) }
const pairs = []
for (const bm of bms || []) {
  const direct = bySlug.get(bm.ref_id) || byTitle.get(normTitle(bm.label))
  if (direct) { pairs.push({ userId: bm.user_id, refId: bm.ref_id, bill: direct, href: bm.href }); continue }
  const mapped = DEFINING_MAP[bm.ref_id]
  if (!Array.isArray(mapped)) continue
  for (const slug of mapped) {
    const bill = bySlug.get(slug)
    // The editorial page is what they tracked and what they should come back
    // to, even where it covers several bills.
    if (bill) pairs.push({ userId: bm.user_id, refId: bm.ref_id, bill, href: bm.href })
  }
}
console.log(`tracked-bill bookmarks: ${(bms || []).length} → matches on open bills: ${pairs.length}`)

// ── Dedupe against alerts already sent ───────────────────────────────────────
// A cheap pre-filter so the log reads honestly and we don't attempt a claim per
// bookmark every morning. It is NOT the safety net — the primary key is. Two
// runs overlapping would both pass this filter and only one would win the claim.
const { data: already, error: e3 } = await sb
  .from('email_alerts')
  .select('user_id, dedup_key')
  .eq('kind', ALERT_KIND)
if (e3) { console.error(`email_alerts unreadable: ${e3.message}`); process.exit(1) }
const sentSet = new Set((already || []).map((r) => `${r.user_id}|${r.dedup_key}`))
const due = pairs.filter((p) => !sentSet.has(`${p.userId}|${keyOf(p.refId, p.bill)}`))
console.log(`already alerted: ${pairs.length - due.length} → due now: ${due.length}`)
if (due.length === 0) { console.log('Nothing to send.'); process.exit(0) }

// ── Resolve emails ──────────────────────────────────────────────────────────
const { data: usersPage, error: e2 } = await sb.auth.admin.listUsers({ perPage: 1000 })
if (e2) { console.error(e2.message); process.exit(1) }
const emailOf = new Map((usersPage?.users || []).map((u) => [u.id, u.email]))

/** First segment of a user id — enough to follow one recipient through a run. */
const short = (id) => String(id ?? '').slice(0, 8)

/**
 * Honour the one email switch the settings page offers.
 *
 * These alerts used to ignore notification_prefs entirely. Someone who turned
 * the weekly email off in Settings — or used the one-click unsubscribe at the
 * bottom of one of our own emails — kept receiving these, because they were
 * selected from tracked bills and account addresses and nothing else. There is
 * one switch in the UI, so a person who turns it off has said no to email from
 * us, and this was not listening.
 *
 * Same rule the newsletter uses: absent or true means send, and only an
 * explicit false opts out — so an account that has never touched the setting
 * still gets alerts for bills it deliberately chose to follow.
 */
const { data: prefsRows, error: e4 } = await sb.from('notification_prefs').select('user_id, email_digest_enabled')
if (e4) { console.error(`notification_prefs unreadable: ${e4.message}; not sending`); process.exit(1) }
const optedOut = new Set((prefsRows || []).filter((r) => r.email_digest_enabled === false).map((r) => r.user_id))

const withEmail = due.map((p) => ({ ...p, email: emailOf.get(p.userId) })).filter((p) => p.email)
const jobs = withEmail.filter((p) => !optedOut.has(p.userId))
const suppressed = withEmail.length - jobs.length
if (suppressed > 0) console.log(`${suppressed} alert(s) suppressed — recipient has email turned off`)
if (jobs.length === 0) { console.log('Nothing to send after preferences.'); process.exit(0) }
// The link is logged because it is the part that was silently wrong: the send
// reported success while pointing every reader at the tracker index.
// Logged by user id, never by address. This runs as a GitHub Action on a
// PUBLIC repository, so every line here is readable by anyone: printing a
// subscriber's email beside the bill they follow published a named person's
// political interest, daily, to the open internet. The id is traceable in the
// database and inert outside it.
for (const j of jobs) console.log(`  → user ${short(j.userId)}: "${j.bill.title.slice(0, 60)}" closes ${j.bill.submissionsClose} · link ${j.href || '/bills (no href on bookmark)'}`)

if (DRY) { console.log('\n(dry run — nothing sent, state unchanged)'); process.exit(0) }

// ── Send ────────────────────────────────────────────────────────────────────
const SMTP_USER = process.env.ZOHO_SMTP_USER, SMTP_PASS = process.env.ZOHO_SMTP_PASS
if (!SMTP_USER || !SMTP_PASS) {
  console.log('ZOHO_SMTP_USER / ZOHO_SMTP_PASS not set — skipping send (state unchanged). Add the secrets to enable alerts.')
  process.exit(0)
}
const transporter = nodemailer.createTransport({ host: 'smtp.zoho.com.au', port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })

const SITE = 'https://arapono.org.nz'

const emailFor = (bill, href) => {
  const closes = fmtDate(bill.submissionsClose)
  // Falls back to the tracker only when a bookmark predates href being stored.
  const billUrl = `${SITE}${href || '/bills'}`
  const member = bill.member ? bill.member.split(',').reverse().join(' ').replace(/\b(Rt\s+Hon|Hon|Dr)\b\.?/g, '').replace(/\s+/g, ' ').trim() : null
  const subject = `Have your say: ${bill.title} is open for submissions`
  const text = [
    `A bill you're tracking on Arapono is now open for public submissions.`,
    ``,
    `${bill.title}`,
    bill.committee ? `Select committee: ${bill.committee}` : null,
    member ? `Member in charge: ${member}` : null,
    `Submissions close: ${closes}`,
    ``,
    `Anyone can make a submission — you don't need to be an expert.`,
    ``,
    `Make a submission at Parliament: ${bill.officialUrl}`,
    `Read our plain-language breakdown: ${billUrl}`,
    ``,
    `You're receiving this because you track this bill on Arapono. To stop, untrack it in your command centre: ${SITE}/dashboard`,
    `Arapono is free and non-partisan. We take no position on this bill.`,
  ].filter((l) => l !== null).join('\n')
  const html = `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#17231b">
    <p style="font-size:13px;font-weight:700;color:#1F8A4C;letter-spacing:.04em;text-transform:uppercase;margin:24px 0 6px">Have your say</p>
    <h1 style="font-size:20px;line-height:1.3;margin:0 0 14px">${bill.title} is open for public submissions</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 6px">A bill you're tracking on Arapono has reached the stage where the public can weigh in. Anyone can make a submission — you don't need to be an expert.</p>
    <table style="font-size:14px;line-height:1.7;margin:14px 0;border-left:3px solid #1F8A4C;padding-left:12px" role="presentation"><tbody>
      ${bill.committee ? `<tr><td style="color:#667066;padding-right:10px">Committee</td><td>${bill.committee}</td></tr>` : ''}
      ${member ? `<tr><td style="color:#667066;padding-right:10px">Member in charge</td><td>${member}</td></tr>` : ''}
      <tr><td style="color:#667066;padding-right:10px">Closes</td><td><b>${closes}</b></td></tr>
    </tbody></table>
    <p style="margin:20px 0"><a href="${bill.officialUrl}" style="background:#1F8A4C;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px;display:inline-block">Make a submission at Parliament</a></p>
    <p style="font-size:13px;margin:0 0 24px"><a href="${billUrl}" style="color:#1F8A4C">Read our plain-language breakdown first →</a></p>
    <p style="font-size:12px;color:#667066;line-height:1.6;border-top:1px solid #e4ebe2;padding-top:12px">You're receiving this because you track this bill on Arapono. <a href="${SITE}/dashboard" style="color:#667066">Untrack it</a> to stop these alerts. Arapono is free and non-partisan — we take no position on this bill.</p>
  </div>`
  return { subject, text, html }
}

let sent = 0
let skipped = 0
for (const j of jobs) {
  const dedup = keyOf(j.refId, j.bill)

  // Claim BEFORE sending. The insert either succeeds (we own this send) or
  // violates the primary key (someone already sent it, or a concurrent run just
  // did). Claiming afterwards would leave a window where the mail is out and
  // nothing records it — which is the failure we are here to remove.
  const { error: claimErr } = await sb
    .from('email_alerts')
    .insert({ user_id: j.userId, dedup_key: dedup, kind: ALERT_KIND })
  if (claimErr) {
    // 23505 = unique_violation. Anything else is a real fault, and sending
    // without a durable record is how people get emailed twice, so don't.
    if (claimErr.code === '23505') { skipped++; console.log(`· already claimed, skipping user ${short(j.userId)}`) }
    else console.error(`✗ user ${short(j.userId)} — could not claim (${claimErr.message}); not sending`)
    continue
  }

  const { subject, text, html } = emailFor(j.bill, j.href)
  try {
    await transporter.sendMail({ from: `"Arapono" <${SMTP_USER}>`, to: j.email, subject, text, html })
    sent++
    console.log(`✓ sent to user ${short(j.userId)}`)
  } catch (err) {
    // Release the claim so a later run retries. Better a possible duplicate
    // after a genuine SMTP failure than an alert silently never sent.
    const { error: relErr } = await sb.from('email_alerts').delete().eq('user_id', j.userId).eq('dedup_key', dedup)
    console.error(`✗ user ${short(j.userId)} — ${err.message}${relErr ? ` (claim NOT released: ${relErr.message})` : ' (claim released, will retry)'}`)
  }
}

console.log(`\nDone. Sent ${sent}/${jobs.length}${skipped ? `, ${skipped} already claimed` : ''}. Dedupe is in public.email_alerts — no state file to commit.`)
process.exit(0)
