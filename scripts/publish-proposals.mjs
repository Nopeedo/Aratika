/**
 * publish-proposals.mjs — publish position drafts WITHOUT the editor: promote
 * proposed updates on live rows, and approve new pending positions.
 *
 * This is the "bulk approve" the editor asked for on 16 Sep 2026 and the
 * session-only auto-approval of 21 Sep. It is not part of any workflow and
 * never runs on a schedule: the daily pipeline stages drafts, and a human — or
 * this script, run by a human with --confirm — publishes them.
 *
 * Every excerpt and quote is re-verified VERBATIM against a fresh fetch of the
 * page it is attributed to before publishing. A quote that is not on a page we
 * COULD read is dropped, not published. A row whose cited page we could NOT
 * read is HELD — not published with its quotes stripped, which is what the
 * first version of this did: an unreadable JS-rendered page would have removed
 * every quote and published the summary bare, reporting success. The verifier
 * is the same normText/isVerbatim the drafter used.
 *
 * Withdrawal proposals (the drafter found no position where one was live) are
 * skipped unless --include-withdrawals: taking a position DOWN on the model's
 * say-so is the editor's call.
 *
 * Run:
 *   node scripts/publish-proposals.mjs                 list what would publish, verify quotes, write nothing
 *   node scripts/publish-proposals.mjs --confirm       publish proposals AND pending positions
 *   node scripts/publish-proposals.mjs --confirm --proposals-only
 *   node scripts/publish-proposals.mjs --confirm --pending-only
 *   node scripts/publish-proposals.mjs --confirm --ids=<uuid>,<uuid>
 *   node scripts/publish-proposals.mjs --confirm --include-withdrawals
 *
 * Exit 0 = every candidate published or deliberately held/skipped and reported.
 * Exit 1 = a write failed, an --ids entry was not publishable, or the flags
 * contradict each other.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fetchSource, isVerbatim, HttpError } from './lib/position-text.mjs'
import { getProposal, promoteProposal } from '../src/lib/positions/proposal.ts'

dotenv.config({ path: '.env.local', quiet: true })

const args = process.argv.slice(2)
const CONFIRM = args.includes('--confirm')
const PROPOSALS_ONLY = args.includes('--proposals-only')
const PENDING_ONLY = args.includes('--pending-only')
const INCLUDE_WITHDRAWALS = args.includes('--include-withdrawals')
const IDS = (args.find((a) => a.startsWith('--ids=')) || '').split('=')[1]?.split(',').map((s) => s.trim()).filter(Boolean) || null
const NOTE = `Published by scripts/publish-proposals.mjs on ${new Date().toISOString().slice(0, 10)} (editor-authorised bulk publish)`

if (PROPOSALS_ONLY && PENDING_ONLY) { console.error('--proposals-only and --pending-only exclude each other.'); process.exit(1) }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ── Which rows ────────────────────────────────────────────────────────────────
const SELECT = 'id, source_id, status, title, summary, source_url, data'
let proposals = []
let pending = []
if (!PENDING_ONLY) {
  let q = sb.from('content_items').select(SELECT).eq('type', 'position').eq('status', 'approved').not('data->proposed', 'is', null).limit(1000)
  if (IDS) q = q.in('id', IDS)
  const { data, error } = await q
  if (error) { console.error(`proposal query failed: ${error.message}`); process.exit(1) }
  proposals = (data || []).filter((r) => getProposal(r.data))
}
if (!PROPOSALS_ONLY) {
  let q = sb.from('content_items').select(SELECT).eq('type', 'position').eq('status', 'pending').limit(1000)
  if (IDS) q = q.in('id', IDS)
  const { data, error } = await q
  if (error) { console.error(`pending query failed: ${error.message}`); process.exit(1) }
  pending = data || []
}
if (IDS) {
  // An id that names nothing publishable is a mistake, not a no-op.
  const found = new Set([...proposals, ...pending].map((r) => r.id))
  const missing = IDS.filter((id) => !found.has(id))
  if (missing.length) { console.error(`${missing.length} id(s) are not a proposal or a pending position: ${missing.join(', ')}`); process.exit(1) }
}
const withdrawals = proposals.filter((r) => getProposal(r.data)?.noPosition)
if (!INCLUDE_WITHDRAWALS && withdrawals.length) {
  console.log(`${withdrawals.length} withdrawal proposal(s) skipped (would replace a live position with "no stated position"; pass --include-withdrawals to publish them):`)
  for (const r of withdrawals) console.log(`    · ${r.source_id}`)
  proposals = proposals.filter((r) => !getProposal(r.data)?.noPosition)
}
console.log(`${proposals.length} proposed update(s) on live positions, ${pending.length} new pending position(s)${CONFIRM ? '' : '  (dry run — add --confirm to publish)'}\n`)
if (!proposals.length && !pending.length) process.exit(0)

// ── Verify quotes against a fresh fetch of the page each one is attributed to ─
const pageCache = new Map()
/** Page text, or null if it could not be read (with the reason logged once). */
async function pageText(url) {
  if (!pageCache.has(url)) {
    try { pageCache.set(url, await fetchSource(url)) } catch (e) {
      const why = e instanceof HttpError ? `HTTP ${e.status}` : String(e?.message || e).split('\n')[0]
      console.warn(`    ✗ could not fetch ${url}: ${why}`)
      pageCache.set(url, null)
    }
  }
  return pageCache.get(url)
}
/**
 * The content with unverifiable quotes removed, and whether the row can be
 * published at all. Excerpts are checked against their OWN attributed page;
 * the headline quote against any page in the set.
 *   hold  — a page an excerpt cites could not be read, or every excerpt failed:
 *           we cannot say the quotes are real, so nothing is published.
 *   drop  — a quote is not on a page we did read: that quote goes, the row stays.
 */
async function verifyQuotes(fields, label) {
  const excerpts = Array.isArray(fields.excerpts) ? fields.excerpts : []
  const sources = Array.isArray(fields.excerptSources) ? fields.excerptSources : []
  const urls = [...new Set([fields.source_url, ...(fields.sourceUrls || []), ...sources].filter(Boolean))]
  const keptE = [], keptS = [], dropped = [], unreachable = []
  for (let i = 0; i < excerpts.length; i++) {
    const at = sources[i] || fields.source_url
    const t = at ? await pageText(at) : null
    if (t === null || t === undefined) { unreachable.push(at || '(no page)'); continue }
    if (isVerbatim(t, excerpts[i])) { keptE.push(excerpts[i]); keptS.push(at) }
    else dropped.push(`excerpt ${i + 1}: "${String(excerpts[i]).slice(0, 60)}…"`)
  }
  let quote = typeof fields.quote === 'string' ? fields.quote : ''
  if (quote) {
    let ok = false, anyRead = false
    for (const u of urls) { const t = await pageText(u); if (t) { anyRead = true; if (isVerbatim(t, quote)) { ok = true; break } } }
    if (!anyRead) unreachable.push('(quote: no page readable)')
    else if (!ok) { dropped.push(`quote: "${quote.slice(0, 60)}…"`); quote = '' }
  }
  for (const d of dropped) console.log(`    ⚠ ${label}: dropped ${d}`)
  let hold = null
  if (unreachable.length) hold = `cited page unreachable (${[...new Set(unreachable)].join(', ')})`
  else if (excerpts.length && !keptE.length) hold = 'every excerpt failed verification'
  return { excerpts: keptE, excerptSources: keptS, quote, dropped: dropped.length, checked: excerpts.length + (fields.quote ? 1 : 0), hold }
}

let failed = 0, published = 0, held = 0, quotesDropped = 0, quotesChecked = 0

// ── Proposed updates → promote ────────────────────────────────────────────────
for (const row of proposals) {
  const p = getProposal(row.data)
  const label = row.source_id
  console.log(`▸ ${label}  (proposal: ${p.what || 'update'})`)
  const v = await verifyQuotes(p, label)
  quotesDropped += v.dropped; quotesChecked += v.checked
  if (v.hold) { held++; console.log(`  ⏸ ${label}: HELD — ${v.hold}`); continue }
  if (!CONFIRM) continue
  // Re-read right before writing. Verification can take minutes across a
  // batch; the proposal we listed may have been accepted or rejected in
  // /editor since, and a write from the stale copy would override that.
  const { data: fresh, error: readErr } = await sb.from('content_items').select(SELECT).eq('id', row.id).eq('status', 'approved').maybeSingle()
  const fp = fresh ? getProposal(fresh.data) : null
  if (readErr || !fp || fp.proposedAt !== p.proposedAt) { console.log(`  ⏭ ${label}: proposal changed or was reviewed since it was listed — skipped`); continue }
  // Promote the VERIFIED proposal: same function the editor's Approve button uses.
  const verified = { ...fresh, data: { ...fresh.data, proposed: { ...fp, excerpts: v.excerpts, excerptSources: v.excerptSources, quote: v.quote } } }
  const now = new Date().toISOString()
  const update = { ...promoteProposal(verified), change_kind: 'updated', reviewed_at: now, updated_at: now, editor_notes: NOTE }
  const { data: hit, error } = await sb.from('content_items').update(update).eq('id', row.id).eq('status', 'approved').select('id')
  if (error || !hit?.length) { failed++; console.error(`  ✗ ${label}: ${error?.message || 'no row matched'}`); continue }
  published++
  console.log(`  ✓ ${label}: live position updated (${v.excerpts.length} excerpt(s), quote ${v.quote ? 'kept' : 'none'})`)
}

// ── New pending positions → approve ───────────────────────────────────────────
for (const row of pending) {
  const label = row.source_id
  const d = row.data || {}
  console.log(`▸ ${label}  (new: "${d.stance || row.summary?.slice(0, 60)}")`)
  const v = await verifyQuotes({ ...d, source_url: row.source_url }, label)
  quotesDropped += v.dropped; quotesChecked += v.checked
  if (v.hold) { held++; console.log(`  ⏸ ${label}: HELD — ${v.hold}`); continue }
  if (!CONFIRM) continue
  const { data: fresh, error: readErr } = await sb.from('content_items').select('data').eq('id', row.id).eq('status', 'pending').maybeSingle()
  if (readErr || !fresh) { console.log(`  ⏭ ${label}: no longer pending — skipped`); continue }
  const now = new Date().toISOString()
  const { data: hit, error } = await sb.from('content_items').update({
    status: 'approved', reviewed_at: now, updated_at: now, editor_notes: NOTE,
    data: { ...fresh.data, excerpts: v.excerpts, excerptSources: v.excerptSources, quote: v.quote },
  }).eq('id', row.id).eq('status', 'pending').select('id')
  if (error || !hit?.length) { failed++; console.error(`  ✗ ${label}: ${error?.message || 'no row matched'}`); continue }
  published++
  console.log(`  ✓ ${label}: approved (${v.excerpts.length} excerpt(s), quote ${v.quote ? 'kept' : 'none'})`)
}

console.log(`\n── ${CONFIRM ? 'published' : 'dry run'} ──`)
console.log(`   quotes checked: ${quotesChecked}, dropped as not on the cited page: ${quotesDropped}`)
console.log(`   held (cited page unreadable / nothing verifiable): ${held}`)
console.log(`   ${CONFIRM ? `published: ${published}, failed: ${failed}` : `would publish: ${proposals.length + pending.length - held}`}`)
process.exitCode = failed ? 1 : 0
