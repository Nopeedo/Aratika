/**
 * check-mp-roster.mjs — alarm for MP roster drift.
 *
 * Our MP roster (src/constants/mps-generated.ts) is a static file, and its
 * `slug` values are effectively foreign keys: mp-photos.ts, mps-bill-activity.ts,
 * electorates-data.ts and the news ingest's electorate tagging all join on them.
 * So we deliberately DON'T auto-overwrite it — a bad scrape would silently break
 * those joins. Instead this compares our roster against the live list and FAILS
 * when they diverge, so a human makes the controlled update.
 *
 * Source: the Wikipedia 54th NZ Parliament page, which maintains a per-party
 * table of sitting members. (parliament.nz itself sits behind Radware bot
 * protection and its bills API exposes no members endpoint, so this is the only
 * reliable key-free source.)
 *
 * Detects: MPs added, MPs gone, and party changes (defections/expulsions).
 *
 * Run: node scripts/check-mp-roster.mjs
 */
import { parse } from 'node-html-parser'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CONSTANTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'constants')
const ROSTER = join(CONSTANTS, 'mps-generated.ts')
const RICH = join(CONSTANTS, 'mps-data.ts')
const SOURCE = 'https://en.wikipedia.org/wiki/54th_New_Zealand_Parliament'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const MIN_EXPECTED = 100 // sanity floor — below this the parse is broken, not the roster

// Wikipedia's party table captions → our PartySlug.
const PARTY_MAP = [
  [/^national\b/i, 'national'],
  [/^act\b/i, 'act'],
  [/^new zealand first\b/i, 'nzfirst'],
  [/^labour\b/i, 'labour'],
  [/^green party\b/i, 'green'],
  [/^te pāti māori\b|^te pati maori\b|^m[āa]ori party\b/i, 'tpm'],
  [/^independent\b/i, 'independent'],
]

// Compare on a normalised name: strip refs/footnotes, macrons, punctuation, case.
const norm = (s) =>
  (s || '')
    .replace(/\[[^\]]*\]/g, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()

function partyFromCaption(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  for (const [re, slug] of PARTY_MAP) if (re.test(t)) return slug
  return null
}

async function liveRoster() {
  const res = await fetch(SOURCE, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`fetch ${res.status}`)
  const root = parse(await res.text())
  const out = []

  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr')
    if (rows.length < 3) continue
    const party = partyFromCaption(rows[0].querySelectorAll('th,td').map((c) => c.text).join(' '))
    if (!party) continue

    // The column-header row is the one containing a "Name" heading.
    const hIdx = rows.findIndex((r) => r.querySelectorAll('th,td').some((c) => /^name$/i.test(c.text.trim())))
    if (hIdx < 0) continue
    const headers = rows[hIdx].querySelectorAll('th,td').map((c) => c.text.replace(/\s+/g, ' ').trim())
    const nameIdx = headers.findIndex((h) => /^name$/i.test(h))
    if (nameIdx < 0) continue

    // Each party table lists CURRENT members first, then one-cell separator rows
    // ("…who resigned during the term", "…who died", "…who were expelled")
    // followed by former members. Once we hit one of those, everything after it
    // in this table is a past MP and must not count as roster drift.
    let pastMembers = false
    for (const tr of rows.slice(hIdx + 1)) {
      const cells = tr.querySelectorAll('th,td')
      // Data rows carry a leading party-colour cell the header row doesn't, so
      // they run one wider — shift by the difference rather than assuming
      // alignment. Narrower rows are section separators.
      if (cells.length < headers.length) {
        const label = cells.map((c) => c.text).join(' ')
        if (/resign|died|expel|former|no longer|left the/i.test(label)) pastMembers = true
        continue
      }
      if (pastMembers) continue
      const offset = cells.length - headers.length
      const cell = cells[nameIdx + offset]
      if (!cell) continue
      const name = cell.text
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\s*\([^)]*\)\s*$/, '')   // drop Wikipedia disambiguation, e.g. "Mike Davidson (politician)"
        .replace(/\s+/g, ' ').trim()
      if (!name || /^name$/i.test(name)) continue
      out.push({ name, party })
    }
  }
  return out
}

function localRoster() {
  // Read the generated roster AND mps-data.ts — a few MPs (e.g. the PM) live in
  // the hand-written rich-profile file, and would otherwise look like drift.
  // The name pattern allows escaped apostrophes ("Damien O\'Connor"), which a
  // naive [^']+ truncates to "Damien O\".
  const out = []
  for (const file of [ROSTER, RICH]) {
    let src
    try { src = readFileSync(file, 'utf8') } catch { continue }
    const re = /name:\s*'((?:[^'\\]|\\.)*)'[^}]*?party:\s*'([^']+)'/g
    let m
    while ((m = re.exec(src))) out.push({ name: m[1].replace(/\\'/g, "'"), party: m[2] })
  }
  // De-dupe (a name can appear in both files).
  const seen = new Set()
  return out.filter((m) => { const k = norm(m.name); if (seen.has(k)) return false; seen.add(k); return true })
}

// Differences we've checked and deliberately accepted, so one known divergence
// doesn't leave the alarm permanently red and train everyone to ignore it.
//
// Reviewed 20 Jul 2026: our roster was extracted from the OFFICIAL parliament.nz
// members directory, which we treat as authoritative over Wikipedia. These are
// accepted on that basis.
//
// Deliberately precise, not a blanket mute: a `sourceParty` entry silences only
// that exact divergence, so if the source later reports something DIFFERENT for
// the same MP, it fires again. Presence entries (in one list but not the other)
// are keyed by name. Key = the normalised name (lowercase, no macrons/punctuation).
const ACCEPTED = {
  // Present in the source but not our roster — official directory doesn't list
  // them as sitting members; keeping ours.
  'peeni henare':   { note: 'not in the official parliament.nz directory extract; ours follows the official source' },
  'adrian rurawhe': { note: 'not in the official parliament.nz directory extract; ours follows the official source' },
  // In our roster but not the source's current tables — ours follows the official directory.
  'georgie dansey': { note: 'official parliament.nz directory lists them as a sitting member' },
  'dan rosewarne':  { note: 'official parliament.nz directory lists them as a sitting member' },
  // Party divergence: we record them as independent per the official directory;
  // Wikipedia's party tables still group them under Te Pāti Māori (and its own
  // electorate table contradicts that, listing Kapa-Kingi as Independent).
  'takuta ferris':       { sourceParty: 'tpm', note: 'we hold independent per the official directory; source party table lags' },
  'mariameno kapakingi': { sourceParty: 'tpm', note: 'we hold independent per the official directory; source party table lags' },
}

const live = await liveRoster()
const local = localRoster()

console.log(`MP roster check — live source: ${live.length} MPs, our roster: ${local.length} MPs\n`)

if (live.length < MIN_EXPECTED) {
  console.error(`Parsed only ${live.length} MPs from the source (expected >= ${MIN_EXPECTED}).`)
  console.error('The page structure probably changed — fix the parser rather than trusting this result.')
  process.exit(1)
}

const liveBy = new Map(live.map((m) => [norm(m.name), m]))
const localBy = new Map(local.map((m) => [norm(m.name), m]))

const accepted = (name) => ACCEPTED[norm(name)]
// A presence difference is accepted outright; a party difference only when it
// matches the divergence we recorded — anything new still fires.
const presenceOk = (name) => Boolean(accepted(name))
const partyOk = (name, theirs) => accepted(name)?.sourceParty === theirs

const added = live.filter((m) => !localBy.has(norm(m.name)) && !presenceOk(m.name))
const gone = local.filter((m) => !liveBy.has(norm(m.name)) && !presenceOk(m.name))
const changed = local
  .filter((m) => liveBy.has(norm(m.name)))
  .map((m) => ({ name: m.name, ours: m.party, theirs: liveBy.get(norm(m.name)).party }))
  .filter((c) => c.ours !== c.theirs && !partyOk(c.name, c.theirs))

const acceptedCount = Object.keys(ACCEPTED).length
if (acceptedCount) console.log(`(${acceptedCount} known difference(s) accepted — see ACCEPTED in this script)\n`)

if (added.length) { console.log(`NEW in the live list (${added.length}) — missing from our roster:`); added.forEach((m) => console.log(`  + ${m.name} (${m.party})`)) }
if (gone.length) { console.log(`\nIn our roster but NOT in the live list (${gone.length}) — resigned/replaced?:`); gone.forEach((m) => console.log(`  - ${m.name} (${m.party})`)) }
if (changed.length) { console.log(`\nPARTY CHANGED (${changed.length}):`); changed.forEach((c) => console.log(`  ~ ${c.name}: we say ${c.ours}, source says ${c.theirs}`)) }

const drift = added.length + gone.length + changed.length
if (drift) {
  console.error(`\n${drift} difference(s) found. Update src/constants/mps-generated.ts (and any slug-keyed data: mp-photos, mps-bill-activity, electorates-data, the ingest's electorate terms).`)
  console.error(`Source: ${SOURCE}`)
  process.exit(1)
}

console.log('Roster matches the live list.')
process.exit(0)
