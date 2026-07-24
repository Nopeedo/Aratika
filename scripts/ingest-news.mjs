/**
 * ingest-news.mjs — aggregate NZ political news into content_items (type='news').
 *
 * HYBRID model: outside the regulated election period the raw feed auto-publishes
 * (status='approved') — these are just headlines + outlet + link from credible
 * outlets' OWN RSS feeds (the intended syndication use). We NEVER republish article
 * text; we show the feed-provided title/snippet and link out. An editor can later
 * reject any item or mark it "featured" for the "what matters" highlight.
 *
 * During the regulated period (7 Aug–7 Nov 2026) news is held for editor review
 * (status='pending') instead, so a human clears each item before it goes public —
 * see the "Publish mode" block below.
 *
 * Each item is tagged with the parties / MPs / topics / electorates it mentions so
 * the /latest feed and the command-centre tracking can filter to what a user follows.
 *
 * Run: node scripts/ingest-news.mjs   (add --reset to clear existing news first)
 */
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PARTY_TERMS, isPolitical, tagMPs } from './political-terms.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const rss = new Parser({
  headers: { 'User-Agent': UA }, timeout: 20000,
  customFields: { item: [['media:content', 'mediaContent', { keepArray: true }], ['content:encoded', 'contentEncoded']] },
})

// Some feeds carry no image at all in their RSS (RNZ and the Beehive give none),
// so fall back to the article's own OpenGraph image — the same picture the outlet
// publishes for social shares. RNZ and Newsroom both expose a real photo this way;
// the Beehive genuinely has none (text-only releases), which the UI handles by
// falling back to a portrait of the MP the item is tagged to.
async function fetchOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) })
    if (!res.ok) return null
    const html = await res.text()
    const pats = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]
    for (const p of pats) {
      const m = html.match(p)
      if (m && /^https?:\/\//.test(m[1])) return m[1]
    }
  } catch { /* a missing picture must never fail the ingest */ }
  return null
}

// Pull a thumbnail from the feed item: media:content → enclosure → first <img> in content.
function extractImage(it) {
  const mc = it.mediaContent
  if (Array.isArray(mc)) for (const m of mc) { const u = m?.$?.url; if (u && /^https?:\/\//.test(u)) return u }
  if (it.enclosure?.url && /^https?:\/\//.test(it.enclosure.url) && /image|\.(jpg|jpeg|png|webp|avif)/i.test(it.enclosure.type || it.enclosure.url)) return it.enclosure.url
  const html = it.contentEncoded || it.content || it.summary || ''
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (m && /^https?:\/\//.test(m[1])) return m[1]
  return null
}

// Credible, verified-working NZ political RSS feeds. `cc` = content is openly
// licensed (RNZ Creative Commons) so we may show a longer excerpt; others = headline+snippet+link only.
const FEEDS = [
  { url: 'https://www.rnz.co.nz/rss/political.xml', outlet: 'RNZ', kind: 'media', cc: true },
  { url: 'https://www.beehive.govt.nz/rss.xml', outlet: 'Beehive (Govt)', kind: 'government', cc: false },
  { url: 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/section/nz/politics/?outputType=xml', outlet: 'NZ Herald', kind: 'media', cc: false },
  { url: 'https://www.stuff.co.nz/rss/national/politics', outlet: 'Stuff', kind: 'media', cc: false },
  { url: 'https://www.newsroom.co.nz/feed', outlet: 'Newsroom', kind: 'media', cc: false },
]

// Party detection — name + leaders/notable figures, lowercase.
// Party + political term lists — generated from the current MP roster
// (scripts/gen-political-terms.mjs). Every current MP is mapped to their party by
// full name, so "…Chris Bishop", "Cushla Tangaere-Manuel" etc. tag correctly.
const TOPIC_TERMS = {
  economy: ['econom', 'tax', 'budget', 'inflation', 'cost of living', 'gdp', 'wages'],
  housing: ['housing', 'rent', 'tenan', 'house price', 'homeless'],
  health: ['health', 'hospital', 'gp ', 'pharmac', 'doctor', 'mental health'],
  education: ['school', 'educat', 'teacher', 'student', 'ncea', 'university'],
  climate: ['climate', 'emissions', 'environment', 'rma', 'freshwater', 'conservation'],
  'crime-justice': ['crime', 'police', 'gang', 'court', 'sentenc', 'justice', 'prison'],
}
function tag(map, text) {
  const t = text.toLowerCase()
  return Object.keys(map).filter((k) => map[k].some((term) => t.includes(term)))
}

// Stage 1 of electorate-level coverage: tag articles that mention a battleground
// seat by name or its sitting MP by name. Scoped to the closest 2023 races only
// (majority < 3500) — a real, sourced signal (name matches), not a fabricated one.
// Keyed by the electorate's exact display name (matches ElectorateInfo.name in
// src/constants/electorates-data.ts) so the battleground page can filter by it directly.
const ELECTORATE_TERMS = {
  'Mt Albert': ['mt albert', 'mount albert', 'helen white'],
  'Nelson': ['nelson electorate', 'rachel boyack'],
  'Te Atatū': ['te atatu', 'te atatū', 'phil twyford'],
  'Banks Peninsula': ['banks peninsula', 'vanessa weenink'],
  'West Coast-Tasman': ['west coast-tasman', 'west coast tasman', 'maureen pugh'],
  'New Lynn': ['new lynn', 'paulo garcia'],
  'Wigram': ['wigram', 'megan woods'],
  'Hutt South': ['hutt south', 'chris bishop'],
  'Taieri': ['taieri', 'ingrid leary'],
  'Ōhāriu': ['ohariu', 'ōhāriu', "greg o'connor"],
  'Mt Roskill': ['mt roskill', 'mount roskill', 'carlos cheung'],
  'Christchurch Central': ['christchurch central', 'duncan webb'],
  'Te Tai Tokerau': ['te tai tokerau', 'mariameno kapa-kingi'],
  'Christchurch East': ['christchurch east', 'reuben davidson'],
  'Rongotai': ['rongotai', 'julie anne genter'],
  'Te Tai Tonga': ['te tai tonga', 'takuta ferris', 'tākuta ferris'],
  'Ikaroa-Rāwhiti': ['ikaroa-rawhiti', 'ikaroa-rāwhiti', 'cushla tangaere-manuel'],
  'Hauraki-Waikato': ['hauraki-waikato', 'hana-rawhiti maipi-clarke'],
  'Wairarapa': ['wairarapa', 'mike butterick'],
  'East Coast': ['east coast electorate', 'dana kirkpatrick'],
  'Palmerston North': ['palmerston north', 'tangi utikere'],
}
function tagElectorates(text) {
  const t = text.toLowerCase()
  return Object.keys(ELECTORATE_TERMS).filter((name) => ELECTORATE_TERMS[name].some((term) => t.includes(term)))
}

// Directly about the 2026 election / the contest for votes.
const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'ballot', 'coalition', 'preferred prime minister', 'hustings', 'leaders debate', "leaders' debate", '2026', 'on the campaign']
function isElectionRelevant(text, parties) {
  const t = text.toLowerCase()
  return parties.length > 0 || ELECTION_TERMS.some((term) => t.includes(term))
}

// Obvious non-political categories to drop from the general feeds (denylist). Only
// applied when an item is NOT election-relevant and touches no policy topic, so a
// political story that happens to mention sport/weather is never dropped.
const NEWS_NOISE_TERMS = [
  'weather', 'metservice', 'forecast', 'rain warning', 'daily quiz', 'the quiz', 'horoscope',
  'recipe', 'good as gold', 'lotto', 'powerball', 'matariki', 'all blacks', 'super rugby',
  'rugby', 'league', 'netball', 'cricket', 'warriors', 'silver ferns', 'black caps', 'football',
  'movie review', 'tv review', 'what to watch', 'travel guide',
]

const RESET = process.argv.includes('--reset')
if (RESET) {
  const { error } = await sb.from('content_items').delete().eq('type', 'news')
  console.log(error ? 'reset error: ' + error.message : 'cleared existing news')
}

// existing links (dedup)
const { data: existing } = await sb.from('content_items').select('source_id').eq('type', 'news')
const have = new Set((existing || []).map((r) => r.source_id))

// ── Publish mode ──────────────────────────────────────────────────────────────
// News auto-publishes (status='approved') OUTSIDE the regulated election period.
// From 7 Aug 2026 (regulated period opens) through election day 7 Nov 2026, news is
// instead held for editor review (status='pending') so a human clears each item
// before it goes public — third-party election content is exactly what the
// Electoral Commission scrutinises. Held items surface in /editor automatically.
// Overrides (for testing / emergencies): NEWS_HOLD=1 forces review, and
// NEWS_AUTOPUBLISH=1 forces immediate publish, regardless of the date.
const REGULATED_START = '2026-08-07', ELECTION_DAY = '2026-11-07'
const nzToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const inRegulatedPeriod = nzToday >= REGULATED_START && nzToday <= ELECTION_DAY
const holdForReview = process.env.NEWS_AUTOPUBLISH === '1' ? false
  : process.env.NEWS_HOLD === '1' ? true
  : inRegulatedPeriod
const NEWS_STATUS = holdForReview ? 'pending' : 'approved'
console.log(`Publish mode: ${NEWS_STATUS}${inRegulatedPeriod ? ' — regulated election period' : ''} (NZ date ${nzToday})`)

let staged = 0, skipped = 0, failedFeeds = 0
for (const feed of FEEDS) {
  let parsed
  try { parsed = await rss.parseURL(feed.url) } catch (e) { console.warn(`✗ ${feed.outlet}: ${e.message}`); failedFeeds++; continue }
  const rows = []
  for (const it of (parsed.items || [])) {
    const link = (it.link || '').split('?')[0].trim()
    if (!link || have.has(link)) { if (link) skipped++; continue }
    have.add(link)
    const title = (it.title || '').trim()
    if (!title) continue
    const snippetRaw = (it.contentSnippet || it.summary || '').replace(/\s+/g, ' ').trim()
    const snippet = snippetRaw.slice(0, feed.cc ? 400 : 220) // RNZ CC → longer excerpt OK
    const parties = tag(PARTY_TERMS, title + ' ' + snippetRaw)
    const topics = tag(TOPIC_TERMS, title + ' ' + snippetRaw)
    const mps = tagMPs(title + ' ' + snippetRaw)
    const electorates = tagElectorates(title + ' ' + snippetRaw)
    const electionRelevant = isElectionRelevant(title + ' ' + snippetRaw, parties)
    // Noise gate — a DENYLIST, not an allowlist: keyword-based political detection
    // misses MP/minister surnames, so an allowlist would wrongly drop real coverage
    // (e.g. a minister on a policy). Instead we drop only obvious non-political
    // categories (weather, sport, quizzes, lifestyle) — and even then only when the
    // item mentions no party, hits no election term, and touches no policy topic.
    // Match noise in the TITLE only — a stray sport/weather word in the body of a
    // political story shouldn't drop it.
    //
    // IMPORTANT: a bare party/MP name must NOT by itself rescue an obviously
    // non-political story (an MP photographed at a rugby game, a recipe that says
    // "greens"). Previously any party match set electionRelevant = true, which
    // bypassed this denylist entirely. So we require a REAL political or election
    // signal — passing [] to isPolitical deliberately ignores the party short-circuit.
    const isNoise = NEWS_NOISE_TERMS.some((x) => title.toLowerCase().includes(x))
    const body = title + ' ' + snippetRaw
    const strongSignal = ELECTION_TERMS.some((t) => body.toLowerCase().includes(t))
      || isPolitical(body, [])
      || topics.length > 0
    if (isNoise && !strongSignal) { skipped++; continue }
    // Prefer the image the feed gave us; only pay for a page fetch when there isn't one.
    let image = extractImage(it)
    if (!image) image = await fetchOgImage(link)
    rows.push({
      type: 'news', source_id: link, title, summary: snippet, status: NEWS_STATUS,
      change_kind: 'new', source_url: link,
      data: { link, outlet: feed.outlet, kind: feed.kind, cc: feed.cc, pubDate: it.isoDate || it.pubDate || null, parties, topics, mps, electorates, featured: false, image, electionRelevant },
    })
  }
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await sb.from('content_items').insert(rows.slice(i, i + 50))
    if (error) { console.error(`insert error (${feed.outlet}): ${error.message}`); break }
  }
  staged += rows.length
  console.log(`✓ ${feed.outlet}: +${rows.length} new`)
}
console.log(`\nDone. Staged ${staged} news items, skipped ${skipped} dupes, ${failedFeeds} feeds failed.`)
// The Supabase client keeps the event loop alive (open keep-alive sockets), so a
// one-shot script won't exit on its own — exit explicitly once the work is done.
process.exit(0)
