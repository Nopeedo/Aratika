/**
 * detect-content.mjs — enqueue DIGEST notifications when new news/video lands on
 * something a user tracks (a party, MP, policy issue, electorate, or bill).
 *
 * Recent approved content_items (news/video, last ~26h) carry tag arrays in
 * `data` (parties / mps / topics / electorates — set by the ingest tagger). We
 * match those against bookmarks and enqueue one digest row per (user, item);
 * the sender batches them into a single "N updates on what you follow" push.
 * Dedup on (user, item) means an item never notifies the same user twice.
 *
 * Run: node scripts/detect-content.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const WINDOW_HOURS = 26
const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
const lc = (v) => String(v || '').toLowerCase()

// Recent approved news + video.
const { data: items, error: e1 } = await sb()
  .from('content_items')
  .select('id, type, title, data, source_url, fetched_at')
  .in('type', ['news', 'video']).eq('status', 'approved')
  .gte('fetched_at', since)
if (e1) { console.error(e1.message); process.exit(1) }
console.log(`Recent approved news/video (last ${WINDOW_HOURS}h): ${items?.length ?? 0}`)

// Bookmarks that can match content, indexed by kind → ref_id → Set(userId).
const { data: bms, error: e2 } = await sb().from('bookmarks').select('user_id, kind, ref_id').in('kind', ['party', 'mp', 'policy', 'electorate', 'bill', 'battleground'])
if (e2) { console.error(e2.message); process.exit(1) }
// Each entry carries the bookmark's OWN ref_id, not only the user. Matching is
// case-insensitive on purpose (ingest tags and bookmark refs are written by
// different code paths), but what gets STORED as entity_ref has to be the
// bookmark's exact ref_id — the dashboard looks tiles up with .eq(), so a tag
// that differs only in case would file the notification against a tile that
// does not exist. Every current tag happens to be a lowercase slug, so this has
// been correct by luck rather than by construction.
const idx = { party: new Map(), mp: new Map(), policy: new Map(), electorate: new Map(), bill: new Map(), battleground: new Map() }
for (const b of bms || []) {
  const m = idx[b.kind]; if (!m) continue
  const key = lc(b.ref_id)
  if (!m.has(key)) m.set(key, [])
  m.get(key).push({ userId: b.user_id, refId: b.ref_id })
}

// data-tag field → bookmark kind it maps to.
// `bills` was added later than the rest: tracking a bill got you status changes
// and submission windows but no coverage of it, which is the thing people
// actually notice. Items ingested before that tag existed simply have no
// `bills` key and are skipped, which is the right way to fail.
// One tag can feed more than one kind. An electorate tag reaches BOTH the
// people following that seat on the map and the people following its race on
// the battlegrounds map — splitting those into separate kinds was about where
// they file in the Command Centre, not about who hears the news.
const TAG_TO_KIND = {
  parties: ['party'], mps: ['mp'], topics: ['policy'],
  electorates: ['electorate', 'battleground'], bills: ['bill'],
}

/**
 * Which tracked thing a story gets FILED under, when it matches several.
 *
 * One item can be tagged to a party, an MP and an electorate at once, and a user
 * may track all three — but dedup is per (user, item), so there is exactly one
 * row and it needs one owner. Filing it under the narrowest match is what makes
 * the dashboard count read sensibly: a story naming Luxon belongs on Luxon
 * rather than on National, where it would sit alongside everything else the
 * party did that week.
 *
 * Splitting into one row per matched entity was the alternative and is worse —
 * a reader tracking both would be told about the same story twice, and the
 * volume problem here is already the main complaint.
 */
const SPECIFICITY = ['bill', 'mp', 'battleground', 'electorate', 'policy', 'party']

let enqueued = 0
for (const it of items || []) {
  // user -> the best entity match we have for them on this item.
  const best = new Map()
  for (const [tagField, kinds] of Object.entries(TAG_TO_KIND)) {
    const tags = Array.isArray(it.data?.[tagField]) ? it.data[tagField] : []
    for (const t of tags) {
      for (const kind of kinds) {
        for (const b of idx[kind].get(lc(t)) || []) {
          const prev = best.get(b.userId)
          const rank = SPECIFICITY.indexOf(kind)
          if (!prev || rank < SPECIFICITY.indexOf(prev.kind)) best.set(b.userId, { kind, ref: b.refId })
        }
      }
    }
  }
  if (best.size === 0) continue

  const url = it.data?.link || it.source_url || '/news'
  const body = it.data?.outlet ? `${it.type === 'video' ? 'Video' : 'News'} · ${it.data.outlet}` : (it.type === 'video' ? 'New video' : 'New article')
  for (const [userId, entity] of best) {
    await enqueue({
      userId, urgency: 'digest', category: it.type,
      dedup: dedupKey('content', it.id, userId),
      title: it.title, body, url, entity,
    })
    enqueued++
  }
}
console.log(`Enqueued ${enqueued} digest notification(s).`)
process.exit(0)
