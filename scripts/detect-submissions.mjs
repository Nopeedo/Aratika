/**
 * detect-submissions.mjs — enqueue an IMMEDIATE notification when a bill a user
 * tracks opens for public submissions. Runs after the daily bills refresh.
 *
 * This is the one notification with a real deadline attached: select committee
 * is the point where an ordinary person can actually act on a bill, and the
 * window shuts on a fixed date. It already existed as an EMAIL job
 * (alert-submission-emails.mjs), which needs SMTP credentials that aren't
 * configured — so in practice nobody has ever been told. This puts it on the
 * push channel that works, and leaves the email job alone for when SMTP lands.
 *
 * No state file, unlike detect-bill-changes. The queue's unique
 * (user_id, dedup_key) already guarantees one notification per user per window,
 * and keying the dedup on the CLOSING DATE means a genuinely re-opened or
 * extended window notifies once more rather than being swallowed as a repeat.
 *
 * Bookmark → bill matching is the same three-step the rest of the codebase uses
 * (slug → normalised title → defining-bill map), because bills get tracked from
 * pages backed by different datasets and slugs don't always line up.
 *
 * Run: node scripts/detect-submissions.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey } from './lib/notify.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

/** "13 August 2026" — a deadline should read like a date, not an ISO string. */
function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function loadBills() {
  const text = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  const line = text.split(/\r?\n/).find((l) => l.startsWith('export const BILLS_54:'))
  if (!line) throw new Error('BILLS_54 not found')
  return JSON.parse(line.slice(line.indexOf('[', line.indexOf('='))).replace(/;\s*$/, ''))
}

const open = loadBills().filter((b) => b.submissionsCalled && b.submissionsClose && b.submissionsClose >= todayNZ)
console.log(`Bills currently open for submissions: ${open.length}`)
if (open.length === 0) process.exit(0)

const openBySlug = new Map(open.map((b) => [b.slug, b]))
const openByTitle = new Map(open.map((b) => [normTitle(b.title), b]))
const DEFINING_MAP = JSON.parse(readFileSync(join(root, 'src/constants/defining-bill-map.json'), 'utf8'))

const { data: bms, error } = await sb().from('bookmarks').select('user_id, ref_id, label').eq('kind', 'bill')
if (error) { console.error(error.message); process.exit(1) }

let enqueued = 0
for (const bm of bms || []) {
  let bill = openBySlug.get(bm.ref_id) || openByTitle.get(normTitle(bm.label))
  if (!bill) {
    // An editorial topic can span several bills — prefer one that is actually
    // open, since that is the one the reader can act on.
    const mapped = DEFINING_MAP[bm.ref_id]
    if (Array.isArray(mapped)) bill = mapped.map((s) => openBySlug.get(s)).find(Boolean)
  }
  if (!bill) continue

  await enqueue({
    userId: bm.user_id,
    urgency: 'immediate',
    category: 'bill_submission',
    dedup: dedupKey('bill_submission', bill.slug, bill.submissionsClose, bm.user_id),
    title: 'You can have your say',
    body: `${bill.title} is open for public submissions until ${fmtDate(bill.submissionsClose)}. You don’t need to be an expert.`,
    url: '/bills',
  })
  enqueued++
}
console.log(`Enqueued ${enqueued} submission notification(s) across ${open.length} open bill(s).`)
process.exit(0)
