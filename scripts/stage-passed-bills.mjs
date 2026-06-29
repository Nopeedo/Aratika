/**
 * stage-passed-bills.mjs — stage content_items rows for every bill that has
 * PASSED into law this term (Royal Assent), so the enrichment pipeline can give
 * each a plain-language breakdown.
 *
 * Source of truth = the official bills API (54th Parliament). For each passed
 * bill we read its `BillLegislationUrl` (direct full-text link) and upsert a
 * pending `legislation` row. Non-destructive + de-duplicated: skips any bill
 * whose link or title already exists in content_items (so we don't duplicate the
 * already-live or already-drafted breakdowns).
 *
 * Then run:  node scripts/enrich-bills.mjs --all   (AI_PROVIDER=anthropic recommended)
 *
 * Run: node scripts/stage-passed-bills.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const API = 'https://bills.parliament.nz/api/data'
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function jget(url, opts = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json' }, ...opts }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json() }
    catch (e) { if (i === tries - 1) throw e; await new Promise((z) => setTimeout(z, 600 * (i + 1))) }
  }
}

// 1. all bills → passed
const search = await jget(`${API}/search`, { method: 'POST', body: JSON.stringify({
  id: null, documentPreset: 1, keyword: null, selectCommittee: null, status: [], documentTypes: [], documentSubtypes: [],
  beforeCommittee: null, billStages: [], billTab: 'All', billId: null, includeBillStages: true, subject: null, person: null,
  parliament: '54', dateFrom: '2023-10-14T00:00:00', dateTo: null, datePeriod: null, restrictedFrom: null, restrictedTo: null,
  terminatedReason: null, prettyTerminatedReason: null, terminatedReasons: [], column: 17, direction: 1, pageSize: 500, page: 1,
}) })
// --all-stages = stage every current bill (in-progress too), not just passed ones.
const ALL_STAGES = process.argv.includes('--all-stages')
const DROP = new Set(['Terminated', 'Discharged', 'Withdrawn', 'Lapsed'])
const passed = ALL_STAGES
  ? search.results.filter((b) => !DROP.has(b.status))
  : search.results.filter((b) => b.status === 'Royal Assent')
console.log(`${ALL_STAGES ? 'Current bills (all live stages)' : 'Passed bills'} this term: ${passed.length}`)

// 2. existing content_items (dedup keys)
const { data: existing } = await sb.from('content_items').select('source_id,title').eq('type', 'legislation')
const haveSource = new Set((existing || []).map((r) => r.source_id))
const haveTitle = new Set((existing || []).map((r) => norm(r.title)))
console.log(`Existing legislation rows: ${(existing || []).length}`)

// 3. resolve BillLegislationUrl per passed bill (concurrency) and stage the gaps
let resolved = 0
const rows = []
const skippedDup = []
const noUrl = []
async function pool(items, n, fn) {
  const q = [...items.keys()]
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) { await fn(items[q.shift()]); resolved++; if (resolved % 30 === 0) console.log(`  …resolved ${resolved}/${items.length}`) } }))
}
await pool(passed, 6, async (b) => {
  if (haveTitle.has(norm(b.title))) { skippedDup.push(b.title); return }
  let url = null
  try { const d = await jget(`${API}/Bill/${b.id}`); url = d.BillLegislationUrl || null } catch { /* skip */ }
  if (!url) { noUrl.push(b.title); return }
  if (haveSource.has(url)) { skippedDup.push(b.title); return }
  rows.push({
    type: 'legislation', source_id: url, title: b.title, summary: '', status: 'pending',
    source_url: url, data: { link: url, source: 'NZ Parliament (bills.parliament.nz)', billNumber: b.billNumber, enriched: false },
  })
})

console.log(`\nTo stage (new, passed, has full-text link): ${rows.length}`)
console.log(`Skipped — already in content_items: ${skippedDup.length}`)
console.log(`Skipped — no full-text link on API: ${noUrl.length}`)

// 4. insert (chunked upsert on source_id)
let inserted = 0
for (let i = 0; i < rows.length; i += 50) {
  const chunk = rows.slice(i, i + 50)
  const { error } = await sb.from('content_items').insert(chunk)
  if (error) { console.error('insert error:', error.message); break }
  inserted += chunk.length
}
console.log(`\nStaged ${inserted} pending legislation rows. Next: node scripts/enrich-bills.mjs --all`)
