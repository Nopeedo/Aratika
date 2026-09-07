/**
 * restore-pending-positions.mjs — put back positions a bulk re-draft took off
 * the live site.
 *
 * WHY THIS EXISTS
 *
 * draft-positions.mjs --if-changed sets a changed row to status='pending', and
 * the site renders ONLY status='approved' (src/lib/positions/live.ts:109). One
 * row at a time that is exactly right: an editor reviews it and re-approves.
 * Across a cohort it is not, because /policies/[topic] does not quietly omit a
 * missing party — policy-comparison.tsx renders "No position on economy
 * recorded yet for National, Labour, Green, ACT, NZ First, Te Pāti Māori",
 * which is a false statement about six parties, two months from an election.
 *
 * That happened on 8 Sep 2026 when the source-widening catch-up ran across a
 * party cohort. Without --replace the reader-facing text (stance, summaryBasic,
 * summary) is untouched, so re-approving restores exactly what was public;
 * what has changed underneath is the breakdown and excerpts, drawn from the same
 * parties' own pages by the same grounded pipeline and still subject to the
 * exact-substring check on quotes.
 *
 * This is a RECOVERY tool, not part of any pipeline. It takes an explicit list
 * of source_ids — never a broad "approve everything pending" — because the
 * editorial gate is the product, and a script that can empty the review queue in
 * one command is a bigger hazard than the thing it fixes.
 *
 * Run: node scripts/restore-pending-positions.mjs            (dry run)
 *      node scripts/restore-pending-positions.mjs --confirm  (writes)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const CONFIRM = process.argv.includes('--confirm')

/**
 * The exact rows the 8 Sep 2026 cohort run flipped. Hardcoded rather than
 * derived from a status/date query on purpose: a query would also sweep up rows
 * that were pending for legitimate editorial reasons and publish them.
 */
const DEFAULT_IDS = [
  'national-economy-2026',
  'labour-economy-2026',
  'green-economy-2026',
  'act-economy-2026',
  'nzfirst-economy-2026',
  'tpm-economy-2026',
  'labour-housing-2026',
  'green-housing-2026',
]

// --ids=a,b,c overrides the list. Still explicit: there is deliberately no
// "restore everything pending" mode, because that would let one command empty
// the review queue, and the queue is the product's credibility.
const idsArg = (process.argv.find((a) => a.startsWith('--ids=')) || '').slice('--ids='.length)
const SOURCE_IDS = idsArg ? idsArg.split(',').map((x) => x.trim()).filter(Boolean) : DEFAULT_IDS

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: rows, error } = await sb
  .from('content_items')
  .select('id, source_id, status, updated_at, source_url')
  .eq('type', 'position')
  .in('source_id', SOURCE_IDS)

if (error) { console.error(`Query failed: ${error.message}`); process.exit(1) }

console.log(`Targeting ${SOURCE_IDS.length} row(s); found ${rows.length}.\n`)

const missing = SOURCE_IDS.filter((s) => !rows.some((r) => r.source_id === s))
if (missing.length) console.warn(`  ⚠ not found: ${missing.join(', ')}\n`)

const toFix = rows.filter((r) => r.status === 'pending')
const already = rows.filter((r) => r.status !== 'pending')

for (const r of already) console.log(`  · ${r.source_id.padEnd(26)} already ${r.status} — leaving alone`)
for (const r of toFix) console.log(`  → ${r.source_id.padEnd(26)} pending → approved`)

if (!toFix.length) { console.log('\nNothing to restore.'); process.exit(0) }

if (!CONFIRM) {
  console.log(`\nDRY RUN — ${toFix.length} row(s) would be restored. Re-run with --confirm to write.`)
  process.exit(0)
}

let ok = 0
for (const r of toFix) {
  const { error: e } = await sb.from('content_items').update({ status: 'approved' }).eq('id', r.id)
  if (e) { console.error(`  ✗ ${r.source_id}: ${e.message}`); continue }
  ok++
}

// Read the result back rather than trusting the write count. Reporting success
// from the absence of an error is how this project has been burned repeatedly.
const { count } = await sb
  .from('content_items')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'position').eq('status', 'pending')

console.log(`\nRestored ${ok} of ${toFix.length}. Positions still pending site-wide: ${count}.`)
process.exit(ok === toFix.length ? 0 : 1)
