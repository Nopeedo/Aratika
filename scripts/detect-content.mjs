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
const { data: bms, error: e2 } = await sb().from('bookmarks').select('user_id, kind, ref_id').in('kind', ['party', 'mp', 'policy', 'electorate', 'bill'])
if (e2) { console.error(e2.message); process.exit(1) }
const idx = { party: new Map(), mp: new Map(), policy: new Map(), electorate: new Map(), bill: new Map() }
for (const b of bms || []) {
  const m = idx[b.kind]; if (!m) continue
  const key = lc(b.ref_id)
  if (!m.has(key)) m.set(key, new Set())
  m.get(key).add(b.user_id)
}

// data-tag field → bookmark kind it maps to.
// `bills` was added later than the rest: tracking a bill got you status changes
// and submission windows but no coverage of it, which is the thing people
// actually notice. Items ingested before that tag existed simply have no
// `bills` key and are skipped, which is the right way to fail.
const TAG_TO_KIND = { parties: 'party', mps: 'mp', topics: 'policy', electorates: 'electorate', bills: 'bill' }

let enqueued = 0
for (const it of items || []) {
  const users = new Set()
  for (const [tagField, kind] of Object.entries(TAG_TO_KIND)) {
    const tags = Array.isArray(it.data?.[tagField]) ? it.data[tagField] : []
    for (const t of tags) for (const u of idx[kind].get(lc(t)) || []) users.add(u)
  }
  if (users.size === 0) continue

  const url = it.data?.link || it.source_url || '/news'
  const body = it.data?.outlet ? `${it.type === 'video' ? 'Video' : 'News'} · ${it.data.outlet}` : (it.type === 'video' ? 'New video' : 'New article')
  for (const userId of users) {
    await enqueue({
      userId, urgency: 'digest', category: it.type,
      dedup: dedupKey('content', it.id, userId),
      title: it.title, body, url,
    })
    enqueued++
  }
}
console.log(`Enqueued ${enqueued} digest notification(s).`)
process.exit(0)
