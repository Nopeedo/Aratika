/**
 * retag-pending-videos.mjs — re-tag video rows that are still awaiting review,
 * using the current tagging rules.
 *
 * Fixing the ingest only fixes what arrives next. The rows already sitting in
 * /editor were tagged by reading the whole YouTube description, promo
 * boilerplate included, which produced tags that are simply wrong: The
 * Platform's on-air roster line ("Michael Laws: 10am - 1pm") tagged every one of
 * its uploads as a candidate for Waitaki, and a sponsor's "crafted the old
 * school way" tagged them education. Reviewing a queue whose labels lie is worse
 * than reviewing an unlabelled one.
 *
 * Only status='pending' rows are touched — nothing already published moves.
 * Tags derived from the CHANNEL rather than the text (a party's own channel, the
 * interview tier) are preserved as-is; only text-derived tags are recomputed.
 *
 * Run: node scripts/retag-pending-videos.mjs            (report only)
 *      node scripts/retag-pending-videos.mjs --apply    (write the changes)
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PARTY_TERMS, tagMPs } from './political-terms.mjs'
import { buildElectorateTerms, addCandidateTerms } from './electorate-terms.mjs'
import { buildCandidateTerms, tagCandidates } from './candidate-terms.mjs'
import { buildBillTerms, tagBills } from './bill-terms.mjs'
import { getSnippets, hasApiKey, synopsis } from './lib/youtube.mjs'
import {
  anyTerm, tag, TOPIC_TERMS, ELECTION_TERMS, DEBATE_TERMS, isPresser, isInterview,
} from './lib/video-tagging.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const APPLY = process.argv.includes('--apply')
if (!hasApiKey()) {
  console.error('YOUTUBE_API_KEY is not set. Descriptions can only be re-read through the Data API.')
  process.exit(1)
}
console.log(APPLY ? 'APPLY — changed rows will be written.\n' : 'REPORT ONLY — nothing will be written. Re-run with --apply.\n')

const ELECTORATE_TERMS = buildElectorateTerms()
await addCandidateTerms(ELECTORATE_TERMS, sb)
const tagElectorates = (t) => Object.keys(ELECTORATE_TERMS).filter((n) => anyTerm(ELECTORATE_TERMS[n], t))
const { terms: CANDIDATE_TERMS } = await buildCandidateTerms(sb)
const BILL_TERMS = buildBillTerms()

// Every pending video (paginated — PostgREST caps a page at 1000).
const rows = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('content_items')
    .select('id, title, data').eq('status', 'pending').eq('type', 'video').order('id').range(from, from + 999)
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...(data || []))
  if (!data || data.length < 1000) break
}
console.log(`Pending videos: ${rows.length}`)

const ids = rows.map((r) => r.data?.videoId).filter(Boolean)
const snippets = await getSnippets(ids)
console.log(`Descriptions re-read: ${snippets.size} of ${ids.length}\n`)

const same = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
let changed = 0, missing = 0, tagsRemoved = 0, tagsAdded = 0, nowUntagged = 0
const TAG_FIELDS = ['parties', 'topics', 'mps', 'electorates', 'candidates', 'bills']

for (const row of rows) {
  const snip = snippets.get(row.data?.videoId)
  if (!snip) { missing++; continue }

  const t = (snip.title + ' ' + synopsis(snip.description)).toLowerCase()
  // data.party is the channel's own party (null for broadcasters/interview tier).
  // Where it is set the party tag is a fact about the channel, not a reading of
  // the text, so it must survive: Labour's "National hate to see this" would
  // otherwise be re-tagged to National.
  const parties = row.data?.party ? [row.data.party] : tag(PARTY_TERMS, t)
  const next = {
    parties,
    topics: tag(TOPIC_TERMS, t),
    mps: tagMPs(t),
    electorates: tagElectorates(t),
    candidates: tagCandidates(t, CANDIDATE_TERMS),
    bills: tagBills(t, BILL_TERMS),
    electionRelevant: parties.length > 0 || anyTerm(ELECTION_TERMS, t),
    debate: anyTerm(DEBATE_TERMS, t),
    presser: isPresser(t),
    interview: isInterview(t),
  }

  const diffs = []
  for (const f of TAG_FIELDS) {
    const before = row.data?.[f] ?? []
    if (same(before, next[f])) continue
    const gone = before.filter((x) => !next[f].includes(x))
    const added = next[f].filter((x) => !before.includes(x))
    tagsRemoved += gone.length
    tagsAdded += added.length
    if (gone.length) diffs.push(`−${f}:${gone.join(',')}`)
    if (added.length) diffs.push(`+${f}:${added.join(',')}`)
  }
  for (const f of ['electionRelevant', 'debate', 'presser', 'interview']) {
    if ((row.data?.[f] === true) !== (next[f] === true)) diffs.push(`${next[f] ? '+' : '−'}${f}`)
  }
  if (!diffs.length) continue

  changed++
  if (!TAG_FIELDS.some((f) => next[f].length)) nowUntagged++
  console.log(`  ${String(row.title).slice(0, 62)}`)
  console.log(`      ${diffs.join('  ')}`)

  if (APPLY) {
    const { error } = await sb.from('content_items')
      .update({ data: { ...row.data, ...next } }).eq('id', row.id)
    if (error) console.error(`      ! write failed: ${error.message}`)
  }
}

console.log(`\nChanged        : ${changed} of ${rows.length}`)
console.log(`Tags removed   : ${tagsRemoved}`)
console.log(`Tags added     : ${tagsAdded}`)
console.log(`Now untagged   : ${nowUntagged}  (these are the low-signal ones to skim first)`)
if (missing) console.log(`Skipped        : ${missing} (video no longer served by YouTube — row left untouched)`)
if (!APPLY) console.log('\nNothing was written. Re-run with --apply to keep these changes.')
process.exit(0)
