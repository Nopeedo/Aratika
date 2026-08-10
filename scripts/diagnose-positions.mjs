/**
 * diagnose-positions.mjs — read-only coverage map for the party comparison.
 *
 * Prints which party × topic pairs have an approved position, which are pending
 * an editor, and which have nothing at all — so a drafting run can be pointed at
 * the real gaps instead of re-drafting everything.
 *
 * Run: node scripts/diagnose-positions.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const TOPICS = ['economy', 'housing', 'health', 'education', 'climate', 'environment', 'crime-justice', 'treaty-maori-affairs', 'immigration', 'foreign-policy']
const PARTIES = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm', 'top', 'alcp', 'animal-justice', 'conservative', 'nz-outdoors', 'vision-nz', 'womens-rights']

const { data, error } = await sb.from('content_items').select('status, data').eq('type', 'position').limit(3000)
if (error) { console.error('query failed:', error.message); process.exit(1) }

const map = {}   // party -> topic -> status
for (const r of data ?? []) {
  const p = r.data?.party, t = r.data?.topic
  if (!p || !t) continue
  map[p] ||= {}
  // approved beats pending beats anything else
  const rank = { approved: 3, pending: 2 }
  if ((rank[r.status] ?? 1) >= (rank[map[p][t]] ?? 0)) map[p][t] = r.status
}

const mark = (s) => (s === 'approved' ? ' Y ' : s === 'pending' ? ' p ' : s ? ' ? ' : ' . ')
console.log(`position rows: ${(data ?? []).length}     Y = approved (public)   p = pending an editor   . = nothing\n`)
console.log('party'.padEnd(16) + TOPICS.map((t) => t.slice(0, 3)).join(' '))
let approved = 0, pending = 0, missing = 0
for (const p of PARTIES) {
  const row = TOPICS.map((t) => {
    const s = map[p]?.[t]
    if (s === 'approved') approved++
    else if (s === 'pending') pending++
    else missing++
    return mark(s)
  }).join('')
  console.log(p.padEnd(16) + row)
}
console.log(`\napproved ${approved} | pending ${pending} | missing ${missing}  (of ${PARTIES.length * TOPICS.length})`)

console.log('\nGAPS by party (nothing recorded at all):')
for (const p of PARTIES) {
  const gaps = TOPICS.filter((t) => !map[p]?.[t])
  if (gaps.length) console.log(`  ${p.padEnd(16)} ${gaps.length}/10  ${gaps.join(', ')}`)
}
