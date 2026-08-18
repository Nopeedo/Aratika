/**
 * detect-candidates.mjs — enqueue a DIGEST notification when a challenger is
 * confirmed in an electorate a user tracks.
 *
 * The battleground pages were the one tracked thing with no trigger of their
 * own: following a seat got you news that happened to name it, and nothing
 * about the contest itself. A confirmed candidate is the actual event on that
 * page — it changes who you'd be choosing between.
 *
 * Keyed on `reviewed_at`, not `fetched_at`: a candidate is scraped weekly but
 * only becomes real when an editor approves them, and that is the moment worth
 * telling someone about. Bookmarks store the electorate's DISPLAY name, and the
 * staged row carries `data.electorate` in the same form, so the two join
 * directly.
 *
 * Digest rather than immediate, deliberately. Editors approve in batches, so a
 * single review session can confirm a dozen candidates at once; as immediate
 * rows that would be a dozen separate pushes. Digest collapses them into one
 * "N updates on what you follow" at 7am, which is soon enough for a candidate
 * announcement — unlike a submission deadline, nothing expires overnight.
 *
 * Run: node scripts/detect-candidates.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const WINDOW_HOURS = 26
const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
const lc = (v) => String(v || '').toLowerCase()

const { data: items, error: e1 } = await sb()
  .from('content_items')
  .select('id, data, reviewed_at')
  .eq('type', 'candidate').eq('status', 'approved')
  .gte('reviewed_at', since)
if (e1) { console.error(e1.message); process.exit(1) }
console.log(`Candidates approved in the last ${WINDOW_HOURS}h: ${items?.length ?? 0}`)
if (!items?.length) process.exit(0)

// Who tracks which seat, by display name.
const { data: bms, error: e2 } = await sb().from('bookmarks').select('user_id, ref_id').in('kind', ['electorate', 'battleground'])
if (e2) { console.error(e2.message); process.exit(1) }
const byElectorate = new Map()
for (const b of bms || []) {
  const key = lc(b.ref_id)
  if (!byElectorate.has(key)) byElectorate.set(key, new Set())
  byElectorate.get(key).add(b.user_id)
}

let enqueued = 0
for (const it of items) {
  const d = it.data || {}
  const name = d.name
  const electorate = d.electorate
  if (!name || !electorate) continue

  const users = byElectorate.get(lc(electorate))
  if (!users?.size) continue

  // partyLabel is the source's own wording, kept because it is what the row was
  // staged with; the mapped slug can be null where the label is unrecognised.
  const party = d.partyLabel || d.party
  for (const userId of users) {
    await enqueue({
      userId,
      urgency: 'digest',
      category: 'candidate',
      dedup: dedupKey('candidate', it.id, userId),
      title: `New candidate in ${electorate}`,
      body: party ? `${name} is standing for ${party}.` : `${name} is standing.`,
      url: d.electorateSlug ? `/battlegrounds/${d.electorateSlug}` : '/battlegrounds',
    })
    enqueued++
  }
}
console.log(`Enqueued ${enqueued} candidate notification(s).`)
process.exit(0)
