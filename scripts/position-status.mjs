/**
 * position-status.mjs — read-only. What is actually stored for a set of positions.
 *
 * Written for one question: after a --if-changed run reported "SOURCE CHANGED"
 * and then "no clear position found", what state was that row left in? The
 * drafter returns before any write in that case, so the row keeps its old
 * status, its old summary and its OLD fingerprint — which means every later run
 * re-detects it and pays for the same model call again.
 *
 * No writes. Pass --ids=slug-topic-2026,slug-topic-2026 or --all.
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const idsArg = (process.argv.find((a) => a.startsWith('--ids=')) || '').split('=')[1]
const ids = idsArg ? idsArg.split(',') : null

const { data, error } = await supabase
  .from('content_items')
  .select('source_id, status, summary, source_url, data, updated_at')
  .eq('type', 'position')
if (error) { console.error(error.message); process.exit(1) }

const rows = (ids ? data.filter((r) => ids.includes(r.source_id)) : data)
  .sort((a, b) => a.source_id.localeCompare(b.source_id))

for (const r of rows) {
  console.log(`\n${r.source_id}  [${r.status}]  asOf=${r.data?.asOf ?? '—'}  updated=${r.updated_at ?? '—'}`)
  console.log(`  source_url: ${r.source_url}`)
  console.log(`  summary:    ${String(r.summary || r.data?.stance || '').replace(/\s+/g, ' ').slice(0, 150)}`)
}
console.log(`\n${rows.length} rows`)
