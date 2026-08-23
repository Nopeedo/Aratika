/**
 * mark-withdrawn.mjs — record that a candidate has pulled out of a race.
 *
 * Withdrawal is the one candidate change nothing detects. Names arrive through
 * the weekly ingest and, once approved, sit on a seat page indefinitely: a
 * candidate could withdraw in September and still be listed as standing on
 * election day.
 *
 * A candidate DISAPPEARING from the scraped source is not evidence of anything.
 * The page restructures, names get respelled, and a broken parse would read as
 * a mass withdrawal — so nothing here is automatic. ingest-candidates.mjs
 * reports likely withdrawals for a human to check; this script is the human
 * acting on that, and it will not run without a citation.
 *
 * The row is UPDATED, never deleted, and status stays 'approved'. Rejecting it
 * would be the easy way to make it disappear, but 'rejected' means "should not
 * have been added" — a different claim, and it would leave the page unable to
 * say the person withdrew. See the note on Candidate2026.withdrawn.
 *
 * Anyone tracking that seat is told immediately. Someone lost a candidate they
 * were following; that is at least as material as one arriving.
 *
 * Run:
 *   node scripts/mark-withdrawn.mjs --seat te-atatu --name "Jane Doe" \
 *     --source https://www.rnz.co.nz/... [--date 2026-09-14] [--dry-run]
 *
 *   node scripts/mark-withdrawn.mjs --seat te-atatu --name "Jane Doe" --undo
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey, DRY } from './lib/notify.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const arg = (flag) => {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}
const seat = arg('--seat')
const name = arg('--name')
const source = arg('--source')
const undo = process.argv.includes('--undo')
// NZ date, because the deadline and the news are both NZ.
const date = arg('--date') || new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

if (!seat || !name) {
  console.error('usage: --seat <electorate-slug> --name "Full Name" --source <url> [--date YYYY-MM-DD] [--undo] [--dry-run]')
  process.exit(1)
}
// The citation is the whole basis of the claim. Without it this is a rumour
// being published on a page that promises everything is sourced.
if (!undo && !/^https?:\/\//.test(source || '')) {
  console.error('Refusing to record a withdrawal with no source. Pass --source <url> to the report of it.')
  process.exit(1)
}
if (!undo && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD (got "${date}")`)
  process.exit(1)
}

const { data: rows, error } = await sb()
  .from('content_items').select('id, source_id, status, data').eq('type', 'candidate')
if (error) { console.error(error.message); process.exit(1) }

const norm = (v) => String(v || '').toLowerCase().trim()
const matches = (rows || []).filter((r) => norm(r.data?.electorateSlug) === norm(seat) && norm(r.data?.name) === norm(name))

if (matches.length === 0) {
  // Name the near-misses. A typo or a middle name is the likeliest reason, and
  // failing with "not found" and nothing else sends the operator hunting.
  const inSeat = (rows || []).filter((r) => norm(r.data?.electorateSlug) === norm(seat))
  console.error(`No candidate "${name}" in ${seat}.`)
  if (inSeat.length) console.error('  Candidates recorded in that seat:\n' + inSeat.map((r) => `    ${r.data?.name} (${r.status})`).join('\n'))
  else console.error('  No candidates recorded in that seat at all — check the slug.')
  process.exit(1)
}
if (matches.length > 1) {
  console.error(`Ambiguous: ${matches.length} rows match. Refusing to guess.`)
  process.exit(1)
}

const row = matches[0]
const already = row.data?.withdrawn
if (undo) {
  if (!already) { console.log(`${name} is not marked withdrawn — nothing to undo.`); process.exit(0) }
  console.log(`Clearing withdrawal on ${name} (${seat}), recorded ${already.date}.`)
  if (DRY) { console.log('(dry run — nothing written)'); process.exit(0) }
  const next = { ...row.data }
  delete next.withdrawn
  const { error: e } = await sb().from('content_items').update({ data: next }).eq('id', row.id)
  console.log(e ? `failed: ${e.message}` : 'cleared.')
  process.exit(e ? 1 : 0)
}
if (already) {
  console.log(`${name} is already marked withdrawn (${already.date}, ${already.source}). Nothing to do.`)
  process.exit(0)
}

console.log(`${name} — ${seat} — withdrawing as at ${date}`)
console.log(`  source: ${source}`)
console.log(`  status stays '${row.status}'; the row is kept and shown as withdrawn.`)

if (DRY) { console.log('\n(dry run — nothing written, nobody notified)') } else {
  const { error: e } = await sb()
    .from('content_items')
    .update({ data: { ...row.data, withdrawn: { date, source } } })
    .eq('id', row.id)
  if (e) { console.error(`failed: ${e.message}`); process.exit(1) }
  console.log('  recorded.')
}

// Tell the people following that seat, however they follow it: an electorate
// bookmark and a battleground bookmark are the same seat to a reader.
const { data: bms } = await sb()
  .from('bookmarks').select('user_id, kind, ref_id, href').in('kind', ['electorate', 'battleground'])
const seatKey = norm(seat).replace(/-/g, '')
const followers = (bms || []).filter((b) => norm(b.ref_id).replace(/[^a-z0-9]/g, '') === seatKey)
console.log(`  followers of this seat: ${followers.length}`)

const seen = new Set()
for (const b of followers) {
  if (seen.has(b.user_id)) continue
  seen.add(b.user_id)
  await enqueue({
    userId: b.user_id,
    // Same urgency as a new challenger. The field changing under you is the
    // event, in whichever direction it moves.
    urgency: 'immediate',
    category: 'candidate',
    dedup: dedupKey('withdrawn', seat, norm(name), date, b.user_id),
    entity: { kind: b.kind, ref: b.ref_id },
    title: `${name} has withdrawn`,
    body: `${name} is no longer standing in ${row.data?.electorateName || seat}.`,
    url: b.href || `/battlegrounds/${seat}`,
  })
}
console.log('Done.')
process.exit(0)
