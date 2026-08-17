/**
 * discover-yt-channels.mjs — find channels interviewing our leaders and
 * candidates that we are not already ingesting.
 *
 * The first pass at the independent tier was not discovery: it was guessing
 * plausible handles from memory and verifying them. That only ever finds
 * channels you already thought of, and it found three wrong ones (@TheHuiNZ is
 * abandoned since 2013, @TheWorkingGroup is a US charity, @SpinoffTV is
 * Portuguese). The channels that matter here are precisely the ones nobody in
 * the room thinks to name.
 *
 * So: search YouTube for each leader by name, read who is publishing the
 * results, and subtract what we already have. Uses the Data API when
 * YOUTUBE_API_KEY is set (region-locked to NZ, and it returns descriptions);
 * otherwise it scrapes the search page, which ships its data as ytInitialData.
 * No key is a smaller, noisier window — never a failure.
 *
 * This SUGGESTS, it does not add. Output is a ranked candidate list for a human
 * to look at, because the tier's admission test (does this outlet publish
 * original on-the-record interviews with named leaders or candidates) is not
 * something a keyword count can decide. Ranking is by how many DIFFERENT
 * leaders a channel covers, not by volume: a channel interviewing five leaders
 * across parties is a general interview outlet, while forty clips about one
 * leader is more likely a fan or attack channel.
 *
 * Run: node scripts/discover-yt-channels.mjs [--min 2] [--json]
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { searchVideos, announceMode } from './lib/youtube.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

const minIdx = process.argv.indexOf('--min')
const MIN_LEADERS = minIdx >= 0 ? Number(process.argv[minIdx + 1]) || 2 : 2
const JSON_OUT = process.argv.includes('--json')

// Search one query per leader. Their name is the strongest possible signal for
// "someone interviewed this person" and needs no guessing about outlet names.
// EVERY contesting party's leader, not just the ones that come to mind. The
// first version of this list quietly omitted TOP's leader, which is the same
// failure mode the search is meant to fix: a discovery tool that only looks for
// who you remembered is a recall tool wearing a disguise. Under-covered parties
// are exactly the ones whose interviews we most need to find, because the big
// parties saturate the feed on their own.
const LEADERS = [
  'Christopher Luxon', 'Chris Hipkins', 'Chlöe Swarbrick', 'Marama Davidson',
  'David Seymour', 'Winston Peters', 'Rawiri Waititi', 'Debbie Ngarewa-Packer',
  'Qiulae Wong',
]

/** Channel IDs already in ingest-videos.mjs — parsed so this can never suggest
 *  something we already ingest, and never drifts out of date. */
function knownChannelIds() {
  const src = readFileSync(join(root, 'scripts/ingest-videos.mjs'), 'utf8')
  return new Set([...src.matchAll(/id: '(UC[\w-]{22})'/g)].map((m) => m[1]))
}

/** Rough age in days from YouTube's "3 weeks ago" style label. */
function ageDays(label) {
  const m = /(\d+)\s+(second|minute|hour|day|week|month|year)/.exec(label || '')
  if (!m) return null
  const n = Number(m[1])
  const mult = { second: 0, minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 }[m[2]]
  return n * mult
}

async function search(query) {
  // Data API first when a key is configured: it is region-locked to NZ and
  // language-locked to English, which the HTML page cannot express, and it
  // returns the description as well as the title. Falls back silently to
  // scraping so this works with no key at all.
  const api = await searchVideos(query, { max: 40 })
  if (api) {
    return api.map((r) => ({
      title: r.title,
      owner: r.channelTitle,
      chId: r.channelId,
      when: r.published,
      age: r.published ? Math.round((Date.now() - Date.parse(r.published)) / 86400000) : null,
    }))
  }

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  let html
  try { html = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-NZ,en;q=0.9' } }).then((r) => r.text()) }
  catch (e) { console.warn(`  ✗ "${query}": ${e.message}`); return [] }

  // Each result is a videoRenderer block; splitting keeps title, owner and
  // channel id together instead of zipping three independent match lists and
  // hoping the orders line up.
  const out = []
  for (const chunk of html.split('"videoRenderer":').slice(1)) {
    const block = chunk.slice(0, 4000)
    const title = (block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/) || [])[1]
    const owner = (block.match(/"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/) || [])[1]
    const chId = (block.match(/"ownerText":[\s\S]{0,400}?"browseId":"(UC[\w-]{22})"/) || [])[1]
    const when = (block.match(/"publishedTimeText":\{"simpleText":"([^"]+)"/) || [])[1]
    if (!title || !owner || !chId) continue
    out.push({ title: unesc(title), owner: unesc(owner), chId, when: when || null, age: ageDays(when) })
  }
  return out
}

const unesc = (s) => s.replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\n/g, ' ')

announceMode(' (discovery)')
const known = knownChannelIds()
console.log(`Already ingesting ${known.size} channels — those are excluded from the results.\n`)

const channels = new Map()   // chId -> { owner, leaders:Set, titles:[], freshest }
for (const leader of LEADERS) {
  const results = await search(`${leader} interview`)
  console.log(`  ${String(results.length).padStart(3)} results  "${leader} interview"`)
  for (const r of results) {
    if (known.has(r.chId)) continue
    // Ignore results that don't actually name the leader — YouTube pads the page
    // with loosely-related suggestions once it runs out of real matches.
    const surname = leader.split(' ').pop().toLowerCase()
    if (!r.title.toLowerCase().includes(surname)) continue
    if (r.age !== null && r.age > 400) continue        // stale campaign cycle
    if (!channels.has(r.chId)) channels.set(r.chId, { owner: r.owner, leaders: new Set(), titles: [], freshest: Infinity })
    const c = channels.get(r.chId)
    c.leaders.add(leader)
    if (c.titles.length < 3) c.titles.push(r.title)
    if (r.age !== null) c.freshest = Math.min(c.freshest, r.age)
  }
}

const ranked = [...channels.entries()]
  .map(([chId, c]) => ({ chId, ...c, breadth: c.leaders.size }))
  .filter((c) => c.breadth >= MIN_LEADERS)
  .sort((a, b) => b.breadth - a.breadth || a.freshest - b.freshest)

if (JSON_OUT) { console.log(JSON.stringify(ranked.map((c) => ({ ...c, leaders: [...c.leaders] })), null, 2)); process.exit(0) }

console.log(`\n${ranked.length} candidate channel(s) covering ${MIN_LEADERS}+ different leaders:\n`)
for (const c of ranked) {
  console.log(`${c.owner}`)
  console.log(`   id:       ${c.chId}`)
  console.log(`   leaders:  ${c.breadth} — ${[...c.leaders].join(', ')}`)
  console.log(`   freshest: ${c.freshest === Infinity ? 'unknown' : `~${c.freshest} days ago`}`)
  for (const t of c.titles) console.log(`   · ${t.slice(0, 92)}`)
  console.log()
}
console.log('Next: check a few uploads yourself, then confirm the ID with')
console.log('  node scripts/resolve-yt-channel.mjs <id>')
console.log('before adding it to CHANNELS in ingest-videos.mjs.')
process.exit(0)
