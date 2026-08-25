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
  // Wikipedia labels the Conservative Party's candidates "New Conservative".
  // This used to map to null, on the reasoning that it is a different party and
  // must not substring-match 'conservative'. The caution was right and the
  // conclusion was wrong, and it cost six real candidates their place on the
  // site: the read side drops anyone without a slug, so all six rendered
  // nowhere while sitting approved in the database.
  //
  // They are Conservative Party NZ:
  //  - the party's own release announcing one of them is attributed "Press
  //    Release: Conservative Party" and opens "The New Zealand Conservative
  //    Party is pleased to announce Doug Lyell as its candidate for the
  //    Northland electorate", quoting "Party Leader Helen Houghton" — herself
  //    one of the six;
  //  - the Electoral Commission's register lists "Conservative Party NZ",
  //    registered 6 October 2011, and has no entry for "New Conservative".
  //
  // Kept as an EXPLICIT entry ahead of the plain 'conservative' rule rather
  // than deleted, so the mapping is a decision with a reason attached and not
  // an accident of substring order.
  ['new conservative', 'conservative'],
  // Registered 5 August 2026. Order matters: 'te tai tokerau' must be tested
  // BEFORE the te-pati-maori entries, because the party its founder left is
  // matched on 'maori party' and a Te Tai Tokerau row would otherwise be
  // labelled with the party she resigned from.
  ['te tai tokerau', 'te-tai-tokerau-party'],
  ['alliance', 'alliance'],
  ['free palestine', 'free-palestine'], ['palestine', 'free-palestine'],
  ['nz loyal', 'nz-loyal'], ['new zealand loyal', 'nz-loyal'],
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

// ── Citations: resolve each row's [n] footnotes to their underlying URLs ──────
// Wikipedia rows cite the actual announcement (party site / news report) via
// <sup><a href="#cite_note-X">. The references list at the bottom holds the
// external link for each note. Attaching those URLs to every staged candidate
// means the editor approves against the PRIMARY source, not "Wikipedia says so"
// — and the /editor card's "Official source" link goes to the announcement.
// NB: this page serves Wikipedia's Parsoid markup, where reference bodies are
// `<span id="mw-reference-text-cite_note-X">…<a href="https://…">`, not the
// classic `<li id="cite_note-X">` — match both so a rendering switch can't
// silently zero the citations again.
const noteUrl = new Map()
for (const [, id, body] of html.matchAll(/id="(?:mw-reference-text-)?cite_note-([^"]+)"[^>]*>([\s\S]*?)(?=id="(?:mw-reference-text-)?cite_note-|$)/g)) {
  if (noteUrl.has(id)) continue
  const m = body.match(/href="(https?:\/\/[^"]+)"/)
  if (m) noteUrl.set(id, m[1].replace(/&amp;/g, '&'))
}
console.log(`reference notes with external URLs: ${noteUrl.size}`)
const rowCitations = (rowHtml) => {
  const urls = []
  for (const [, id] of rowHtml.matchAll(/#cite_note-([^"]+)"/g)) {
    const u = noteUrl.get(id)
    if (u && !urls.includes(u)) urls.push(u)
  }
  return urls.slice(0, 3)
}

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
      citations: rowCitations(row),
    })
  }
}
console.log(`parsed ${found.length} candidate rows across ${new Set(found.map((f) => f.electorateSlug)).size} electorates (${unknownParty} with unmapped party labels)`)

// Sanity guard: a page-layout change should write nothing, not garbage.
if (found.length < 10) { console.error('Too few candidates parsed — page layout may have changed. Writing nothing.'); process.exit(1) }

const { data: existing, error: e1 } = await sb.from('content_items').select('id, source_id, data').eq('type', 'candidate')
if (e1) { console.error(e1.message); process.exit(1) }
const byId = new Map((existing || []).map((r) => [r.source_id, r]))

const today = new Date().toISOString().slice(0, 10)
// The "Official source" link an editor clicks should be the primary
// announcement where we have one, the aggregate page only as fallback.
const primaryUrl = (f) => f.citations[0] || SOURCE

const rows = [], updates = []
for (const f of found) {
  const source_id = `cand:${f.electorateSlug}|${norm(f.name)}`
  const prior = byId.get(source_id)
  if (prior) {
    // Idempotent enrichment: backfill citations onto items staged before the
    // citation extraction existed (or when Wikipedia gains better sourcing).
    const had = Array.isArray(prior.data?.citations) ? prior.data.citations : []
    if (f.citations.length > 0 && f.citations.join('|') !== had.join('|')) {
      updates.push({ id: prior.id, data: { ...prior.data, citations: f.citations }, source_url: primaryUrl(f) })
    }
    continue
  }
  byId.set(source_id, { source_id })
  rows.push({
    type: 'candidate', source_id, status: 'pending', change_kind: 'new',
    title: `${f.name} — ${f.electorate} (${f.partyLabel})`,
    summary: f.notes || null,
    source_url: primaryUrl(f),
    data: { ...f, asOf: today, sourceLabel: 'Party announcement (via Wikipedia candidates-by-electorate)' },
  })
}
// ── Candidates the source no longer lists ────────────────────────────────────
//
// The only signal we get that someone may have pulled out. It is a WEAK one:
// Wikipedia rows get respelled, reorganised, and occasionally lost, and a
// partial parse would otherwise read as a mass withdrawal. So this reports and
// never writes — scripts/mark-withdrawn.mjs is where a human records it, with a
// citation.
//
// Guarded twice. The parse must have succeeded broadly (checked above), and the
// disappearances must be a small fraction of the field: if a tenth of every
// approved candidate vanished at once, that is the source breaking, not eighty
// people quitting on the same day.
{
  const parsedIds = new Set(found.map((f) => `cand:${f.electorateSlug}|${norm(f.name)}`))
  const approved = (existing || []).filter((r) => r.data && !r.data.withdrawn)
  const gone = approved.filter((r) => !parsedIds.has(r.source_id))
  const share = approved.length ? gone.length / approved.length : 0
  if (gone.length === 0) {
    console.log('no approved candidate has disappeared from the source')
  } else if (share > 0.1) {
    console.warn(`⚠ ${gone.length} of ${approved.length} approved candidates (${Math.round(share * 100)}%) are missing from this parse.`)
    console.warn('  That is the source changing shape, not a wave of withdrawals. Listing nothing; check the page before trusting this run.')
  } else {
    console.log(`
possible withdrawals — ${gone.length} approved candidate(s) no longer listed by the source:`)
    for (const r of gone) {
      console.log(`  · ${r.data?.name} (${r.data?.electorateSlug})`)
      console.log(`      node scripts/mark-withdrawn.mjs --seat ${r.data?.electorateSlug} --name "${r.data?.name}" --source <url>`)
    }
    console.log('  Verify each against a real report before running any of those. Absence here is not evidence.')
  }
}

const withCite = found.filter((f) => f.citations.length > 0).length
console.log(`rows with at least one citation URL: ${withCite}/${found.length}`)
console.log(`new (not previously staged): ${rows.length} | existing needing citation backfill: ${updates.length}`)
if (DRY) {
  for (const r of rows.slice(0, 8)) console.log(`  · ${r.title}  →  ${r.source_url}`)
  console.log('(dry run — nothing written)')
  process.exit(0)
}
for (let i = 0; i < rows.length; i += 50) {
  const { error } = await sb.from('content_items').insert(rows.slice(i, i + 50))
  if (error) { console.error('insert error: ' + error.message); process.exit(1) }
}
let updated = 0
for (const u of updates) {
  const { error } = await sb.from('content_items').update({ data: u.data, source_url: u.source_url }).eq('id', u.id)
  if (!error) updated++
}
console.log(`Staged ${rows.length} new; backfilled citations on ${updated}. Review at /editor.`)
process.exit(0)
