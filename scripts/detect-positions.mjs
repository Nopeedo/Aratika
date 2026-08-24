/**
 * detect-positions.mjs — enqueue a DIGEST notification when a party's stated
 * position on a policy topic is published or updated.
 *
 * Positions are the substance of the policy comparison: what each party says on
 * each topic, sourced and editor-approved. They were the one piece of
 * site-authored content nobody was ever told about. detect-content only ever
 * looked at news and video, so a position could go live — or be rewritten after
 * a party changed its policy — in complete silence.
 *
 * Not folded into detect-content, despite reading the same table. Three things
 * differ and every one of them would have been a silent wrong answer:
 *   - News is windowed on fetched_at. A position's fetched_at is when the draft
 *     was written, which can be weeks before an editor approves it, so a
 *     position would either notify on a draft or never surface at all. Approval
 *     stamps reviewed_at; that is publication, and that is what we window on.
 *   - News links out to source_url. A position's source_url is the party's own
 *     website — sending someone there skips the comparison they came for. The
 *     link belongs on our page for that party and topic.
 *   - News is tagged with plural data.parties / data.topics by the ingest
 *     tagger. A position carries singular data.party / data.topic, written by
 *     draft-positions.mjs. The plural lookup finds nothing on a position.
 *
 * Goes to both party trackers and topic trackers, deduped on the position, so
 * following both National and Health gets you one notification, not two.
 *
 * Digest, not immediate: a policy position is worth reading, not worth
 * interrupting someone for, and they land in batches as an editor works through
 * a review queue.
 *
 * Run: node scripts/detect-positions.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

// Wider than the daily cron so a skipped or failed run doesn't drop a day of
// approvals on the floor. Re-runs are harmless — enqueue dedups.
const WINDOW_HOURS = 26
const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
const lc = (v) => String(v || '').toLowerCase()

const { data: items, error: e1 } = await sb()
  .from('content_items')
  .select('id, title, summary, data, change_kind, reviewed_at')
  .eq('type', 'position').eq('status', 'approved')
  .gte('reviewed_at', since)
if (e1) { console.error(e1.message); process.exit(1) }
console.log(`Positions approved in the last ${WINDOW_HOURS}h: ${items?.length ?? 0}`)

if (!items || items.length === 0) {
  console.log('Nothing to enqueue.')
  process.exit(0)
}

// Only the current policy is news. A 2023-manifesto entry is written for the
// then-and-now comparison — it is history being backfilled, not a party saying
// something new, and telling people it is an update would be wrong.
const current = items.filter((it) => String(it.data?.period || '') !== '2023')
console.log(`Current-policy positions (2023 manifesto entries skipped): ${current.length}`)

const { data: bms, error: e2 } = await sb()
  .from('bookmarks').select('user_id, kind, ref_id').in('kind', ['party', 'policy'])
if (e2) { console.error(e2.message); process.exit(1) }

// The bookmark's OWN ref_id is carried alongside the user, not just the
// lowercased join key. entity_ref has to match bookmarks.ref_id exactly or the
// dashboard's per-tile query finds nothing — matching case-insensitively and
// then storing the folded value would attach the notification to a tile that
// does not exist.
const byParty = new Map()
const byTopic = new Map()
for (const b of bms || []) {
  const m = b.kind === 'party' ? byParty : byTopic
  const key = lc(b.ref_id)
  if (!m.has(key)) m.set(key, [])
  m.get(key).push({ userId: b.user_id, refId: b.ref_id })
}
console.log(`Trackers: ${byParty.size} part(ies), ${byTopic.size} topic(s)`)

let enqueued = 0
let skipped = 0
for (const it of current) {
  const party = lc(it.data?.party)
  const topic = lc(it.data?.topic)
  // A position with no party or topic cannot be linked to a page or matched to
  // a tracker. Skip loudly rather than enqueue a notification going nowhere.
  if (!party || !topic) { console.warn(`  ⚠ skipped ${it.id}: missing party or topic`); skipped++; continue }

  // One notification per user, filed under the tracked thing it is about.
  //
  // This passed no entity at all, so every position update landed with
  // entity_kind NULL: it counted on nobody's tile and appeared on no tracked
  // item's page. Following "Economy" and being told a party moved on Economy,
  // with the Economy tile still reading zero, is the red dot all over again.
  //
  // Topic before party, the same order of specificity detect-content uses: a
  // reader tracking both wants "National on Economy" under Economy, which is
  // the narrower of the two things they asked to hear about.
  const targets = new Map()
  for (const b of byTopic.get(topic) || []) targets.set(b.userId, { kind: 'policy', ref: b.refId })
  for (const b of byParty.get(party) || []) if (!targets.has(b.userId)) targets.set(b.userId, { kind: 'party', ref: b.refId })
  if (targets.size === 0) continue

  const partyName = it.data?.partyName || it.data?.party
  const topicLabel = it.data?.topicLabel || it.data?.topic
  const updated = it.change_kind === 'updated'

  // The stance is the one-line version of the position and is what the card
  // shows; fall back to the summary if an entry has none.
  const stance = String(it.data?.stance || it.summary || '').trim()

  for (const [userId, entity] of targets) {
    await enqueue({
      userId,
      entity,
      urgency: 'digest',
      category: 'position',
      // On the position, not the topic or party — so tracking both gets one.
      // Includes reviewed_at so a genuine later revision notifies again rather
      // than being swallowed as a duplicate of the first publication.
      dedup: dedupKey('position', it.id, it.reviewed_at, userId),
      // A verified absence is not a position, and "Labour on Foreign Policy"
      // implies they said something. Six of these went out reading that way
      // before this branch existed.
      title: it.data?.noPosition
        ? `${partyName} has no published position on ${topicLabel}`
        : updated ? `${partyName} updated their ${topicLabel} policy` : `${partyName} on ${topicLabel}`,
      body: stance.length > 140 ? `${stance.slice(0, 137)}…` : stance,
      url: `/policies/${topic}/${party}`,
    })
    enqueued++
  }
}

console.log(`Enqueued ${enqueued} notification(s)${skipped ? `, skipped ${skipped} malformed` : ''}.`)
process.exit(0)
