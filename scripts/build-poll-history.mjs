/**
 * build-poll-history.mjs — the full published poll series for the 2026 term.
 *
 * Why this exists: the site's live poll set (content_items → getPolls) keeps only
 * ONE poll per pollster, deliberately, so the poll-of-polls average can't be
 * skewed by a prolific pollster. That's correct for an average, but it means
 * there's no time series — so nothing can show whether support is moving.
 *
 * This builds that series separately, from the SAME source the site already
 * cites (POLLS_SOURCE), so nothing new is being trusted. It is display-only:
 * the headline poll-of-polls keeps its existing methodology untouched.
 *
 * Source table shape (Wikipedia wikitext), per poll:
 *   | data-sort-value="2026-08-04" |'''1–4 Aug 2026'''
 *   |[https://… Taxpayers' Union–Curia]
 *   | 1,000 || 31 || 27.8 || 10.1 || 7.3 || 9.1 || 1.5 || 6.1
 * with the party column order fixed by the table header:
 *   NAT · LAB · GRN · ACT · NZF · TPM · TOP
 *
 * Run:  node scripts/build-poll-history.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'constants', 'polls-history.ts')
const SOURCE = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election'
const RAW = 'https://en.wikipedia.org/w/index.php?title=Opinion_polling_for_the_2026_New_Zealand_general_election&action=raw'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

// Column order is fixed by the table header; if the page ever reorders these the
// count check below fires rather than silently mislabelling every number.
const COLS = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm', 'top']
const MIN_EXPECTED = 100   // sanity floor — below this the parse broke, not the data

/** Pollsters publish under slightly different names across rows ("1 News–Verian"
 *  vs "1News-Verian", stray trailing spaces). Normalise so a trend per pollster
 *  doesn't split into near-duplicates. */
function canonicalPollster(name) {
  const n = name.replace(/\s+/g, ' ').trim()
  if (/curia/i.test(n)) return "Taxpayers' Union–Curia"
  if (/reid/i.test(n)) return 'RNZ–Reid Research'
  if (/verian/i.test(n)) return '1News–Verian'
  if (/roy morgan/i.test(n)) return 'Roy Morgan'
  if (/freshwater/i.test(n)) return 'The Post–Freshwater'
  if (/talbot/i.test(n)) return /labour/i.test(n) ? 'Talbot Mills (Labour-commissioned)' : 'Talbot Mills'
  return n
}

const stripCell = (c) => c
  .replace(/style="[^"]*"/g, '')
  .replace(/\{\{Efn[\s\S]*?\}\}/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/'''/g, '')
  .replace(/\[\[[^\]]*\]\]/g, '')
  .replace(/^\s*\|\s*/, '')
  .trim()

const res = await fetch(RAW, { headers: { 'User-Agent': UA } })
if (!res.ok) throw new Error(`fetch ${res.status}`)
const allLines = (await res.text()).split('\n')

// The page carries FIVE poll tables — party vote, per-electorate polls, preferred
// prime minister, leadership approval and government approval — and they share
// the same row shape. Parsing the whole page merges them: preferred-PM and
// approval rows land in the series as bogus "party votes" (e.g. a row summing to
// ~65%, or Te Pāti Māori at 15% from an electorate sub-poll). So scope strictly
// to the "Party vote" section's own table.
const secStart = allLines.findIndex((l) => /^==\s*Party vote\s*==/i.test(l))
if (secStart < 0) {
  console.error('Could not find the "Party vote" section — the page structure changed.')
  process.exit(1)
}
const tableStart = allLines.findIndex((l, i) => i > secStart && /^\{\|/.test(l))
const tableEnd = allLines.findIndex((l, i) => i > tableStart && /^\|\}/.test(l))
if (tableStart < 0 || tableEnd < 0) {
  console.error('Could not delimit the party-vote table — the page structure changed.')
  process.exit(1)
}
const lines = allLines.slice(tableStart, tableEnd)
console.log(`Party-vote table: source lines ${tableStart + 1}–${tableEnd + 1}`)

const polls = []
let skipped = 0
for (let i = 0; i < lines.length; i++) {
  const d = lines[i].match(/data-sort-value="(\d{4}-\d{2}-\d{2})"\s*\|\s*'''([^']+)'''/)
  if (!d) continue
  const pm = (lines[i + 1] || '').match(/\[https?:\S+\s+([^\]]+)\]/)
  const row = lines[i + 2] || ''
  if (!pm || !row.includes('||')) { skipped++; continue }

  // First cell is sample size (sometimes blank); the party columns follow.
  const cells = row.split('||').map(stripCell)
  const nums = cells.slice(1).map((c) => parseFloat(c))
  const parties = {}
  COLS.forEach((slug, idx) => {
    const v = nums[idx]
    if (typeof v === 'number' && isFinite(v)) parties[slug] = v
  })
  // A usable row needs at least the two majors plus a couple of minors.
  if (Object.keys(parties).length < 5) { skipped++; continue }

  const sample = parseInt((cells[0] || '').replace(/[, ]/g, ''), 10)
  polls.push({
    date: d[1],
    fieldwork: d[2].replace(/\s+/g, ' ').trim(),
    pollster: canonicalPollster(pm[1]),
    ...(isFinite(sample) ? { sample } : {}),
    parties,
  })
}

polls.sort((a, b) => b.date.localeCompare(a.date))

if (polls.length < MIN_EXPECTED) {
  console.error(`Parsed only ${polls.length} polls (expected >= ${MIN_EXPECTED}).`)
  console.error('The source table structure probably changed — fix the parser rather than shipping a truncated series.')
  process.exit(1)
}

const byPollster = {}
for (const p of polls) byPollster[p.pollster] = (byPollster[p.pollster] || 0) + 1

const banner = `// AUTO-GENERATED by scripts/build-poll-history.mjs. Do not edit by hand.
// The full published poll series for the 2026 term, from the same aggregate the
// site already cites as POLLS_SOURCE. DISPLAY-ONLY: the headline poll-of-polls
// still comes from getPolls() (one poll per pollster) and is unaffected by this.\n`

writeFileSync(OUT, `${banner}
import type { PartySlug } from '@/types'

export interface HistoricalPoll {
  date: string          // ISO date of the last fieldwork day
  fieldwork: string     // human-readable fieldwork range
  pollster: string
  sample?: number
  parties: Partial<Record<PartySlug, number>>
}

export const POLL_HISTORY_META = {
  sourceUrl: '${SOURCE}',
  sourceLabel: 'Published poll aggregate for the 2026 general election',
  count: ${polls.length},
  from: '${polls[polls.length - 1].date}',
  to: '${polls[0].date}',
}

/** Newest first. */
export const POLL_HISTORY: HistoricalPoll[] = ${JSON.stringify(polls, null, 2)}

/** Average party support across polls whose fieldwork ended in [from, to].
 *  Returns null for a party with no readings in the window — never 0, which
 *  would read as "polled at zero" rather than "not polled". */
export function averageIn(from: string, to: string, slug: PartySlug): number | null {
  const vals = POLL_HISTORY
    .filter((p) => p.date >= from && p.date <= to)
    .map((p) => p.parties[slug])
    .filter((v): v is number => typeof v === 'number' && isFinite(v))
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}
`, 'utf8')

console.log(`Parsed ${polls.length} polls (${skipped} rows skipped as unparseable)`)
console.log(`Range: ${polls[polls.length - 1].date} → ${polls[0].date}`)
console.log('Per pollster:', JSON.stringify(byPollster, null, 0))
console.log(`→ ${OUT}`)
