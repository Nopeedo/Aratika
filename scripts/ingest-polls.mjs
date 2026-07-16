/**
 * ingest-polls.mjs — pull the latest NZ party-vote polls from the published
 * Wikipedia aggregate and STAGE them to the editor queue (content_items,
 * type='poll', status='pending') for a one-click approve.
 *
 * Why staged, not auto-published: polls are the most sensitive numbers on the
 * site, and a table on Wikipedia is hand-edited HTML — if its structure ever
 * shifts, we must never silently publish a mis-parsed figure. So this only ever
 * proposes; a human approves at /editor/polls. It also refuses to stage anything
 * unless the column mapping is confidently recognised (NAT+LAB present), so a
 * broken parse stages nothing rather than garbage.
 *
 * Source: the same Wikipedia aggregate the site already cites (POLLS_SOURCE),
 * which links each poll to the pollster's own release. We only ever store the
 * published party-vote %, fieldwork dates, pollster, and that source link.
 *
 * Dedup: source_id = 'poll:<pollster>|<iso-date>'. Re-running is safe.
 * Recency: only the last ~45 days are staged, so the queue stays small and the
 * poll-of-polls reflects the current cycle (see getPolls() in src/lib/polls).
 *
 * Run: node scripts/ingest-polls.mjs           (stage pending)
 *      node scripts/ingest-polls.mjs --dry      (print what it parsed, write nothing)
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'node-html-parser'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const DRY = process.argv.includes('--dry')
const SOURCE = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const RECENCY_DAYS = 45

// Header abbreviation → our party slug. Only these columns are read; anything
// else (Sample size, Others, Lead) is ignored.
const ABBR = { nat: 'national', lab: 'labour', grn: 'green', act: 'act', nzf: 'nzfirst', tpm: 'tpm', top: 'top' }
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

// End (last) fieldwork day of a range like "2–9 Jul 2026" / "25 May – 21 Jun 2026" → ISO.
function endISO(raw) {
  const s = raw.replace(/\[[^\]]*\]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
  const year = (s.match(/(20\d{2})/) || [])[1]
  const months = [...s.matchAll(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi)].map((m) => m[1].toLowerCase())
  const endPart = s.split('-').pop().trim()            // text after the last range dash
  const day = (endPart.match(/\b(\d{1,2})\b/) || [])[1]
  const endMon = (endPart.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) || [])[0]
  const mon = (endMon || months[months.length - 1] || '').toLowerCase().slice(0, 3)
  if (!day || !year || !(mon in MON)) return null
  return `${year}-${String(MON[mon] + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const num = (t) => {
  const v = parseFloat((t || '').replace(/\[[^\]]*\]/g, '').replace(/[^\d.]/g, ''))
  return Number.isFinite(v) ? v : null
}

async function main() {
  const res = await fetch(SOURCE, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`fetch ${res.status}`)
  const root = parse(await res.text())

  // Pick the party-vote table: the wikitable whose header row carries the most
  // party abbreviations (NAT/LAB/GRN/...). The preferred-PM / direction tables won't.
  let best = null, bestScore = 0
  for (const t of root.querySelectorAll('table.wikitable')) {
    const head = t.querySelector('tr')
    if (!head) continue
    const cells = head.querySelectorAll('th,td').map((c) => c.text.trim().toLowerCase())
    const score = cells.filter((c) => c in ABBR).length
    if (score > bestScore) { bestScore = score; best = t }
  }
  if (!best || bestScore < 4) throw new Error(`party-vote table not recognised (best score ${bestScore}) — aborting, staged nothing`)

  const rows = best.querySelectorAll('tr')
  const header = rows[0].querySelectorAll('th,td').map((c) => c.text.trim().toLowerCase())
  const colToSlug = new Map()
  header.forEach((h, i) => { if (h in ABBR) colToSlug.set(i, ABBR[h]) })
  const dateIdx = header.findIndex((h) => h.startsWith('date'))
  const pollsterIdx = header.findIndex((h) => h.includes('polling') || h.includes('pollster') || h.includes('organisation'))
  if (dateIdx < 0 || pollsterIdx < 0) throw new Error('date/pollster columns not found — aborting')

  const cutoff = new Date(Date.now() - RECENCY_DAYS * 864e5).toISOString().slice(0, 10)
  const parsed = []
  for (const tr of rows.slice(1)) {
    const cells = tr.querySelectorAll('td,th')
    if (cells.length <= pollsterIdx) continue
    const iso = endISO(cells[dateIdx]?.text || '')
    if (!iso || iso < cutoff) continue
    const pollster = (cells[pollsterIdx]?.text || '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
    if (!pollster) continue
    const parties = {}
    for (const [idx, slug] of colToSlug) { const v = num(cells[idx]?.text); if (v != null) parties[slug] = v }
    if (parties.national == null || parties.labour == null) continue   // confidence guard
    parsed.push({ pollster, fieldwork: (cells[dateIdx]?.text || '').replace(/\s+/g, ' ').trim(), date: iso, parties })
  }

  if (DRY) {
    console.log(`Parsed ${parsed.length} poll(s) within ${RECENCY_DAYS} days (table score ${bestScore}):`)
    parsed.forEach((p) => console.log(`  ${p.date}  ${p.pollster}  ${JSON.stringify(p.parties)}`))
    return
  }
  if (!parsed.length) { console.log('No recent polls found within window — nothing to stage.'); return }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: existing } = await sb.from('content_items').select('source_id').eq('type', 'poll')
  const have = new Set((existing || []).map((r) => r.source_id))

  const rowsToInsert = parsed
    .map((p) => ({
      type: 'poll',
      source_id: `poll:${p.pollster.toLowerCase()}|${p.date}`,
      title: `${p.pollster} — ${p.fieldwork}`,
      summary: `Party-vote poll, fieldwork ${p.fieldwork}.`,
      status: 'pending',
      source_url: SOURCE,
      data: { pollster: p.pollster, fieldwork: p.fieldwork, date: p.date, sourceUrl: SOURCE, parties: p.parties },
    }))
    .filter((r) => !have.has(r.source_id))

  if (!rowsToInsert.length) { console.log('All recent polls already staged/approved — nothing new.'); return }
  const { error } = await sb.from('content_items').insert(rowsToInsert)
  if (error) throw new Error(`insert: ${error.message}`)
  console.log(`Staged ${rowsToInsert.length} new poll(s) as pending for editor review:`)
  rowsToInsert.forEach((r) => console.log(`  ${r.title}`))
}

main().catch((e) => { console.error('ingest-polls failed:', e.message); process.exit(1) })
