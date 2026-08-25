/**
 * One-off repair of two candidate-data faults found in the August 2026 audit.
 * Idempotent — safe to re-run; it reports what it changed and nothing else.
 *
 * 1. SIX CANDIDATES INVISIBLE. Wikipedia labels the Conservative Party's
 *    candidates "New Conservative". The ingest maps that label to null on
 *    purpose, to stop it substring-matching 'conservative' — and the read side
 *    drops any candidate without a party slug. So six real, approved,
 *    press-released candidates rendered on no page at all.
 *
 *    They are Conservative Party NZ. Evidence, in order of weight:
 *      - The party's own press release announcing one of them is attributed
 *        "Press Release: Conservative Party" and opens "The New Zealand
 *        Conservative Party is pleased to announce Doug Lyell as its candidate
 *        for the Northland electorate", quoting "Party Leader Helen Houghton" —
 *        who is herself one of the six.
 *      - The Electoral Commission's register lists "Conservative Party NZ",
 *        registered 6 October 2011. It has no entry for "New Conservative".
 *    The guard was right in principle and wrong about this label.
 *
 * 2. ONE CANDIDATE LISTED TWICE. Whangārei carried both "Simon DellaBarba" and
 *    "Simon DellaBarca" — same seat, same party, same citation, one letter
 *    apart. DellaBarca is correct: The Opportunity Party's own site has "Simon
 *    DellaBarca for Whangārei" and an event page naming him. Searching the
 *    other spelling returns exactly one source — this site. It was our typo,
 *    and it was indexed.
 *
 *    He has NOT withdrawn, which is what this was originally logged as. TOP's
 *    "meet the candidates" page does not list him, but that page announces the
 *    FIRST tranche only; absence from a scraped page is not evidence of
 *    withdrawal, per the rule on Candidate2026.withdrawn. The duplicate row is
 *    rejected rather than deleted, so the record of it stays.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = { ...process.env }
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* CI supplies real env vars */ }

const APPLY = process.argv.includes('--apply')
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data, error } = await sb.from('content_items').select('id, source_id, status, data').eq('type', 'candidate')
if (error) { console.error(error.message); process.exitCode = 1 }
else {
  const conservatives = data.filter((r) => r.data?.partyLabel === 'New Conservative' && !r.data?.party)
  const dupe = data.find((r) => r.data?.name === 'Simon DellaBarba' && r.status !== 'rejected')

  console.log(`New Conservative -> conservative: ${conservatives.length} row(s)`)
  for (const r of conservatives) console.log(`  ${r.data.name} — ${r.data.electorateSlug}`)
  console.log(`\nDuplicate to reject: ${dupe ? `${dupe.data.name} — ${dupe.data.electorateSlug} (keeping Simon DellaBarca)` : 'none (already done)'}`)

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.')
  } else {
    for (const r of conservatives) {
      const { error: e } = await sb.from('content_items')
        .update({ data: { ...r.data, party: 'conservative' } }).eq('id', r.id)
      console.log(e ? `  FAILED ${r.data.name}: ${e.message}` : `  set ${r.data.name} -> conservative`)
    }
    if (dupe) {
      const { error: e } = await sb.from('content_items').update({ status: 'rejected' }).eq('id', dupe.id)
      console.log(e ? `  FAILED reject: ${e.message}` : '  rejected the DellaBarba duplicate')
    }
    console.log('\nDone.')
  }
}
