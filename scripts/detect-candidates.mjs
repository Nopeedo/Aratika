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
// kind, ref_id AND href. `kind` because a seat can be tracked two ways and the
// notification has to file under the one this reader actually chose; `href`
// because those two ways have different pages — the map for an electorate, the
// contest page for a battleground — and sending an electorate follower to the
// battleground page is not where they asked to be.
const { data: bms, error: e2 } = await sb().from('bookmarks').select('user_id, kind, ref_id, href').in('kind', ['electorate', 'battleground'])
if (e2) { console.error(e2.message); process.exit(1) }
const byElectorate = new Map()
for (const b of bms || []) {
  const key = lc(b.ref_id)
  if (!byElectorate.has(key)) byElectorate.set(key, [])
  byElectorate.get(key).push(b)
}

let enqueued = 0
for (const it of items) {
  const d = it.data || {}
  const name = d.name
  const electorate = d.electorate
  if (!name || !electorate) continue

  const followers = byElectorate.get(lc(electorate))
  if (!followers?.length) continue

  // partyLabel is the source's own wording, kept because it is what the row was
  // staged with; the mapped slug can be null where the label is unrecognised.
  const party = d.partyLabel || d.party
  // One row per follower, filed under the seat THEY track and linked to the
  // page they track it on.
  //
  // This passed no entity at all, so a new challenger appearing — which the
  // site treats as urgent, and which therefore never expires — counted on
  // nobody's tile and appeared on no tracked item's page. The dashboard filters
  // on entity_kind being present, so these were push-only and invisible in the
  // app entirely.
  const seen = new Set()
  for (const b of followers) {
    if (seen.has(b.user_id)) continue
    seen.add(b.user_id)
    await enqueue({
      userId: b.user_id,
      // Immediate, not digest.
      //
      // A new name entering a race you follow is one of the four things this
      // site treats as urgent, and it was sitting in the queue until the 7am
      // roll-up — by which point it arrives as one line among a dozen headlines
      // rather than as the thing that changed. The immediate sweeps run three
      // times a day and skip quiet hours, so this reaches someone within hours
      // while staying off their phone overnight.
      //
      // No burst risk from a bulk ingest: the sender collapses everything a user
      // has pending in one run into a single push, so 40 new candidates is one
      // notification, not 40.
      urgency: 'immediate',
      category: 'candidate',
      dedup: dedupKey('candidate', it.id, b.user_id),
      entity: { kind: b.kind, ref: b.ref_id },
      title: `New candidate in ${electorate}`,
      body: party ? `${name} is standing for ${party}.` : `${name} is standing.`,
      url: b.href || (d.electorateSlug ? `/battlegrounds/${d.electorateSlug}` : '/battlegrounds'),
    })
    enqueued++
  }
}
console.log(`Enqueued ${enqueued} candidate notification(s).`)
process.exit(0)
