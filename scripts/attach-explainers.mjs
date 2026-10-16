/**
 * attach-explainers.mjs — attach Politika's own policy explainer films to the
 * party position they explain.
 *
 * WHY NOT THE VIDEO FEED. content_items type='video' exists already, but it is
 * the "Leaders & the press" feed: party channels and the interview tier, pulled
 * by scripts/ingest-videos.mjs and ingested as status='pending' because, in that
 * script's own words, "they are partisan campaign content, so an editor must
 * approve". Our explainers are neither partisan campaign content nor press
 * coverage, and filing them there would label them as something they are not.
 *
 * They belong ON the position they explain: the film and the position row share
 * a source and an as-at date, so a reader looking at National's housing policy
 * can watch the film built from that same page, and the two cannot drift apart.
 *
 * The site EMBEDS from YouTube and never rehosts — same rule as the video feed.
 *
 * Run: node scripts/attach-explainers.mjs            (report only)
 *      node scripts/attach-explainers.mjs --apply
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const APPLY = process.argv.includes('--apply')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

/** channel UCONssxHlEElJ-E498hScHyg (PolitikaNZ123), all uploaded 15 Oct 2026.
 *  Every id below was confirmed public and embeddable via YouTube oEmbed. */
const FILMS = {
  national:               { videoId: 'wXdkdL9jEls', seconds: 151 },
  labour:                 { videoId: 'yuH7dK5xXIA', seconds: 121 },
  green:                  { videoId: 'KMloKoe2Aok', seconds: 135 },
  act:                    { videoId: 'UkVdFcnlXkk', seconds: 125 },
  nzfirst:                { videoId: 'GsH2cNdQAXc', seconds: 147 },
  tpm:                    { videoId: '72CrenpzowM', seconds: 168 },
  top:                    { videoId: 'NCGaz_ACO9Y', seconds: 162 },
  alliance:               { videoId: '2ueJyohRYqw', seconds: 116 },
  'te-tai-tokerau-party': { videoId: 'bPiCtIOe464', seconds: 161 },
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const rows = []
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from('content_items')
    .select('id,title,status,data').eq('type', 'position').order('id').range(f, f + 999)
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...(data || []))
  if (!data || data.length < 1000) break
}

const housing = rows.filter((r) =>
  r.status === 'approved' && r.data?.topic === 'housing' && r.data?.period === '2026')

console.log(`approved current housing positions: ${housing.length}`)
console.log(`films to attach: ${Object.keys(FILMS).length}\n`)

const plan = []
for (const [party, film] of Object.entries(FILMS)) {
  const row = housing.find((r) => r.data?.party === party)
  if (!row) { console.log(`  !! ${party.padEnd(22)} NO current housing position — skipped`); continue }
  const had = row.data?.explainer?.videoId
  plan.push({ row, party, film })
  console.log(`  ${party.padEnd(22)} ${film.videoId}  ${mmss(film.seconds).padStart(5)}  ` +
    `${had ? (had === film.videoId ? 'already set' : `REPLACES ${had}`) : 'new'}   ${row.title}`)
}

const orphan = housing.filter((r) => !FILMS[r.data?.party])
if (orphan.length) {
  console.log(`\nhousing positions with no film (left alone): ${orphan.map((r) => r.data?.party).join(', ')}`)
}

if (!APPLY) { console.log('\n(report only — pass --apply to write)'); process.exit(0) }

let wrote = 0
for (const { row, film } of plan) {
  const data = {
    ...row.data,
    explainer: {
      videoId: film.videoId,
      seconds: film.seconds,
      source: 'Politika',
      // What the reader is being offered, in the film's own terms. Not a
      // summary of the policy — the position row already carries that.
      label: `Watch the ${mmss(film.seconds)} explainer`,
      addedAt: '2026-10-16',
    },
  }
  const { error } = await sb.from('content_items').update({ data }).eq('id', row.id)
  if (error) { console.error(`  ! ${row.title}: ${error.message}`); continue }
  console.log(`  ✓ ${row.title}`)
  wrote++
}
console.log(`\napplied: ${wrote} row(s)`)
