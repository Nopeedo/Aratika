/**
 * ingest-news.mjs — aggregate NZ political news into content_items (type='news').
 *
 * HYBRID model: the raw feed auto-publishes (status='approved') — these are just
 * headlines + outlet + link from credible outlets' OWN RSS feeds (the intended
 * syndication use). We NEVER republish article text; we show the feed-provided
 * title/snippet and link out. An editor can later reject any item or mark it
 * "featured" for the "what matters" highlight.
 *
 * Each item is tagged with the parties / topics it mentions so the /latest feed
 * and the command-centre tracking can filter to what a user follows.
 *
 * Run: node scripts/ingest-news.mjs   (add --reset to clear existing news first)
 */
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const rss = new Parser({
  headers: { 'User-Agent': UA }, timeout: 20000,
  customFields: { item: [['media:content', 'mediaContent', { keepArray: true }], ['content:encoded', 'contentEncoded']] },
})

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
const PARTY_TERMS = {
  national: ['national party', 'luxon', 'nicola willis', 'simeon brown', 'national-led', 'national mp'],
  labour: ['labour party', 'hipkins', 'chris hipkins', 'barbara edmonds', 'labour mp', 'labour leader'],
  green: ['green party', 'the greens', 'swarbrick', 'marama davidson', 'green mp', 'greens'],
  act: ['act party', 'act new zealand', 'david seymour', 'act mp'],
  nzfirst: ['nz first', 'new zealand first', 'winston peters', 'shane jones'],
  tpm: ['te pāti māori', 'te pati maori', 'māori party', 'maori party', 'waititi', 'ngarewa-packer'],
  top: ['opportunity party', 'qiulae wong'],
}
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

// Directly about the 2026 election / the contest for votes.
const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'ballot', 'coalition', 'preferred prime minister', 'hustings', 'leaders debate', "leaders' debate", '2026', 'on the campaign']
function isElectionRelevant(text, parties) {
  const t = text.toLowerCase()
  return parties.length > 0 || ELECTION_TERMS.some((term) => t.includes(term))
}

const RESET = process.argv.includes('--reset')
if (RESET) {
  const { error } = await sb.from('content_items').delete().eq('type', 'news')
  console.log(error ? 'reset error: ' + error.message : 'cleared existing news')
}

// existing links (dedup)
const { data: existing } = await sb.from('content_items').select('source_id').eq('type', 'news')
const have = new Set((existing || []).map((r) => r.source_id))

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
    rows.push({
      type: 'news', source_id: link, title, summary: snippet, status: 'approved',
      source_url: link,
      data: { link, outlet: feed.outlet, kind: feed.kind, cc: feed.cc, pubDate: it.isoDate || it.pubDate || null, parties, topics, featured: false, image: extractImage(it), electionRelevant: isElectionRelevant(title + ' ' + snippetRaw, parties) },
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
