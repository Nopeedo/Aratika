/**
 * strip-record-claims.mjs — take a party's ACHIEVEMENTS out of its stated position.
 *
 * The comparison pages answer one question: what would this party do if elected.
 * A governing party's own website is largely a list of what it HAS delivered,
 * and draft-positions.mjs used to carry that through deliberately ("keep their
 * tense"), which is defensible as reporting and wrong for this page — printed
 * under "NATIONAL ON ECONOMY", "Delivered income tax relief" reads as the site
 * selling the party.
 *
 * The prompt no longer produces these. This removes the ones already approved.
 *
 * Only bullets whose FIRST word is a completed act are touched. A pledge that
 * merely mentions the past ("will keep the tax cuts delivered last year") stays,
 * because it is still a forward commitment. Nothing is rewritten: a record claim
 * is dropped, never converted into a promise the party did not make.
 *
 * Dry run by default. --apply writes.
 *
 *   node scripts/strip-record-claims.mjs
 *   node scripts/strip-record-claims.mjs --apply
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const APPLY = process.argv.includes('--apply')

/** Anchored at the start: the bullet IS the achievement, rather than mentioning one. */
const RECORD_OPENER = /^(Delivered|Launched|Introduced|Passed|Cut|Scrapped|Invested|Built|Restored|Reduced|Increased|Fixed|Ended|Achieved|Rolled out|Brought|Removed|Stopped|Banned|Established|Created|Signed)\b/

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await sb
  .from('content_items')
  .select('id, title, data')
  .eq('type', 'position')
  .eq('status', 'approved')
  .limit(1000)
if (error) { console.error(error.message); process.exit(1) }

let touched = 0, dropped = 0
for (const row of data) {
  const kp = row.data?.keyProposals
  if (!Array.isArray(kp) || kp.length === 0) continue
  const kept = kp.filter((p) => !RECORD_OPENER.test(String(p).trim()))
  if (kept.length === kp.length) continue

  touched++; dropped += kp.length - kept.length
  console.log(`\n${row.title}  (${kp.length} → ${kept.length})`)
  for (const p of kp) if (!kept.includes(p)) console.log(`   – ${p}`)

  // A position stripped to nothing would render as a party with no policy at
  // all, which is a worse falsehood than the one being fixed. Left alone and
  // reported, for a person to look at.
  if (kept.length === 0) { console.log('   !! all proposals were record claims — SKIPPED, needs re-drafting'); continue }

  if (APPLY) {
    const { error: e } = await sb
      .from('content_items')
      .update({ data: { ...row.data, keyProposals: kept } })
      .eq('id', row.id)
    if (e) console.error(`   !! write failed: ${e.message}`)
  }
}

console.log(`\n${touched} positions, ${dropped} record claims ${APPLY ? 'removed' : 'would be removed (dry run)'}`)
if (!APPLY) console.log('Re-run with --apply to write.')
