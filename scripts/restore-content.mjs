/**
 * restore-content.mjs — restore content_items from a backup snapshot.
 *
 * Reads an UNZIPPED backup JSON (see backup-content.mjs / RESTORE-RUNBOOK.md) and
 * upserts rows by id. DRY RUN by default: prints what would change and how the
 * snapshot compares to the live table, writes nothing. Pass --apply to write.
 *
 *   node scripts/restore-content.mjs ./content_items.latest.json          # dry run
 *   node scripts/restore-content.mjs ./content_items.latest.json --apply  # write
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const APPLY = process.argv.includes('--apply')
const file = process.argv.find((a) => a.endsWith('.json'))
if (!file) { console.error('usage: node scripts/restore-content.mjs <snapshot.json> [--apply]'); process.exit(1) }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const snapshot = JSON.parse(readFileSync(file, 'utf8'))
if (!Array.isArray(snapshot)) { console.error('snapshot is not an array of rows'); process.exit(1) }
console.log(`snapshot: ${snapshot.length} rows from ${file}`)

// Compare against live to show what a restore would touch.
const liveIds = new Set()
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('content_items').select('id').order('id').range(from, from + 999)
  if (error) { console.error(error.message); process.exit(1) }
  for (const r of data) liveIds.add(r.id)
  if (data.length < 1000) break
}
const missingFromLive = snapshot.filter((r) => !liveIds.has(r.id)).length
console.log(`live table: ${liveIds.size} rows`)
console.log(`in snapshot but MISSING from live (a restore would re-create these): ${missingFromLive}`)
console.log(`in snapshot AND live (a restore would overwrite with the backup version): ${snapshot.length - missingFromLive}`)

if (!APPLY) {
  console.log('\n(dry run — nothing written. Re-run with --apply to restore.)')
  process.exit(0)
}

let ok = 0, err = 0
for (let i = 0; i < snapshot.length; i += 100) {
  const batch = snapshot.slice(i, i + 100)
  const { error } = await sb.from('content_items').upsert(batch, { onConflict: 'id' })
  if (error) { console.error(`batch ${i}: ${error.message}`); err += batch.length } else ok += batch.length
  process.stdout.write(`\r  upserted ${ok}/${snapshot.length}`)
}
console.log(`\nRestore complete: ${ok} upserted, ${err} failed.`)
process.exit(err ? 1 : 0)
