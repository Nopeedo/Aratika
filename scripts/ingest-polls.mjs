/**
 * ingest-polls.mjs — pull the latest NZ party-vote polls from the published
 * Wikipedia aggregate into content_items (type='poll', status='approved').
 *
 * Approved on entry, matching how manual /editor/polls entry already works (an
 * editor entering a poll IS the approval). The safety valve is the Remove button
 * on /editor/polls — pull any poll that looks wrong. To reduce the chance of ever
 * publishing a bad figure, this refuses to write anything unless the party-vote
 * table is confidently recognised (NAT+LAB present); a shifted Wikipedia layout
 * writes nothing rather than garbage. Only the most recent poll per pollster is
 * kept (matching the poll-of-polls "latest per company" methodology).
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
// Repair existing rows instead of only adding new ones. Needed because the
// insert path skips anything already present, so a column that was being
// dropped (see the TOP/OPP note on ABBR) stays missing forever once ingested.
const BACKFILL = process.argv.includes('--backfill')

/**
 * A pollster name reduced to what actually identifies it.
 *
 * "Taxpayers' Union-Curia" and "Taxpayers' Union–Curia" differ by one character
 * — a hyphen versus an en dash — and Wikipedia uses both. That produced two
 * source_ids for one poll and two identical rows on the site. Folding dashes,
 * apostrophes and spacing makes them the same poll, which they are.
 */
const pollsterKey = (s) =>
  String(s).toLowerCase().replace(/[‐-―]/g, '-').replace(/[‘’]/g, "'").replace(/[^a-z0-9]/g, '')
const SOURCE = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const RECENCY_DAYS = 45

// Header abbreviation → our party slug. Only these columns are read; anything
// else (Sample size, Others, Lead) is ignored.
//
// 'opp' AND 'top' both map to TOP. Wikipedia relabelled that column from TOP to
// OPP in early August 2026, and because an unrecognised header was simply not
// mapped, the value was dropped without a word. The Opportunities Party polled
// 9.5% with Roy Morgan (27 Jul - 23 Aug), 8.0% with 1 News-Verian and 5.3% with
// RNZ-Reid over that window, and every one of those reached the site as no
// figure at all — for a site whose fairness rule is that parties are included
// by registration rather than polling, silently zeroing a party on 9.5% is the
// worst version of this bug. Keep both keys: the page may well change back.
const ABBR = { nat: 'national', lab: 'labour', grn: 'green', act: 'act', nzf: 'nzfirst', tpm: 'tpm', top: 'top', opp: 'top' }

// Header cells that are legitimately not parties. Anything outside this set AND
// outside ABBR gets reported — see the unmapped-column warning below.
const NON_PARTY_COLS = /^(date|polling organisation|pollster|sample size|others?|lead|source|client|method|margin|undecided|n\/?a|)$/
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

  // NEVER DROP A COLUMN SILENTLY.
  //
  // This is the whole lesson of the TOP/OPP miss: the ingest kept working, kept
  // producing polls, and just stopped carrying one party. Nothing was wrong
  // enough to fail, so nothing said anything for a month. Any header that is
  // neither a known party nor a known non-party column is now called out by
  // name, so a relabelled or newly added party is visible the first day it
  // appears rather than whenever someone happens to notice a flat line.
  const unmapped = header
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => !colToSlug.has(i) && !NON_PARTY_COLS.test(h.replace(/\[[^\]]*\]/g, '').trim()))
  if (unmapped.length) {
    console.warn(`  ⚠ UNMAPPED COLUMN(S) in the Wikipedia table: ${unmapped.map((u) => `"${u.h}"`).join(', ')}`)
    console.warn('    If any of those is a party, add it to ABBR — otherwise its numbers are being discarded.')
  }
  const dateIdx = header.findIndex((h) => h.startsWith('date'))
  const pollsterIdx = header.findIndex((h) => h.includes('polling') || h.includes('pollster') || h.includes('organisation'))
  const othersIdx = header.findIndex((h) => h === 'others' || h === 'other')
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
    const others = othersIdx >= 0 ? num(cells[othersIdx]?.text) : null
    parsed.push({ pollster, fieldwork: (cells[dateIdx]?.text || '').replace(/\s+/g, ' ').trim(), date: iso, parties, others })
  }

  // Keep only each pollster's most recent poll (one per company, like the average).
  const latest = new Map()
  for (const p of parsed) {
    const key = p.pollster.toLowerCase()
    const prev = latest.get(key)
    if (!prev || p.date > prev.date) latest.set(key, p)
  }
  const unique = [...latest.values()].sort((a, b) => b.date.localeCompare(a.date))
  parsed.length = 0
  parsed.push(...unique)

  if (DRY) {
    console.log(`Parsed ${parsed.length} poll(s) within ${RECENCY_DAYS} days (table score ${bestScore}):`)
    parsed.forEach((p) => console.log(`  ${p.date}  ${p.pollster}  ${JSON.stringify(p.parties)}`))
    return
  }
  if (!parsed.length) { console.log('No recent polls found within window — nothing to stage.'); return }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: existing } = await sb.from('content_items').select('id, source_id, title, data').eq('type', 'poll')
  // Keyed on the FOLDED pollster name, not the raw source_id, so a dash variant
  // cannot smuggle a second copy of the same poll past the check.
  const have = new Set((existing || []).map((r) => `${pollsterKey(r.data?.pollster || r.source_id)}|${r.data?.date || ''}`))

  if (BACKFILL) {
    let fixed = 0
    for (const p of parsed) {
      // EVERY copy, not the first match. Duplicate rows exist for the same poll
      // (a dash variant in the pollster name produced two source_ids), and the
      // site picks between them with a tie-break that does not resolve when both
      // names carry a typographic dash — so which copy is displayed is row
      // order. Repairing only one leaves a 50/50 chance the visible row is
      // still missing the figure, which is how RNZ–Reid kept showing no TOP
      // after the first backfill run.
      const rows = (existing || []).filter((r) =>
        pollsterKey(r.data?.pollster || '') === pollsterKey(p.pollster) && r.data?.date === p.date)
      if (!rows.length) continue
      for (const row of rows) {
        const cur = row.data?.parties || {}
        const missing = Object.entries(p.parties).filter(([slug, v]) => cur[slug] === undefined && v != null)
        if (!missing.length) continue
        const merged = { ...cur, ...Object.fromEntries(missing) }
        const { error } = await sb.from('content_items')
          .update({ data: { ...row.data, parties: merged } }).eq('id', row.id)
        if (error) { console.error(`  ✗ ${row.title}: ${error.message}`); continue }
        fixed++
        console.log(`  ✓ ${p.date} ${p.pollster}${rows.length > 1 ? ` [copy ${row.id.slice(0, 8)}]` : ''}: added ${missing.map(([k, v]) => `${k}=${v}`).join(', ')}`)
      }
    }
    console.log(fixed
      ? `\nBackfilled ${fixed} poll(s).`
      : '\nNothing to backfill — every parsed figure is already stored.')
    return
  }

  const rowsToInsert = parsed
    .map((p) => ({
      type: 'poll',
      source_id: `poll:${p.pollster.toLowerCase()}|${p.date}`,
      title: `${p.pollster} — ${p.fieldwork}`,
      summary: `Party-vote poll, fieldwork ${p.fieldwork}.`,
      status: 'approved',
      source_url: SOURCE,
      data: { pollster: p.pollster, fieldwork: p.fieldwork, date: p.date, sourceUrl: SOURCE, parties: p.parties, ...(p.others != null ? { others: p.others } : {}) },
    }))
    .filter((r) => !have.has(`${pollsterKey(r.data.pollster)}|${r.data.date}`))

  if (!rowsToInsert.length) { console.log('All recent polls already present — nothing new.'); return }
  const { error } = await sb.from('content_items').insert(rowsToInsert)
  if (error) throw new Error(`insert: ${error.message}`)
  console.log(`Added ${rowsToInsert.length} new poll(s) (approved, live):`)
  rowsToInsert.forEach((r) => console.log(`  ${r.title}`))
}

main().then(() => process.exit(0)).catch((e) => { console.error('ingest-polls failed:', e.message); process.exit(1) })
