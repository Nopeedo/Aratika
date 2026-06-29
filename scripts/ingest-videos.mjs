/**
 * ingest-videos.mjs — "Leaders & the press" video feed from official YouTube
 * channel RSS (Parliament, RNZ, each party). We store the videoId + title +
 * thumbnail and EMBED via the privacy-enhanced player; we never host/rebroadcast.
 *
 * Party channels' videos are tagged to that party; Parliament/RNZ videos are
 * tagged by who they mention. Same hybrid model as the news feed (auto-publish,
 * editor can feature/reject). content_items type='video'.
 *
 * Run: node scripts/ingest-videos.mjs   (--reset to clear existing videos first)
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

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
]

const PARTY_TERMS = {
  national: ['national party', 'luxon', 'nicola willis', 'simeon brown'], labour: ['labour', 'hipkins', 'edmonds'],
  green: ['green party', 'swarbrick', 'davidson'], act: ['act party', 'seymour'],
  nzfirst: ['nz first', 'new zealand first', 'winston peters', 'shane jones'], tpm: ['te pāti māori', 'te pati maori', 'māori party', 'maori party', 'waititi', 'ngarewa-packer'],
  top: ['opportunity party', 'qiulae wong'],
}
const TOPIC_TERMS = {
  economy: ['econom', 'tax', 'budget', 'inflation', 'cost of living', 'wages'], housing: ['housing', 'rent', 'tenan', 'homeless'],
  health: ['health', 'hospital', 'pharmac', 'doctor'], education: ['school', 'educat', 'teacher', 'ncea'],
  climate: ['climate', 'emissions', 'environment', 'rma', 'conservation'], 'crime-justice': ['crime', 'police', 'gang', 'court', 'sentenc', 'justice'],
}
const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'coalition', 'debate', '2026', 'leader']
const tag = (map, t) => Object.keys(map).filter((k) => map[k].some((x) => t.includes(x)))

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
    const electionRelevant = parties.length > 0 || ELECTION_TERMS.some((x) => t.includes(x))
    rows.push({
      type: 'video', source_id: link, title: title.replace(/&amp;/g, '&'), summary: '', status: 'approved', source_url: link,
      data: { videoId: vid, source: ch.source, party: ch.party, parties, topics, pubDate: published, thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, electionRelevant, featured: false },
    })
  }
  if (rows.length) { const { error } = await sb.from('content_items').insert(rows); if (error) { console.error(`insert err (${ch.source}): ${error.message}`); continue } }
  staged += rows.length
  console.log(`✓ ${ch.source}: +${rows.length}`)
}
console.log(`\nDone. Staged ${staged} videos.`)
