/**
 * ingest-candidates.mjs — stage announced 2026 electorate candidates for review.
 *
 * The official candidate list only exists when nominations close (~a month
 * before election day), which would leave the battleground pages empty for the
 * most-watched stretch of the campaign. Wikipedia's "Candidates in the 2026 New
 * Zealand general election by electorate" page tracks candidates progressively
 * as parties announce them, with each row traceable to an announcement.
 *
 * Arapono's standard applies: NOTHING ships unreviewed. Parsed candidates are
 * staged into content_items as type='candidate', status='pending' — an editor
 * approves each in /editor before the battleground page will show it (see
 * src/lib/candidates/live.ts). When the Electoral Commission publishes official
 * nominations in October, that list supersedes this one.
 *
 * Only electorates that exist in electorates-data.ts are staged (same
 * normalisation as the site), so stray page sections can't inject rows.
 *
 * Run: node scripts/ingest-candidates.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const DRY = process.argv.includes('--dry-run')
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const SOURCE = 'https://en.wikipedia.org/wiki/Candidates_in_the_2026_New_Zealand_general_election_by_electorate'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Mirrors normalizeElectorateKey in src/constants/electorates-data.ts exactly.
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Wikipedia's party labels → our slugs. Multi-word checked first. Labels that
// map to nothing are staged with party=null (kept visible in /editor, logged,
// and skipped by the read-side until a slug mapping is added here).
const PARTY_MAP = [
  // "New Conservative" is a DIFFERENT party from Conservative Party NZ — it must
  // not substring-match 'conservative'. Mapping it to null keeps the candidate
  // staged (visible in /editor with their real label) without mislabelling.
  ['new conservative', null],
  ['te pati maori', 'tpm'], ['maori party', 'tpm'],
  ['new zealand first', 'nzfirst'], ['nz first', 'nzfirst'],
  ["women's rights", 'womens-rights'], ['womens rights', 'womens-rights'],
  ['legalise cannabis', 'alcp'], ['alcp', 'alcp'],
  ['animal justice', 'animal-justice'],
  ['outdoors', 'nz-outdoors'],
  ['conservative', 'conservative'],
  ['vision', 'vision-nz'],
  ['opportunity', 'top'], ['top', 'top'],
  ['national', 'national'], ['labour', 'labour'], ['green', 'green'], ['act', 'act'],
  ['independent', 'independent'],
]
const partySlug = (label) => {
  const l = norm(label).replace(/-/g, ' ')
  for (const [needle, slug] of PARTY_MAP) if (l.includes(needle)) return slug
  return null
}

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\[\s*\d+\s*\]/g, '').replace(/\s+/g, ' ').trim()

// Allowed electorates = the site's own dataset, same normalisation.
const allowed = new Map() // slug -> display name
for (const line of readFileSync(join(root, 'src/constants/electorates-data.ts'), 'utf8').split('\n')) {
  const m = line.match(/name:\s+'([^']+)'/)
  if (m) allowed.set(norm(m[1]), m[1])
}
console.log(`electorates in site dataset: ${allowed.size}`)

const html = await fetch(SOURCE, { headers: { 'User-Agent': UA } }).then((r) => r.text())

// Split into h3 sections; each battleground-relevant one has a candidates table.
const sections = [...html.matchAll(/<h3[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23][^>]*id=|$)/g)]
const found = []
let unknownParty = 0
for (const [, , headingHtml, body] of sections) {
  const name = text(headingHtml)
  const slug = norm(name)
  if (!allowed.has(slug)) continue
  const table = (body.match(/<table[\s\S]*?<\/table>/) || [])[0]
  if (!table) continue
  for (const [row] of [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => [m[0]])) {
    if (/denotes/i.test(row)) continue                      // legend rows
    const cells = [...row.matchAll(/<td[\s\S]*?<\/td>/g)].map((m) => text(m[0]))
    if (cells.length < 2) continue                          // header/notes rows
    const [partyLabel, candidate, notes] = cells
    if (!candidate || !partyLabel) continue
    const slugP = partySlug(partyLabel)
    if (!slugP) unknownParty++
    found.push({
      electorate: allowed.get(slug), electorateSlug: slug,
      name: candidate, party: slugP, partyLabel, notes: notes || '',
    })
  }
}
console.log(`parsed ${found.length} candidate rows across ${new Set(found.map((f) => f.electorateSlug)).size} electorates (${unknownParty} with unmapped party labels)`)

// Sanity guard: a page-layout change should write nothing, not garbage.
if (found.length < 10) { console.error('Too few candidates parsed — page layout may have changed. Writing nothing.'); process.exit(1) }

const { data: existing, error: e1 } = await sb.from('content_items').select('source_id').eq('type', 'candidate')
if (e1) { console.error(e1.message); process.exit(1) }
const have = new Set((existing || []).map((r) => r.source_id))

const today = new Date().toISOString().slice(0, 10)
const rows = []
for (const f of found) {
  const source_id = `cand:${f.electorateSlug}|${norm(f.name)}`
  if (have.has(source_id)) continue
  have.add(source_id)
  rows.push({
    type: 'candidate', source_id, status: 'pending', change_kind: 'new',
    title: `${f.name} — ${f.electorate} (${f.partyLabel})`,
    summary: f.notes || null,
    source_url: SOURCE,
    data: { ...f, asOf: today, sourceLabel: 'Wikipedia — candidates by electorate (party announcements)' },
  })
}
console.log(`new (not previously staged): ${rows.length}`)
if (DRY) {
  for (const r of rows.slice(0, 12)) console.log(`  · ${r.title}`)
  if (rows.length > 12) console.log(`  … and ${rows.length - 12} more`)
  console.log('(dry run — nothing written)')
  process.exit(0)
}
for (let i = 0; i < rows.length; i += 50) {
  const { error } = await sb.from('content_items').insert(rows.slice(i, i + 50))
  if (error) { console.error('insert error: ' + error.message); process.exit(1) }
}
console.log(`Staged ${rows.length} candidates as pending → review at /editor.`)
process.exit(0)
