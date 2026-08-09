/**
 * diagnose-videos.mjs — read-only check of what's actually in the video feed.
 *
 * Answers: how many videos exist per source and per party, and how many are
 * still status='pending' (ingested but never approved in /editor, so invisible
 * on the site). Written because the Election Centre rail showed nothing for TOP
 * or Te Pāti Māori even though both channels are in the ingest list.
 *
 * Run: node scripts/diagnose-videos.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data, error } = await sb
  .from('content_items')
  .select('status, title, data')
  .eq('type', 'video')
  .limit(2000)

if (error) { console.error('query failed:', error.message); process.exit(1) }
const rows = data ?? []
console.log(`total video rows: ${rows.length}\n`)

const byStatus = {}
for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1
console.log('BY STATUS:', JSON.stringify(byStatus))

const bySource = {}
for (const r of rows) {
  const k = r.data?.source || '(none)'
  bySource[k] ||= { total: 0, approved: 0, pending: 0 }
  bySource[k].total++
  if (r.status === 'approved') bySource[k].approved++
  if (r.status === 'pending') bySource[k].pending++
}
console.log('\nBY SOURCE                                  total  approved  pending')
for (const [k, v] of Object.entries(bySource).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${k.slice(0, 40).padEnd(42)}${String(v.total).padStart(5)}${String(v.approved).padStart(10)}${String(v.pending).padStart(9)}`)
}

const byParty = {}
for (const r of rows) {
  const parties = Array.isArray(r.data?.parties) ? r.data.parties : []
  if (!parties.length) {
    byParty['(untagged)'] ||= { total: 0, approved: 0 }
    byParty['(untagged)'].total++
    if (r.status === 'approved') byParty['(untagged)'].approved++
  }
  for (const p of parties) {
    byParty[p] ||= { total: 0, approved: 0 }
    byParty[p].total++
    if (r.status === 'approved') byParty[p].approved++
  }
}
console.log('\nBY PARTY TAG          total  approved')
for (const [k, v] of Object.entries(byParty).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${k.padEnd(20)}${String(v.total).padStart(5)}${String(v.approved).padStart(10)}`)
}

const dates = rows.map((r) => r.published_at).filter(Boolean).sort()
if (dates.length) console.log(`\npublished range: ${dates[0]?.slice(0, 10)} → ${dates[dates.length - 1]?.slice(0, 10)}`)

// ── Why the Election Centre rail looks narrow ────────────────────────────────
const approved = rows.filter((r) => r.status === 'approved')
const debate = approved.filter((r) => r.data?.debate)
console.log(`\napproved: ${approved.length} | of those flagged debate: ${debate.length}`)
const dParties = {}
for (const r of debate) for (const p of (r.data?.parties || [])) dParties[p] = (dParties[p] || 0) + 1
console.log('parties represented among DEBATE-flagged approved videos:', JSON.stringify(dParties))
console.log('\nnewest 12 debate-flagged (what the rail actually shows):')
debate.sort((a, b) => String(b.data?.pubDate || '').localeCompare(String(a.data?.pubDate || '')))
  .slice(0, 12).forEach((r) => console.log(`  ${String(r.data?.pubDate || '').slice(0, 10)}  ${(r.data?.source || '').slice(0, 22).padEnd(24)} ${String(r.title).slice(0, 60)}`))

// What getVideos(18) actually returns — newest approved, which is what the rail
// falls back to when no debate-flagged video exists.
const newest = [...approved].sort((a, b) => String(b.data?.pubDate || '').localeCompare(String(a.data?.pubDate || '')))
console.log('\nNEWEST 18 APPROVED (the actual rail contents):')
newest.slice(0, 18).forEach((r) => console.log(`  ${String(r.data?.pubDate || '').slice(0,10)}  ${(r.data?.source||'').slice(0,20).padEnd(22)} [${(r.data?.parties||[]).join(',') || '-'}]`))
const cut = newest[17]?.data?.pubDate
console.log(`\ncut-off date for the rail: ${String(cut||'').slice(0,10)}`)
const topAll = approved.filter((r) => (r.data?.parties||[]).includes('top'))
console.log(`TOP approved videos: ${topAll.length}, newest ${String(topAll.map(r=>r.data?.pubDate).sort().pop()||'').slice(0,10)}`)
const tpmAll = approved.filter((r) => (r.data?.parties||[]).includes('tpm'))
console.log(`TPM approved videos: ${tpmAll.length}, newest ${String(tpmAll.map(r=>r.data?.pubDate).sort().pop()||'').slice(0,10)}`)
