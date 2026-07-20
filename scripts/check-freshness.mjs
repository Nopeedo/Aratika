/**
 * check-freshness.mjs — the staleness alarm.
 *
 * Why this exists: in July 2026 the ingest pipeline silently stopped for nine
 * days and nobody noticed, because nothing was watching. This script checks how
 * old the newest row of each live data type is and FAILS (exit 1) when anything
 * is past its limit — so the scheduled workflow goes red and GitHub emails us.
 *
 * `news` is the canary: real political news lands every single day, so if it
 * hasn't updated in 36h the ingest is broken, full stop. The other feeds get
 * generous limits because genuine quiet periods exist (poll gaps, parliamentary
 * recess), and a false alarm every week would train us to ignore it.
 *
 * Run: node scripts/check-freshness.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

// maxHours tuned so only a real outage trips it — not a quiet news week.
const CHECKS = [
  { type: 'news',        label: 'News',        maxHours: 36,      note: 'canary — should land daily' },
  { type: 'video',       label: 'Videos',      maxHours: 24 * 10, note: 'parties post irregularly' },
  { type: 'poll',        label: 'Polls',       maxHours: 24 * 30, note: 'published roughly monthly' },
  { type: 'legislation', label: 'Legislation', maxHours: 24 * 21, note: 'gaps over parliamentary recess' },
]

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

function fmtAge(ms) {
  const h = ms / 36e5
  return h < 48 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`
}

const now = Date.now()
const failures = []
console.log(`Data freshness check — ${new Date(now).toISOString()}\n`)

for (const c of CHECKS) {
  const { data, error } = await sb
    .from('content_items')
    .select('created_at')
    .eq('type', c.type)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) { failures.push(`${c.label}: query failed — ${error.message}`); console.log(`  ✗ ${c.label.padEnd(12)} query error: ${error.message}`); continue }
  if (!data?.length) { failures.push(`${c.label}: no rows at all`); console.log(`  ✗ ${c.label.padEnd(12)} NO ROWS`); continue }

  const ageMs = now - new Date(data[0].created_at).getTime()
  const stale = ageMs > c.maxHours * 36e5
  const mark = stale ? '✗' : '✓'
  console.log(`  ${mark} ${c.label.padEnd(12)} newest ${fmtAge(ageMs).padStart(7)} ago   (limit ${c.maxHours}h — ${c.note})`)
  if (stale) failures.push(`${c.label}: newest item is ${fmtAge(ageMs)} old (limit ${c.maxHours}h)`)
}

if (failures.length) {
  console.error(`\nSTALE DATA DETECTED (${failures.length}):`)
  failures.forEach((f) => console.error(`  - ${f}`))
  console.error('\nLikely causes: the ingest workflow is failing/disabled, a source feed changed, or Actions are blocked. Check the Actions tab.')
  process.exit(1)
}

console.log('\nAll feeds fresh.')
process.exit(0)
