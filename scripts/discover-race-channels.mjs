/**
 * discover-race-channels.mjs — find channels covering individual ELECTORATE
 * races, by searching the candidates standing in the closest seats.
 *
 * discover-yt-channels.mjs searches party leaders, which finds national
 * outlets. Those are not the channels that cover a Tāmaki or Te Tai Hauāuru
 * contest. Local and community media, iwi radio, single-issue shows and
 * candidate-run channels are where a marginal seat actually gets discussed, and
 * none of them will ever surface from a search for "Christopher Luxon".
 *
 * Seats are taken most-marginal-first, because that is where a voter's decision
 * is most likely to change the outcome and where coverage is therefore worth
 * the most. Incumbents are skipped — they are already well covered by the
 * national outlets we ingest, and spending quota on them would crowd out the
 * challengers this exists to find.
 *
 * QUOTA is the real constraint: search.list costs 100 units against a
 * 10,000/day default, so roughly 90 searches a day, total, shared with anything
 * else using the key. The script therefore refuses to guess — it prints its
 * budget before spending it, caps by default, and reports exactly what it used.
 * Run it across several days to sweep more seats rather than raising the cap
 * and silently exhausting the quota mid-run.
 *
 * Suggests only. Same reasoning as the leader discovery: whether an outlet
 * belongs in the interview tier is a judgement about what it publishes, not a
 * count.
 *
 * Run: node scripts/discover-race-channels.mjs [--seats 8] [--max-searches 40] [--min 2]
 *      add --rotate to advance the seat window by ISO week (for the weekly job),
 *      or --offset N to pick the window by hand.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { searchVideos, hasApiKey, announceMode } from './lib/youtube.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Number(...) || fallback treats 0 as absent, so `--max-searches 0` silently
// ran the default of 40 and spent 4000 quota units on what was meant to be a
// dry inspection. Explicit NaN check instead.
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  if (i < 0) return fallback
  const n = Number(process.argv[i + 1])
  return Number.isFinite(n) ? n : fallback
}
const SEATS = arg('seats', 8)
const MAX_SEARCHES = arg('max-searches', 40)
const MIN_CANDIDATES = arg('min', 2)
const UNITS_PER_SEARCH = 100

/**
 * Where in the seat list to start.
 *
 * Quota caps a run at roughly 90 searches, and there are 72 seats holding a few
 * hundred challengers, so one run can never be a full sweep. --rotate advances
 * the window by ISO week, so a weekly job walks the whole country over a couple
 * of months and comes back around.
 *
 * Derived from the week number rather than a committed state file: no write-back
 * from CI, no state to drift, and any run is reproducible from its date alone.
 * A missed week costs that week's seats, not the rotation.
 */
function weekOffset(windowSize) {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 1)
  const week = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 604800000)
  return week * windowSize
}
const ROTATE = process.argv.includes('--rotate')
const OFFSET = arg('offset', ROTATE ? weekOffset(SEATS) : 0)

/** Channel IDs already ingested — parsed from the source of truth. */
function knownChannelIds() {
  const src = readFileSync(join(root, 'scripts/ingest-videos.mjs'), 'utf8')
  return new Set([...src.matchAll(/id: '(UC[\w-]{22})'/g)].map((m) => m[1]))
}

/** Mirrors normalizeElectorateKey in src/constants/electorates-data.ts — the
 *  slug must match exactly or no candidate ever joins to its seat. */
const seatSlug = (name) => name
  .toLowerCase()
  .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

/** Seats most-marginal-first, read from the site's own electorate dataset.
 *  Rows are one object per line (name / mpName / majority all on the line), and
 *  the slug is derived rather than stored — same as the app does at runtime. */
function marginalSeats(limit) {
  const src = readFileSync(join(root, 'src/constants/electorates-data.ts'), 'utf8')
  const out = []
  for (const line of src.split('\n')) {
    const name = line.match(/name:\s*'([^']+)'/)?.[1]
    if (!name || !line.includes('mpName')) continue
    const majority = line.match(/majority:\s*(\d+)/)?.[1]
    const mpName = line.match(/mpName:\s*'([^']+)'/)?.[1]
    out.push({ slug: seatSlug(name), name, majority: majority ? Number(majority) : Infinity, mpName: mpName || null })
  }
  if (out.length === 0) { console.error('Parsed no electorates — refusing to run a search sweep blind.'); process.exit(1) }
  const sorted = out.sort((a, b) => a.majority - b.majority)
  // Wrap, so a rotation that runs past the end of the list starts again at the
  // most marginal seat rather than quietly returning nothing.
  const start = ((OFFSET % sorted.length) + sorted.length) % sorted.length
  return Array.from({ length: Math.min(limit, sorted.length) }, (_, i) => sorted[(start + i) % sorted.length])
}

announceMode(' (race discovery)')
if (!hasApiKey()) {
  console.warn('\nNo YOUTUBE_API_KEY. The HTML fallback cannot region-lock to NZ, and a')
  console.warn('candidate name without that filter returns mostly overseas namesakes.')
  console.warn('Set the key before running this one — the results are not worth trusting otherwise.\n')
}

const known = knownChannelIds()
const seats = marginalSeats(SEATS)
console.log(`Window: seats ${OFFSET}–${OFFSET + SEATS - 1} of the marginal ordering${ROTATE ? ' (rotating weekly)' : ''}`)
console.log(`Seats: ${seats.map((s) => `${s.name} (${s.majority === Infinity ? '?' : s.majority})`).join(', ')}\n`)

const { data: cands } = await sb
  .from('content_items').select('data').eq('type', 'candidate').eq('status', 'approved')
const bySeat = new Map()
for (const r of cands || []) {
  const d = r.data || {}
  if (!d.electorateSlug || !d.name || !String(d.name).includes(' ')) continue
  if (!bySeat.has(d.electorateSlug)) bySeat.set(d.electorateSlug, [])
  bySeat.get(d.electorateSlug).push(d)
}

// Build the search list before spending anything, so the budget is visible.
const targets = []
for (const seat of seats) {
  for (const c of bySeat.get(seat.slug) || []) {
    // Skip the sitting MP: national coverage already finds them, and the point
    // here is the challengers nobody is looking for.
    if (seat.mpName && c.name.toLowerCase() === seat.mpName.toLowerCase()) continue
    targets.push({ name: c.name, seat: seat.name, party: c.partyLabel || c.party || '?' })
  }
}
console.log(`Challengers in those seats: ${targets.length}`)
const planned = Math.min(targets.length, MAX_SEARCHES)
console.log(`Searching ${planned} of them — about ${planned * UNITS_PER_SEARCH} quota units of the 10,000/day default.`)
if (targets.length > planned) {
  console.log(`${targets.length - planned} left unsearched by the --max-searches cap. Raise it, or run again tomorrow.`)
}
console.log()

const channels = new Map()
let used = 0
for (const t of targets.slice(0, planned)) {
  // Include the electorate: "John Ryan" alone is a very common name, and the
  // seat name is the cheapest available disambiguator.
  const results = (await searchVideos(`"${t.name}" ${t.seat} election`, { max: 25 })) || []
  used += UNITS_PER_SEARCH
  const surname = t.name.split(' ').pop().toLowerCase()
  let kept = 0
  for (const r of results) {
    if (known.has(r.channelId)) continue
    const hay = `${r.title} ${r.description}`.toLowerCase()
    // Require the actual name, not just the seat — otherwise every generic
    // election clip mentioning the electorate counts as covering this person.
    if (!hay.includes(t.name.toLowerCase()) && !hay.includes(surname)) continue
    kept++
    if (!channels.has(r.channelId)) channels.set(r.channelId, { owner: r.channelTitle, people: new Set(), seats: new Set(), titles: [] })
    const c = channels.get(r.channelId)
    c.people.add(t.name)
    c.seats.add(t.seat)
    if (c.titles.length < 3) c.titles.push(r.title)
  }
  console.log(`  ${String(kept).padStart(2)} hit(s)  ${t.name} (${t.party}) — ${t.seat}`)
}

const ranked = [...channels.entries()]
  .map(([id, c]) => ({ id, ...c, n: c.people.size }))
  .filter((c) => c.n >= MIN_CANDIDATES)
  .sort((a, b) => b.n - a.n)

console.log(`\nQuota used: ~${used} units.`)
console.log(`\n${ranked.length} channel(s) covering ${MIN_CANDIDATES}+ different candidates:\n`)
for (const c of ranked) {
  console.log(`${c.owner}`)
  console.log(`   id:         ${c.id}`)
  console.log(`   candidates: ${[...c.people].join(', ')}`)
  console.log(`   seats:      ${[...c.seats].join(', ')}`)
  for (const t of c.titles) console.log(`   · ${t.slice(0, 92)}`)
  console.log()
}
if (ranked.length === 0) {
  console.log('Nothing met the threshold. That is a real answer, not a failure —')
  console.log('local race coverage on YouTube is thin this far from election day.')
  console.log(`Try --min 1 to see channels covering a single candidate.`)
}
console.log('Confirm any ID with scripts/resolve-yt-channel.mjs before adding it.')
process.exit(0)
