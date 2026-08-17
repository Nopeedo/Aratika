/**
 * report-interview-balance.mjs — who is actually getting airtime in the
 * independent interview tier.
 *
 * The tier admits channels on an objective test (do they publish original
 * on-the-record interviews with named leaders and candidates) rather than on
 * their leaning, because deciding which outlets are legitimate is not this
 * site's job. That is the right rule, but on its own it is not a guarantee: a
 * set of channels each individually fine can still add up to a tier that mostly
 * platforms one side, and nobody would notice.
 *
 * So the tier is measured. This prints interviews per party and per outlet, over
 * a window, split by review status. It makes no judgement and changes no data —
 * it exists so a skew is something you can see and answer for.
 *
 * A lopsided result is not automatically a problem: if one leader gives six
 * interviews and another gives none, that is a fact about the campaign, not
 * about us. What it should trigger is a check that no eligible outlet is
 * missing, not the removal of coverage that exists.
 *
 * Run: node scripts/report-interview-balance.mjs [--days 90]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const dIdx = process.argv.indexOf('--days')
const DAYS = dIdx >= 0 ? Number(process.argv[dIdx + 1]) || 90 : 90
const since = new Date(Date.now() - DAYS * 86400 * 1000).toISOString()

const { data, error } = await sb()
  .from('content_items')
  .select('title, status, data, fetched_at')
  .eq('type', 'video')
  .gte('fetched_at', since)
if (error) { console.error(error.message); process.exit(1) }

const items = (data || []).filter((it) => it.data?.independent)
console.log(`Independent-tier videos in the last ${DAYS} days: ${items.length}\n`)
if (items.length === 0) {
  console.log('Nothing yet — the tier was added recently, or the ingest has not run since.')
  process.exit(0)
}

function tally(rows, key) {
  const m = new Map()
  for (const r of rows) for (const k of key(r)) m.set(k, (m.get(k) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

const approved = items.filter((i) => i.status === 'approved')
const pending = items.filter((i) => i.status === 'pending')
console.log(`  approved ${approved.length}   pending review ${pending.length}   rejected ${items.length - approved.length - pending.length}\n`)

console.log('By party (approved only — what the public actually sees):')
const byParty = tally(approved, (r) => r.data?.parties || [])
if (byParty.length === 0) console.log('  (none approved yet)')
const max = Math.max(1, ...byParty.map(([, n]) => n))
for (const [p, n] of byParty) console.log(`  ${p.padEnd(16)} ${String(n).padStart(3)}  ${'█'.repeat(Math.round((n / max) * 32))}`)

const unseen = approved.filter((r) => (r.data?.parties || []).length === 0).length
if (unseen) console.log(`  ${'(no party tagged)'.padEnd(16)} ${String(unseen).padStart(3)}`)

console.log('\nBy outlet (all statuses — which channels are actually producing):')
for (const [s, n] of tally(items, (r) => [r.data?.source || '?'])) console.log(`  ${String(n).padStart(3)}  ${s}`)

console.log('\nOutlets contributing nothing in this window:')
const seen = new Set(items.map((i) => i.data?.source))
const KNOWN = ['The Hui', 'Te Ao Māori News', 'The Platform', 'The Spinoff', 'Newsroom']
const silent = KNOWN.filter((k) => !seen.has(k))
console.log(silent.length ? silent.map((s) => `  ${s}`).join('\n') : '  (none — all are contributing)')
console.log('\nAn outlet silent for a long stretch is worth checking: it may have')
console.log('changed format, or the naming test may simply not be matching it.')
process.exit(0)
