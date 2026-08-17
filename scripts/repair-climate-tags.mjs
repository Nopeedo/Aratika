/**
 * repair-climate-tags.mjs — one-shot repair for items mis-tagged 'climate' by
 * the bare 'rma' substring.
 *
 * TOPIC_TERMS.climate contained 'rma' to catch the Resource Management Act.
 * Matching is plain substring, so it also matched "information",
 * "transformation", "performance" and "format". On a 1000-item sample, 92 of the
 * 123 climate-tagged items contained no climate word at all — police despatch
 * systems, manufacturing output, books of the week — all listed on the Climate
 * topic page and pushed to everyone tracking Climate.
 *
 * The term list is fixed in ingest-news.mjs and ingest-videos.mjs; this cleans up
 * what already landed.
 *
 * Only removes 'climate', and only where the corrected terms do not match. It
 * never adds a tag and never touches another topic, so the worst case is that a
 * genuinely-climate item phrased without any climate word loses the tag.
 *
 * Editor-reviewed items are SKIPPED by default: /editor lets an editor fix topic
 * tags by hand, and a bulk correction must not silently undo that judgement.
 * Pass --include-reviewed to sweep those too.
 *
 * Run: node scripts/repair-climate-tags.mjs [--apply] [--include-reviewed]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const APPLY = process.argv.includes('--apply')
const INCLUDE_REVIEWED = process.argv.includes('--include-reviewed')

// The corrected climate terms, kept identical to the ingests.
const CLIMATE = ['climate', 'emissions', 'environment', 'resource management', 'rma reform', ' rma ', 'freshwater', 'conservation']

const { data, error } = await sb()
  .from('content_items')
  .select('id, type, title, summary, data, reviewed_at')
  .in('type', ['news', 'video'])
if (error) { console.error(error.message); process.exit(1) }

const tagged = (data || []).filter((it) => (it.data?.topics || []).includes('climate'))
console.log(`items: ${data?.length ?? 0}   tagged climate: ${tagged.length}`)

const wrong = []
let keptReviewed = 0
for (const it of tagged) {
  const t = `${it.title} ${it.summary || ''}`.toLowerCase()
  if (CLIMATE.some((w) => t.includes(w))) continue      // genuinely climate — leave alone
  if (it.reviewed_at && !INCLUDE_REVIEWED) { keptReviewed++; continue }
  wrong.push(it)
}

console.log(`mis-tagged: ${wrong.length}`)
if (keptReviewed) console.log(`skipped because an editor reviewed them: ${keptReviewed}  (--include-reviewed to sweep)`)
for (const it of wrong.slice(0, 15)) console.log(`   ${it.type}  ${it.title.slice(0, 88)}`)
if (wrong.length > 15) console.log(`   … and ${wrong.length - 15} more`)

if (!APPLY) { console.log('\nDry run — nothing written. Re-run with --apply.'); process.exit(0) }

let fixed = 0, failed = 0
for (const it of wrong) {
  const topics = (it.data.topics || []).filter((x) => x !== 'climate')
  const { error: e } = await sb().from('content_items')
    .update({ data: { ...it.data, topics } }).eq('id', it.id)
  if (e) { console.error(`  ✗ ${it.id}: ${e.message}`); failed++ } else fixed++
}
console.log(`\nRemoved the climate tag from ${fixed} item(s)${failed ? `, ${failed} failed` : ''}.`)
process.exit(failed ? 1 : 0)
