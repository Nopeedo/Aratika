/**
 * backfill-candidate-tags.mjs — add data.candidates to news and video already in
 * the table.
 *
 * Candidate tagging was added to the ingests, which meant it only applied going
 * forward. That was an acceptable trade while the tag existed purely to widen
 * the interview gate: missing history cost nothing a reader could see. It stops
 * being acceptable now the battleground pages render "coverage naming them" per
 * candidate — with no backfill, every candidate on every seat shows the empty
 * state, and a feature that always says "nothing yet" is indistinguishable from
 * one that is broken.
 *
 * Only ever ADDS the candidates array, computed from each item's own title and
 * summary by exactly the same tagger the ingest uses. No other field is touched,
 * no status changes, nothing is published. An item that names no candidate is
 * left alone entirely.
 *
 * Run: node scripts/backfill-candidate-tags.mjs [--apply]
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildCandidateTerms, tagCandidates } from './candidate-terms.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const APPLY = process.argv.includes('--apply')

const { terms, meta } = await buildCandidateTerms(sb)
if (Object.keys(terms).length === 0) { console.error('No candidate terms — refusing to touch anything.'); process.exit(1) }

// Paginate. PostgREST caps a plain select at 1000 rows and there are 2352 news
// and video items — the first version of this script read one unordered
// thousand, silently left 57% of the table untagged, and reported success. An
// explicit order is required too, or the page windows are not stable between
// requests and rows can be both skipped and repeated.
const data = []
const PAGE = 1000
for (let from = 0; ; from += PAGE) {
  const { data: page, error } = await sb
    .from('content_items')
    .select('id, type, title, summary, status, data')
    .in('type', ['news', 'video'])
    .order('id', { ascending: true })
    .range(from, from + PAGE - 1)
  if (error) { console.error(error.message); process.exit(1) }
  data.push(...(page || []))
  if (!page || page.length < PAGE) break
}
console.log(`news + video items: ${data.length}`)

const updates = []
for (const r of data || []) {
  const found = tagCandidates(`${r.title} ${r.summary || ''}`, terms)
  const existing = Array.isArray(r.data?.candidates) ? r.data.candidates : null
  if (found.length === 0) continue                                   // nothing to add
  if (existing && existing.length === found.length && found.every((k) => existing.includes(k))) continue  // already right
  updates.push({ id: r.id, type: r.type, status: r.status, title: r.title, found, data: { ...r.data, candidates: found } })
}

console.log(`items that name at least one candidate and need updating: ${updates.length}`)
const people = new Map()
for (const u of updates) for (const k of u.found) people.set(k, (people.get(k) || 0) + 1)
console.log(`distinct candidates referenced: ${people.size}\n`)
console.log('most-covered:')
for (const [k, n] of [...people].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  const m = meta[k]
  console.log(`  ${String(n).padStart(3)}  ${(m?.name || k).padEnd(26)} ${m?.electorate || ''}`)
}

// What a reader will actually be able to see: only approved items reach a page.
const approved = updates.filter((u) => u.status === 'approved')
console.log(`\nof those, already approved (visible to readers): ${approved.length}`)
console.log(`pending review: ${updates.length - approved.length}`)

if (!APPLY) { console.log('\nDry run — nothing written. Re-run with --apply.'); process.exit(0) }

let done = 0, failed = 0
for (const u of updates) {
  const { error: e } = await sb.from('content_items').update({ data: u.data }).eq('id', u.id)
  if (e) { console.error(`  ✗ ${u.id}: ${e.message}`); failed++ } else done++
}
console.log(`\nTagged ${done} item(s)${failed ? `, ${failed} failed` : ''}.`)
process.exit(failed ? 1 : 0)
