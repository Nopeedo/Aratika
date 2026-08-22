/**
 * detect-deep-dives.mjs — enqueue a DIGEST notification when a new policy
 * breakdown lands on a topic OR a party a user tracks.
 *
 * Tracking a policy topic only ever notified on news and video tagged to it.
 * Forty-one deep dives went up across ten parties and nobody following those
 * topics heard about any of them — which is the one kind of update the site
 * writes itself, and the most substantial thing on it.
 *
 * State-file baseline rather than a time window: deep dives are hand-written and
 * committed, so there is no reliable timestamp on them. The first run records
 * what already exists and notifies nobody — without that, everyone tracking a
 * topic would be told about every dive ever written, all at once.
 *
 * Digest, not immediate. A policy breakdown is worth reading, not worth
 * interrupting someone for, and they tend to land in batches as a party's
 * documents get worked through.
 *
 * Run: node scripts/detect-deep-dives.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey, DRY } from './lib/notify.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
dotenv.config({ path: join(root, '.env.local') })

const STATE_PATH = join(here, '.state', 'deep-dives.json')
const lc = (v) => String(v || '').toLowerCase()

/** Every (topic, party, slug, title) the file currently declares.
 *
 *  Parsed rather than imported: this is a .mjs script and the source is TS. The
 *  shape is stable and hand-maintained — one entry per object, topics first —
 *  so a scan for the four fields in order is reliable. A dive that fails to
 *  parse simply never notifies, which is the safe direction to fail. */
function currentDives() {
  const src = readFileSync(join(root, 'src/constants/policy-deep-dives.ts'), 'utf8')
  const out = []
  // Split on the party line so each chunk holds exactly one entry's fields.
  const chunks = src.split(/\n {4}party: '/).slice(1)
  let topicsBefore = src.split(/\n {4}party: '/)[0]
  for (const chunk of chunks) {
    const party = chunk.slice(0, chunk.indexOf("'"))
    const slug = (chunk.match(/\n {4}slug: '([^']+)'/) || [])[1]
    const title = (chunk.match(/\n {4}title:\s*\n?\s*'((?:[^'\\]|\\.)*)'/) || chunk.match(/\n {4}title: '((?:[^'\\]|\\.)*)'/) || [])[1]
    // topics: sits ABOVE party:, so it belongs to the preceding chunk's tail.
    const tm = topicsBefore.match(/\n {4}topics: \[([^\]]+)\][\s\S]*$/)
    const topics = tm ? [...tm[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
    if (slug && title && topics.length) out.push({ party, slug, title: title.replace(/\\'/g, "'"), topics })
    topicsBefore = chunk
  }
  return out
}

const dives = currentDives()
console.log(`Deep dives declared: ${dives.length}`)
if (dives.length === 0) { console.error('Parsed none — refusing to touch the baseline.'); process.exit(1) }

// --list prints what the parser actually saw and stops. This reads a TS file
// with regexes, which is the fragile part of the job: a reformat upstream could
// silently drop entries, and a dive that is not parsed is a dive nobody is ever
// told about. Being able to eyeball the mapping is worth the eight lines.
if (process.argv.includes('--list')) {
  for (const d of dives) console.log(`  [${d.topics.join(', ')}] ${d.party}/${d.slug} — ${d.title}`)
  const dual = dives.filter((d) => d.topics.length > 1)
  console.log(`\n${dual.length} dive(s) on more than one topic:`)
  for (const d of dual) console.log(`  ${d.party}/${d.slug} [${d.topics.join(', ')}]`)
  process.exit(0)
}

// First run: record and stop. Notifying here would mean telling everyone about
// every dive ever written.
if (!existsSync(STATE_PATH)) {
  if (!DRY) {
    mkdirSync(dirname(STATE_PATH), { recursive: true })
    writeFileSync(STATE_PATH, JSON.stringify(dives.map((d) => `${d.party}/${d.slug}`), null, 0))
  }
  console.log(`Baseline recorded for ${dives.length} deep dives — no notifications on first run.`)
  process.exit(0)
}

const seen = new Set(JSON.parse(readFileSync(STATE_PATH, 'utf8')))
const fresh = dives.filter((d) => !seen.has(`${d.party}/${d.slug}`))
console.log(`New since last run: ${fresh.length}`)
for (const d of fresh) console.log(`  · ${d.party} — ${d.title}`)

if (fresh.length > 0) {
  // Topic trackers AND party trackers. Following a party and not being told when
  // that party's policy gets broken down is the more surprising of the two
  // omissions — it was the original miss here. It also matters most for a dive
  // on a brand-new topic, which by definition nobody is tracking yet: without
  // the party side, such a dive notifies literally no one.
  const { data: bms, error } = await sb().from('bookmarks').select('user_id, kind, ref_id').in('kind', ['policy', 'party'])
  if (error) { console.error(error.message); process.exit(1) }

  // Carries each bookmark's OWN ref_id, not just the lowercased join key:
  // entity_ref must match bookmarks.ref_id exactly or the per-tile query finds
  // nothing.
  const byTopic = new Map()
  const byParty = new Map()
  for (const b of bms || []) {
    const m = b.kind === 'party' ? byParty : byTopic
    const key = lc(b.ref_id)
    if (!m.has(key)) m.set(key, [])
    m.get(key).push({ userId: b.user_id, refId: b.ref_id })
  }
  console.log(`Trackers: ${byTopic.size} topic(s), ${byParty.size} part(ies)`)

  let enqueued = 0
  for (const d of fresh) {
    // A dive can sit on two topics, and a user can track both the party and the
    // topic. Dedup is on the dive, so all of those collapse to one notification.
    // One notification per user, filed under the thing THEY track and linked
    // through THEIR topic.
    //
    // The entity was `{ kind: 'policy', ref: d.topic ?? d.slug }` and a dive
    // record has `topics`, plural — there is no `d.topic`, so it always fell
    // through to the dive's own slug. Every one of these was filed under a
    // policy ref that matches no bookmark that has ever existed, which is worse
    // than null: it looks attached and counts toward nothing.
    //
    // The link had the same shape of fault. It always used topics[0], so a
    // reader who follows Housing and gets a dive filed under both Economy and
    // Housing was sent to the Economy route for it. Now they land on Housing.
    const targets = new Map()
    for (const t of d.topics) {
      for (const b of byTopic.get(lc(t)) || []) {
        if (!targets.has(b.userId)) targets.set(b.userId, { entity: { kind: 'policy', ref: b.refId }, topic: t })
      }
    }
    // Party trackers keep the dive's own primary topic in the link — they did
    // not ask for a topic, so there is no better one to choose.
    for (const b of byParty.get(lc(d.party)) || []) {
      if (!targets.has(b.userId)) targets.set(b.userId, { entity: { kind: 'party', ref: b.refId }, topic: d.topics[0] })
    }
    for (const [userId, t] of targets) {
      await enqueue({
        userId,
        urgency: 'digest',
        category: 'policy',
        dedup: dedupKey('deep_dive', d.party, d.slug, userId),
        entity: t.entity,
        title: 'New policy breakdown',
        body: d.title,
        url: `/policies/${t.topic}/${d.party}/${d.slug}`,
      })
      enqueued++
    }
  }
  console.log(`Enqueued ${enqueued} notification(s).`)
}

if (!DRY) writeFileSync(STATE_PATH, JSON.stringify(dives.map((d) => `${d.party}/${d.slug}`), null, 0))
console.log(DRY ? 'Dry run — baseline not updated.' : 'Baseline updated.')
process.exit(0)
