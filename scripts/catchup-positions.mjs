/**
 * catchup-positions.mjs — draft, verify, publish. One topic at a time.
 *
 * WHY THIS EXISTS
 *
 * After watch-policy-pages widened every topic from one configured source to
 * several, nearly every position needed re-drafting. Two ways to do that are
 * both bad:
 *
 *   Draft everything, then review. A re-drafted row is status='pending' and the
 *   site renders only 'approved', so forty pending positions means /policies
 *   telling readers that most parties have no position on most things. That is
 *   a false statement, not a gap.
 *
 *   Draft six, wait for review, repeat. Correct, and at six a day the catch-up
 *   outlasts the election.
 *
 * So this does a topic at a time and closes the loop immediately: draft the
 * topic, machine-verify every new quote against the page it cites, publish the
 * rows that pass, leave the rest pending for a human. The site is short one
 * topic's worth of positions for a couple of minutes rather than most of its
 * content for days.
 *
 * WHAT VERIFICATION IS AND IS NOT
 *
 * It checks that every excerpt appears verbatim on the specific page it is
 * attributed to — the failure that would let a reader click through, not find
 * the quote, and conclude we invented it. That is a real check and it is the
 * one that matters most for credibility.
 *
 * It is NOT editorial review. It cannot tell you a summary is unbalanced, that
 * a party's position has been characterised unfairly, or that a proposal is
 * missing. Anything published here should still be read by a person; this only
 * means the site is not lying about sources in the meantime.
 *
 * Run: node scripts/catchup-positions.mjs [--topics=a,b] [--dry-run]
 *      node scripts/catchup-positions.mjs --no-publish   (draft + verify only)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { parse } from 'node-html-parser'
import { execFileSync, execFileSync as run } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(here, '..', '.env.local'), quiet: true })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const NO_PUBLISH = args.includes('--no-publish')
const topicsArg = (args.find((a) => a.startsWith('--topics=')) || '').split('=')[1]

const ALL_TOPICS = ['economy', 'housing', 'health', 'education', 'climate', 'environment',
  'crime-justice', 'treaty-maori-affairs', 'immigration', 'foreign-policy', 'democracy-government']
const TOPICS = topicsArg ? topicsArg.split(',').map((t) => t.trim()).filter(Boolean) : ALL_TOPICS

const bad = TOPICS.filter((t) => !ALL_TOPICS.includes(t))
if (bad.length) { console.error(`Unknown topic(s): ${bad.join(', ')}`); process.exit(1) }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

/** Identical extraction to draft-positions.mjs fetchText — a different strip set
 *  would flag quotes as missing that are genuinely present. */
function fetchText(url) {
  const r = parse(execFileSync('curl', ['-s', '-L', '--max-time', '45', '-A', UA, url], { maxBuffer: 24 * 1024 * 1024 }).toString())
  r.querySelectorAll('script,style,noscript,svg,header,footer,nav,form').forEach((e) => e.remove())
  return r.text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

/** Identical normalisation to draft-positions.mjs normText. Smart quotes are
 *  folded — an earlier verifier that skipped this reported six false failures
 *  and nearly sent me to "fix" working code. */
const N = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const verbatim = (src, s) => {
  const q = N(s).replace(/^["'….\s]+|["'….\s]+$/g, '')
  return q.length >= 12 && N(src).includes(q)
}

const pendingIds = async () => {
  const { data, error } = await sb.from('content_items').select('source_id').eq('type', 'position').eq('status', 'pending')
  if (error) throw new Error(`pending query failed: ${error.message}`)
  return new Set((data || []).map((r) => r.source_id))
}

console.log(`Catch-up over ${TOPICS.length} topic(s)${DRY ? ' — DRY RUN' : ''}${NO_PUBLISH ? ' — no publish' : ''}\n`)

const pageCache = {}
const summary = { drafted: 0, published: 0, held: 0, topics: [] }

for (const topic of TOPICS) {
  console.log(`\n${'='.repeat(60)}\n${topic}\n${'='.repeat(60)}`)

  // Anything already pending before this topic runs is someone else's business —
  // a row a human is mid-review on must not be swept up and published by this.
  const before = await pendingIds()

  if (!DRY) {
    try {
      run('node', [join(here, 'draft-positions.mjs'), `--topic=${topic}`, '--if-changed'], { stdio: 'inherit' })
    } catch {
      // One topic failing must not end the catch-up; the rest are independent.
      console.warn(`  ⚠ ${topic}: drafter exited non-zero — continuing to the next topic`)
    }
  }

  const after = await pendingIds()
  const fresh = [...after].filter((id) => !before.has(id))
  summary.drafted += fresh.length
  if (!fresh.length) { console.log(`\n  nothing new on ${topic}`); continue }

  console.log(`\n  verifying ${fresh.length} new row(s)…`)
  const { data: rows } = await sb.from('content_items').select('id, source_id, data').eq('type', 'position').in('source_id', fresh)

  const clean = []
  for (const r of rows || []) {
    const ex = r.data?.excerpts || []
    const src = r.data?.excerptSources || []
    let fails = 0
    for (let i = 0; i < ex.length; i++) {
      const u = src[i]
      if (!u) { fails++; continue }
      if (!(u in pageCache)) { try { pageCache[u] = fetchText(u) } catch { pageCache[u] = '' } }
      if (!verbatim(pageCache[u], ex[i])) {
        fails++
        console.log(`    ✗ ${r.source_id}: not on cited page — ${JSON.stringify(String(ex[i]).slice(0, 60))}`)
        console.log(`        ${u}`)
      }
    }
    // A position with no quotes at all is not a verification failure, but it is
    // worth seeing: it usually means the source page is thin or the model found
    // nothing quotable, and the summary is doing all the work unsupported.
    if (!ex.length) console.log(`    ⚠ ${r.source_id}: no excerpts at all`)
    if (fails) { summary.held++; console.log(`    HELD ${r.source_id} (${fails} unverified)`) }
    else clean.push(r)
  }

  if (NO_PUBLISH || DRY) { console.log(`  ${clean.length} would publish, ${summary.held} held`); continue }

  let ok = 0
  for (const r of clean) {
    const { error } = await sb.from('content_items').update({ status: 'approved' }).eq('id', r.id)
    if (error) console.error(`    ✗ publish failed ${r.source_id}: ${error.message}`)
    else { ok++; console.log(`    ✓ published ${r.source_id}`) }
  }
  summary.published += ok
  summary.topics.push(`${topic}: +${ok}`)
}

// Read the queue back rather than trusting the counters — reporting success from
// the absence of an error is the failure mode this whole series has been about.
const left = await pendingIds()
console.log(`\n${'='.repeat(60)}`)
console.log(`drafted ${summary.drafted} · published ${summary.published} · held for review ${summary.held}`)
if (summary.topics.length) console.log(summary.topics.join(' · '))
console.log(`positions still pending site-wide: ${left.size}`)
if (left.size) console.log(`  ${[...left].join(', ')}`)
process.exit(0)
