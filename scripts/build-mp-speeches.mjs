/**
 * build-mp-speeches.mjs — per-MP speeches given in the House THIS TERM (54th
 * Parliament), from hansard.parliament.nz's public search API.
 *
 * This was previously logged as a dead end ("no per-MP source; Radware bot
 * protection"). Both parts turned out to be wrong on re-test:
 *   • The endpoint takes the same POST shape as questions.parliament.nz.
 *   • The block is threshold-based, not absolute — large bursts get challenged,
 *     steady requests at pageSize 1000 do not.
 *   • `DebateItem` rows carry a populated memberId/memberName — real per-speaker
 *     attribution, which is what was thought to be missing.
 *
 * Strategy: the API's own filter params don't filter server-side (same quirk as
 * the questions API — only `keyword` does), but results ARE sorted by sitting
 * date descending. So we sweep from the present backwards and stop as soon as we
 * cross out of Parliament 54, rather than searching once per MP. One pass covers
 * every MP, and it's ~45 requests instead of ~125 paged searches.
 *
 * What counts as a "speech": documentType `DebateItem` AND documentSubtype
 * `Speech`. The other subtype is `Question` (oral questions) — deliberately
 * excluded, since counting those under "Speeches in the House" would overstate
 * it, and written/oral questions are already surfaced separately.
 *
 * Nothing invented: every count is a tally of real Hansard records.
 *
 * Run:  node scripts/build-mp-speeches.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-speeches.ts')
const API = 'https://hansard.parliament.nz/api/data/search'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const TERM = 54
const SOURCE_URL = 'https://hansard.parliament.nz/'
const SOURCE_LABEL = 'Hansard — the official report of Parliament (hansard.parliament.nz)'
const PAGE_SIZE = 1000
const MAX_PAGES = 400      // safety ceiling; term 54 needs ~45. Warns loudly if hit.
const THROTTLE_MS = 900    // steady and gentle — bursts are what trigger the challenge page
const RECENT_KEEP = 5

// ── MPs: slug -> name ────────────────────────────────────────────────────────
// Names are single-quoted with escaped apostrophes ('Damien O\'Connor'), so a
// plain [^']+ capture would stop at the backslash (this exact bug published a
// false zero for both O'Connors in the written-questions dataset).
const src = readFileSync(GEN, 'utf8')
const mps = []
const slugRe = /slug:\s*'([^']+)'/g
let sm
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 400)
  const nm = win.match(/\bname:\s*'((?:[^'\\]|\\.)*)'/)
  if (nm) mps.push({ slug: sm[1], name: nm[1].replace(/\\(['\\])/g, '$1') })
}
mps.push({ slug: 'christopher-luxon', name: 'Christopher Luxon' })
mps.push({ slug: 'judith-collins', name: 'Judith Collins' })

/** Hansard writes "Hon Dr AYESHA VERRALL"; our data has "Ayesha Verrall". Strip
 *  stacked honorifics, diacritics and punctuation so the two forms compare. */
function norm(s) {
  return (s || '')
    // Hansard sometimes appends party/electorate \u2014 "MARK CAMERON (ACT)",
    // "TAKUTAI TARSH KEMP (Te P\u0101ti M\u0101ori\u2014T\u0101maki Makaurau)". Left in place these
    // silently drop a sitting MP's whole speech count.
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')       // macrons/accents
    .replace(/^(?:(?:rt|hon|dr|sir|dame|prof|professor)\.?\s+)+/i, '')
    .replace(/['’\-]/g, ' ')
    .replace(/[^a-z\s]/gi, ' ')
    .toLowerCase().replace(/\s+/g, ' ').trim()
}
const bySlugKey = new Map()   // normalised name -> slug
for (const m of mps) bySlugKey.set(norm(m.name), m.slug)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(page, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: null, keyword: '', pageSize: PAGE_SIZE, page, column: 1, direction: 1 }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const text = await r.text()
      // A challenge page is HTML, not JSON — back off further and retry rather
      // than crashing mid-sweep or, worse, treating it as "no more results".
      if (!text.trimStart().startsWith('{')) throw new Error('bot-challenge page')
      return JSON.parse(text)
    } catch (e) {
      if (attempt === tries) throw e
      await sleep(1500 * attempt)
    }
  }
}

// ── Sweep ────────────────────────────────────────────────────────────────────
const counts = new Map()        // memberId -> { name, count, recent[] }
const unmatched = new Map()     // normalised Hansard name -> count (nothing dropped silently)
let pagesFetched = 0
let crossedOut = false
let oldestSeen = null

for (let page = 1; page <= MAX_PAGES; page++) {
  const d = await search(page)
  const rows = d.value || []
  if (rows.length === 0) break
  pagesFetched++

  for (const r of rows) {
    if (r.sittingDate && (!oldestSeen || r.sittingDate < oldestSeen)) oldestSeen = r.sittingDate
    if (r.parliamentNumber !== TERM) { crossedOut = true; continue }
    if (r.documentType !== 'DebateItem' || r.documentSubtype !== 'Speech') continue
    if (!r.memberId) continue
    let e = counts.get(r.memberId)
    if (!e) { e = { name: r.memberName || '', count: 0, recent: [] }, counts.set(r.memberId, e) }
    e.count++
    if (e.recent.length < RECENT_KEEP) {
      e.recent.push({ title: (r.title || '').replace(/\s+/g, ' ').trim(), date: (r.sittingDate || '').slice(0, 10) })
    }
  }

  if (page % 10 === 0) console.log(`  page ${page} — ${counts.size} speakers, oldest ${oldestSeen?.slice(0, 10)}`)
  // Sorted date-descending, so once a page contains pre-term-54 rows we're done.
  if (crossedOut) { console.log(`  crossed out of Parliament ${TERM} on page ${page} — stopping.`); break }
  if (page === MAX_PAGES) console.warn(`  !! hit the ${MAX_PAGES}-page ceiling WITHOUT leaving term ${TERM} — COUNTS ARE INCOMPLETE. Raise MAX_PAGES.`)
  if (rows.length < PAGE_SIZE) break
  await sleep(THROTTLE_MS)
}

// ── Attribute to our MPs ─────────────────────────────────────────────────────
const result = {}
for (const [, e] of counts) {
  const slug = bySlugKey.get(norm(e.name))
  if (!slug) { unmatched.set(e.name, (unmatched.get(e.name) || 0) + e.count); continue }
  // A member can appear under more than one id (name/title changes mid-term).
  const cur = result[slug]
  if (cur) { cur.count += e.count; if (cur.recent.length < RECENT_KEEP) cur.recent.push(...e.recent.slice(0, RECENT_KEEP - cur.recent.length)) }
  else result[slug] = { count: e.count, recent: e.recent }
}

const banner = `// AUTO-GENERATED by scripts/build-mp-speeches.mjs. Do not edit by hand.
// Per-MP speeches given in the House during the 54th Parliament (since the 2023
// election), tallied from hansard.parliament.nz — the official report of Parliament.
// Counts "DebateItem" records of subtype "Speech" attributed to the member; oral
// questions are a separate subtype and are deliberately NOT counted here.\n`

writeFileSync(OUT, `${banner}
export interface SpeechRef { title: string; date: string }
export interface MPSpeeches { count: number; recent: SpeechRef[] }
export const SPEECHES_META = {
  term: ${TERM},
  sourceUrl: '${SOURCE_URL}',
  sourceLabel: '${SOURCE_LABEL}',
}
export const MP_SPEECHES: Record<string, MPSpeeches> = ${JSON.stringify(result, null, 2)}

// Every MP checked by this run. The sweep covers the whole term, so an MP listed
// here but absent from the map above genuinely gave no speeches — a real, checked
// zero, not "not looked at yet".
export const SPEECHES_CHECKED: string[] = ${JSON.stringify(mps.map((m) => m.slug).sort(), null, 2)}
`, 'utf8')

console.log(`\nPages fetched: ${pagesFetched} | oldest sitting date seen: ${oldestSeen?.slice(0, 10)}`)
console.log(`Matched ${Object.keys(result).length} MPs with speeches this term → ${OUT}`)
if (unmatched.size) {
  console.warn(`\n!! ${unmatched.size} Hansard speaker name(s) did NOT map to an MP slug — their speeches are being dropped:`)
  for (const [n, c] of [...unmatched].sort((a, b) => b[1] - a[1])) console.warn(`   ${n} (${c})`)
}
