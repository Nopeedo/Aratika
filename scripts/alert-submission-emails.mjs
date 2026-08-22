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
 *   minus alerts already sent (scripts/.state/submission-alerts.json — sha256
 *     hashes of user|bill so the committed state file identifies no one).
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
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const DRY = process.argv.includes('--dry-run')
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const STATE_PATH = join(here, '.state', 'submission-alerts.json')

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
  if (direct) { pairs.push({ userId: bm.user_id, bill: direct, href: bm.href }); continue }
  const mapped = DEFINING_MAP[bm.ref_id]
  if (!Array.isArray(mapped)) continue
  for (const slug of mapped) {
    const bill = bySlug.get(slug)
    // The editorial page is what they tracked and what they should come back
    // to, even where it covers several bills.
    if (bill) pairs.push({ userId: bm.user_id, bill, href: bm.href })
  }
}
console.log(`tracked-bill bookmarks: ${(bms || []).length} → matches on open bills: ${pairs.length}`)

// ── Dedupe against alerts already sent (opaque hashes only) ─────────────────
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : { sent: [] }
const sentSet = new Set(state.sent)
const keyOf = (userId, slug) => createHash('sha256').update(`${userId}|${slug}`).digest('hex').slice(0, 24)
const due = pairs.filter((p) => !sentSet.has(keyOf(p.userId, p.bill.slug)))
console.log(`already alerted: ${pairs.length - due.length} → due now: ${due.length}`)
if (due.length === 0) { console.log('Nothing to send.'); process.exit(0) }

// ── Resolve emails ──────────────────────────────────────────────────────────
const { data: usersPage, error: e2 } = await sb.auth.admin.listUsers({ perPage: 1000 })
if (e2) { console.error(e2.message); process.exit(1) }
const emailOf = new Map((usersPage?.users || []).map((u) => [u.id, u.email]))

const jobs = due.map((p) => ({ ...p, email: emailOf.get(p.userId) })).filter((p) => p.email)
// The link is logged because it is the part that was silently wrong: the send
// reported success while pointing every reader at the tracker index.
for (const j of jobs) console.log(`  → ${j.email}: "${j.bill.title.slice(0, 60)}" closes ${j.bill.submissionsClose} · link ${j.href || '/bills (no href on bookmark)'}`)

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
for (const j of jobs) {
  const { subject, text, html } = emailFor(j.bill, j.href)
  try {
    await transporter.sendMail({ from: `"Arapono" <${SMTP_USER}>`, to: j.email, subject, text, html })
    sentSet.add(keyOf(j.userId, j.bill.slug))
    sent++
    console.log(`✓ sent to ${j.email}`)
  } catch (err) {
    console.error(`✗ ${j.email} — ${err.message}`)
  }
}

mkdirSync(dirname(STATE_PATH), { recursive: true })
writeFileSync(STATE_PATH, JSON.stringify({ sent: [...sentSet] }, null, 1))
console.log(`\nDone. Sent ${sent}/${jobs.length}; state updated (${sentSet.size} total alerts recorded).`)
process.exit(0)
