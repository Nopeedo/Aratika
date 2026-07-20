/**
 * ingest-videos.mjs — "Leaders & the press" video feed from official YouTube
 * channel RSS (Parliament, RNZ, each party). We store the videoId + title +
 * thumbnail and EMBED via the privacy-enhanced player; we never host/rebroadcast.
 *
 * Party channels' videos are tagged to that party; Parliament/RNZ videos are
 * tagged by who they mention. Unlike the news feed, videos are ingested as
 * status='pending' — they are partisan campaign content, so an editor must
 * approve (and can fix topic tags) via /editor before they go public.
 * content_items type='video'.
 *
 * Run: node scripts/ingest-videos.mjs   (--reset to clear existing videos first)
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PARTY_TERMS, isPolitical } from './political-terms.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const PER_CHANNEL = 6

// Official channels (resolved + RSS-verified). party=null → tag by who's mentioned.
const CHANNELS = [
  { id: 'UC2N5fRXq0RjHIBofCqslsQA', source: 'NZ Parliament', party: null },
  { id: 'UCp4OXwfZE1SaCQ4jRAuaoXQ', source: 'RNZ', party: null },
  { id: 'UCWdJ3BxqWopIdJ7J_BNu1zQ', source: 'National Party', party: 'national' },
  { id: 'UCiz_HNe4CVNzP-yeYoFydQw', source: 'Labour Party', party: 'labour' },
  { id: 'UCHMJ7z-9wxGvWVljzfntFVQ', source: 'Green Party', party: 'green' },
  { id: 'UCckaX40msHD_vg6iDupfIHA', source: 'ACT', party: 'act' },
  { id: 'UC8PPX2ej6D_77czqEJp46dA', source: 'NZ First', party: 'nzfirst' },
  { id: 'UCRdKSAr6go-3bTSJUZMoXGg', source: 'Te Pāti Māori', party: 'tpm' },
  { id: 'UCkV9-rENFpIihiBnePk5imA', source: 'The Opportunity Party', party: 'top' },
  // ── Broadcaster channels that host the leaders'/minor-party DEBATES ──────────
  // IDs verified from each channel's own "externalId" in ytInitialData
  // (@1NewsNZ / @ThreeNowNZ / @nzheraldtv). party=null → tagged by who's
  // mentioned; debate videos are auto-flagged (DEBATE_TERMS) and reviewed in
  // /editor before going public.
  // debatesOnly: general broadcasters — we only want their debate/leader-interview
  // clips, not their weather/sport/general-news feed.
  { id: 'UCxPAYgO8OpFev3PUTKbsxNw', source: '1News (TVNZ) — Q+A / Jack Tame', party: null, debatesOnly: true },
  { id: 'UCBTMdHIU_I0KLPDmWCqTbYg', source: 'ThreeNews', party: null, debatesOnly: true },
  { id: 'UCG0xyRVgb5Yf1lvQxkRrYYQ', source: 'NZ Herald — Herald NOW / Ryan Bridge', party: null, debatesOnly: true },
]

// Party + political term lists — generated from the current MP roster
// (scripts/gen-political-terms.mjs). Every current MP is mapped to their party by
// full name, so "…Chris Bishop", "Cushla Tangaere-Manuel" etc. tag correctly.
const TOPIC_TERMS = {
  economy: ['econom', 'tax', 'budget', 'inflation', 'cost of living', 'wages'], housing: ['housing', 'rent', 'tenan', 'homeless'],
  health: ['health', 'hospital', 'pharmac', 'doctor'], education: ['school', 'educat', 'teacher', 'ncea'],
  climate: ['climate', 'emissions', 'environment', 'rma', 'conservation'], 'crime-justice': ['crime', 'police', 'gang', 'court', 'sentenc', 'justice'],
}
const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'coalition', 'debate', '2026', 'leader']
// Leaders'/minor-party debates and long-form leader interviews — surfaced as a
// dedicated "Debates" rail in the Election Centre. Broadcast by media channels
// (see CHANNELS), reviewed in /editor before showing.
const DEBATE_TERMS = ['debate', 'q+a', 'q&a', 'head to head', 'head-to-head', 'the great debate', 'minor party', 'leaders interview']
// Obvious non-political categories dropped from political channels (Parliament/RNZ)
// — only when the clip also mentions no party, no election term and no policy topic.
const VIDEO_NOISE_TERMS = ['gardener', 'once were', 'matariki', 'trailer', 'weather', 'forecast', 'recipe', 'all blacks', 'super rugby', 'silver ferns', 'black caps', 'good as gold', 'episode ']
const tag = (map, t) => Object.keys(map).filter((k) => map[k].some((x) => t.includes(x)))

// Same battleground-scoped electorate tagging as ingest-news.mjs (majority < 3500
// seats only — real name matches, not fabricated). Keep these two lists in sync.
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
const tagElectorates = (t) => Object.keys(ELECTORATE_TERMS).filter((name) => ELECTORATE_TERMS[name].some((term) => t.includes(term)))

const RESET = process.argv.includes('--reset')
if (RESET) { const { error } = await sb.from('content_items').delete().eq('type', 'video'); console.log(error ? 'reset err: ' + error.message : 'cleared existing videos') }

const { data: existing } = await sb.from('content_items').select('source_id').eq('type', 'video')
const have = new Set((existing || []).map((r) => r.source_id))

let staged = 0
for (const ch of CHANNELS) {
  let xml
  try { xml = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + ch.id, { headers: { 'User-Agent': UA } }).then((r) => r.text()) }
  catch (e) { console.warn(`✗ ${ch.source}: ${e.message}`); continue }
  const entries = xml.split('<entry>').slice(1, PER_CHANNEL + 1)
  const rows = []
  for (const e of entries) {
    const vid = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
    const title = (e.match(/<title>([^<]+)<\/title>/) || [])[1]
    const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1] || null
    if (!vid || !title) continue
    const link = `https://www.youtube.com/watch?v=${vid}`
    if (have.has(link)) continue
    have.add(link)
    const t = title.toLowerCase()
    const parties = ch.party ? [ch.party] : tag(PARTY_TERMS, t)
    const topics = tag(TOPIC_TERMS, t)
    const electorates = tagElectorates(t)
    const electionRelevant = parties.length > 0 || ELECTION_TERMS.some((x) => t.includes(x))
    const debate = DEBATE_TERMS.some((x) => t.includes(x))
    // Noise gate. Keyword relevance detection is too weak to use as an allowlist
    // (it misses bare party names and minister surnames, e.g. "National promises…",
    // "ACT announces…", "…Chris Bishop"), so we DON'T filter political channels by it.
    // Instead:
    //  • Broadcaster channels are here ONLY for debates → stage a clip only if it's
    //    flagged as a debate. This drops their general weather/sport/Ryan-Bridge feed.
    //  • Political sources (Parliament, RNZ) and party channels stage as before, minus
    //    obvious lifestyle/sport noise via a denylist.
    if (ch.debatesOnly && !debate && !electionRelevant) continue
    const isNoise = VIDEO_NOISE_TERMS.some((x) => t.includes(x))
    if (isNoise && !debate && !electionRelevant && !isPolitical(t, parties) && topics.length === 0) continue
    rows.push({
      type: 'video', source_id: link, title: title.replace(/&amp;/g, '&'), summary: '', status: 'pending', source_url: link,
      data: { videoId: vid, source: ch.source, party: ch.party, parties, topics, electorates, pubDate: published, thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, electionRelevant, debate, featured: false },
    })
  }
  if (rows.length) { const { error } = await sb.from('content_items').insert(rows); if (error) { console.error(`insert err (${ch.source}): ${error.message}`); continue } }
  staged += rows.length
  console.log(`✓ ${ch.source}: +${rows.length}`)
}
console.log(`\nDone. Staged ${staged} videos.`)
// Supabase client keeps the event loop alive — exit explicitly so the step ends.
process.exit(0)
