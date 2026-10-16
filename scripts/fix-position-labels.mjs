/**
 * fix-labels.mjs — correct `periodLabel` / `source_label` on positions whose
 * content was REPOINTED to a current source but whose labels were left behind.
 *
 * WHY. src/lib/positions/live.ts reads BOTH:
 *     periodLabel: typeof d.periodLabel === 'string' ? d.periodLabel : 'Current policy'   (line 61)
 *     sourceLabel: typeof d.source_label === 'string' ? d.source_label : 'Official source' (line 77)
 * so a row can carry period '2026', a "(current policy)" title and a 2026
 * citation, and still RENDER to the public as "2023 manifesto". This is the
 * same repoint gap that left five rows with a stale `period` in July: the
 * repoint path updates the text, the citation and asOf, and never touches the
 * labels.
 *
 * Report-only by default. Pass --apply to write.
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })
const APPLY = process.argv.includes('--apply')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const rows = []
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from('content_items')
    .select('id,status,title,source_url,data').eq('type', 'position').eq('status', 'approved').order('id').range(f, f + 999)
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...(data || []))
  if (!data || data.length < 1000) break
}

// A row is MISLABELLED when everything else says current and only the label says otherwise.
const bad = rows.filter((r) =>
  r.data?.period === '2026' &&
  /\(current policy\)/.test(r.title || '') &&
  (/2023|manifesto/i.test(String(r.data?.periodLabel || '')) || /2023|manifesto/i.test(String(r.data?.source_label || ''))))

console.log(`approved positions: ${rows.length}`)
console.log(`period 2026 + "(current policy)" title but a 2023/manifesto LABEL: ${bad.length}\n`)
for (const r of bad) {
  console.log(`  ${r.title}`)
  console.log(`      topic        ${r.data?.topic}   asOf ${r.data?.asOf}   period ${r.data?.period}`)
  console.log(`      periodLabel  ${JSON.stringify(r.data?.periodLabel)}  ->  "Current policy"`)
  console.log(`      source_label ${JSON.stringify(r.data?.source_label)}`)
  console.log(`      source_url   ${r.source_url}`)
}
if (!bad.length) { console.log('  (none)'); process.exit(0) }

if (!APPLY) { console.log('\n(report only — pass --apply to write)'); process.exit(0) }
let wrote = 0
for (const r of bad) {
  const d = { ...r.data, periodLabel: 'Current policy' }
  if (/2023|manifesto/i.test(String(d.source_label || ''))) d.source_label = `${d.partyName || d.party} — official policy page`
  const { error } = await sb.from('content_items').update({ data: d }).eq('id', r.id)
  if (error) { console.error(`  ! ${r.title}: ${error.message}`); continue }
  console.log(`  ✓ ${r.title}`)
  wrote++
}
console.log(`\napplied: ${wrote} row(s)`)
