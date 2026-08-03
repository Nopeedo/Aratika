/**
 * backup-content.mjs — belt-and-braces export of the public content tables.
 *
 * Supabase's own daily/PITR backups are the primary safety net; this is a second,
 * independent copy that lives in the repo (and is therefore also on every dev's
 * machine and in GitHub's history). Only PUBLIC content is exported —
 * content_items (news/positions/legislation/video/candidate/poll). NO user tables
 * (bookmarks, learn_progress, editors) — those hold personal data and must never
 * be committed to a public repo.
 *
 * Output: backups/content_items.latest.json.gz (overwritten) + a tiny plaintext
 * manifest so the count/date is legible in a git diff. Restore: see
 * docs/RESTORE-RUNBOOK.md.
 *
 * Run: node scripts/backup-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { gzipSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'backups')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Page through the whole table (Supabase caps a single select at 1000 rows).
const all = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('content_items').select('*').order('id', { ascending: true }).range(from, from + 999)
  if (error) { console.error(error.message); process.exit(1) }
  all.push(...data)
  if (data.length < 1000) break
}

// Drop the bulky, re-derivable cache fields — full bill text is refetchable from
// legislation.govt.nz (enrich-bills.mjs), so it doesn't belong in the offsite
// snapshot. What we protect is the editorial work: approvals/status, human-edited
// summaries, the candidate set, corrected positions, poll entries.
const slim = all.map((r) => {
  const { full_text, ...rest } = r
  const data = { ...(rest.data || {}) }
  delete data.full_text
  delete data.fullText
  return { ...rest, data }
})

const byType = {}
for (const r of slim) byType[r.type] = (byType[r.type] || 0) + 1
const json = JSON.stringify(slim)
const sha = createHash('sha256').update(json).digest('hex').slice(0, 16)

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, "content_items.latest.json.gz"), gzipSync(json, { level: 9 }))
// A legible manifest (this is what a human reads in the git diff).
writeFileSync(join(outDir, 'content_items.manifest.json'), JSON.stringify({
  table: 'content_items',
  rows: all.length,
  byType,
  contentSha256: sha,
  note: 'Public content only. Restore via docs/RESTORE-RUNBOOK.md. Supabase PITR is the primary backup.',
}, null, 2) + '\n')

console.log(`Backed up ${all.length} content_items rows (${JSON.stringify(byType)}), sha ${sha}.`)
process.exit(0)
