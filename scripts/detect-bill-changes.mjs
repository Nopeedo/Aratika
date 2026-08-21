/**
 * detect-bill-changes.mjs — enqueue notifications when a TRACKED bill's status
 * changes. Runs after the daily bills refresh (refresh-bills.yml).
 *
 * Compares the freshly-built bills-54 statuses against the last-seen statuses
 * (scripts/.state/bill-status.json, committed), classifies each change, finds
 * the users who track that bill (bookmarks kind='bill', matched by slug →
 * normalised title → defining-bill map, exactly like the submission alerts), and
 * enqueues a notification per user:
 *   Royal Assent  → immediate ("passed into law")
 *   Terminated    → immediate ("did not proceed")
 *   any other move→ digest    ("advanced a stage")
 * First run just records a baseline (no notifications). Nothing is SENT here —
 * send-notifications.mjs delivers the queue.
 *
 * Run: node scripts/detect-bill-changes.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey, DRY } from './lib/notify.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
dotenv.config({ path: join(root, '.env.local') })

const STATE_PATH = join(here, '.state', 'bill-status.json')
const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

// ── Current bill statuses, from the daily-refreshed dataset ──────────────────
function loadBills() {
  const text = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  const line = text.split(/\r?\n/).find((l) => l.startsWith('export const BILLS_54:'))
  if (!line) throw new Error('BILLS_54 not found')
  return JSON.parse(line.slice(line.indexOf('[', line.indexOf('='))).replace(/;\s*$/, ''))
}
const bills = loadBills()
const current = Object.fromEntries(bills.map((b) => [b.slug, b.status]))

// ── Prior statuses (baseline). First run: record and exit. ───────────────────
if (!existsSync(STATE_PATH)) {
  if (!DRY) { mkdirSync(dirname(STATE_PATH), { recursive: true }); writeFileSync(STATE_PATH, JSON.stringify(current, null, 0)) }
  console.log(`Baseline recorded for ${bills.length} bills — no notifications on first run.`)
  process.exit(0)
}
const prior = JSON.parse(readFileSync(STATE_PATH, 'utf8'))

// ── What changed ─────────────────────────────────────────────────────────────
const changes = bills
  .filter((b) => prior[b.slug] && prior[b.slug] !== b.status)
  .map((b) => ({ slug: b.slug, title: b.title, from: prior[b.slug], to: b.status }))

console.log(`Bill status changes since last run: ${changes.length}`)
for (const c of changes) console.log(`  · ${c.title}: ${c.from} → ${c.to}`)

function classify(to) {
  if (/royal assent/i.test(to)) return { urgency: 'immediate', kind: 'passed', title: 'Passed into law', body: (t) => `${t} is now an Act.` }
  if (/terminat|withdraw|defeat|discharg|lapse|negativ/i.test(to)) return { urgency: 'immediate', kind: 'ended', title: 'Did not proceed', body: (t) => `${t} was ${to.toLowerCase()}.` }
  return { urgency: 'digest', kind: 'stage', title: 'Bill advanced', body: (t) => `${t} is now at: ${to}.` }
}

// ── Who tracks the changed bills ─────────────────────────────────────────────
if (changes.length > 0) {
  const changedBySlug = new Map(changes.map((c) => [c.slug, c]))
  const changedByTitle = new Map(changes.map((c) => [normTitle(c.title), c]))
  const DEFINING_MAP = JSON.parse(readFileSync(join(root, 'src/constants/defining-bill-map.json'), 'utf8'))

  const { data: bms, error } = await sb().from('bookmarks').select('user_id, ref_id, label').eq('kind', 'bill')
  if (error) { console.error(error.message); process.exit(1) }

  let enqueued = 0
  for (const bm of bms || []) {
    // Resolve this bookmark to a changed bill: slug → normalised title → defining map.
    let change = changedBySlug.get(bm.ref_id) || changedByTitle.get(normTitle(bm.label))
    if (!change) {
      const mapped = DEFINING_MAP[bm.ref_id]
      if (Array.isArray(mapped)) change = mapped.map((s) => changedBySlug.get(s)).find(Boolean)
    }
    if (!change) continue

    const c = classify(change.to)
    await enqueue({
      userId: bm.user_id,
      urgency: c.urgency,
      category: 'bill_status',
      dedup: dedupKey('bill_status', change.slug, change.to, bm.user_id),
      // The bookmark that matched — so the dashboard files it under that bill.
      entity: { kind: bm.kind, ref: bm.ref_id },
      title: c.title,
      body: c.body(change.title),
      url: '/bills',
    })
    enqueued++
  }
  console.log(`Enqueued ${enqueued} notification(s) across ${changes.length} changed bill(s).`)
}

// ── Record new baseline for next run ─────────────────────────────────────────
if (!DRY) writeFileSync(STATE_PATH, JSON.stringify(current, null, 0))
console.log(DRY ? 'Dry run — baseline not updated.' : 'Baseline updated.')
process.exit(0)
