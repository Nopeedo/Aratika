/**
 * enrich-mp-expenses.mjs — MPs' taxpayer-funded expenses from the OFFICIAL
 * quarterly disclosure (Parliamentary Service / Office of the Clerk, via the
 * data.govt.nz "Member of Parliament Expenses" dataset, XLSX).
 *
 * Per-MP travel + accommodation totals for one quarter. Official source,
 * attributed + dated. Nothing invented; unmatched rows are skipped.
 *
 * Run:  node scripts/enrich-mp-expenses.mjs
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-expenses.ts')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

/**
 * Q1 2026, fetched from parliament.nz itself rather than the data.govt.nz
 * mirror the previous quarter used — in August 2026 the mirror's newest file
 * was still Oct–Dec 2025, a quarter behind what Parliament had published.
 *
 * parliament.nz PAGES sit behind a Radware WAF that blocks non-browser
 * fetches, but /media/ file paths are exempt, so the XLSX downloads cleanly.
 * The media id was found by scanning ids near the 2026 pecuniary register
 * (12156) for the disclosure's filename pattern; the id is not linkable from
 * any page we can read. For the NEXT quarter: scan forward from ~12160 for
 * disclosure-of-members-expenses-from-1-april-to-30-june-2026.xlsx (not yet
 * published as of 26 Aug 2026), and update PERIOD to match.
 */
const XLSX_URL = 'https://www3.parliament.nz/media/12157/disclosure-of-members-expenses-from-1-january-to-31-march-2026.xlsx'
const PERIOD = '1 January – 31 March 2026'
const SOURCE_URL = 'https://www.parliament.nz/en/mps-and-electorates/mps-expenses/'
const SOURCE_LABEL = "Members' expense disclosure (parliament.nz)"

const PARTYMAP = {
  Independent: 'independent', National: 'national', Labour: 'labour', Green: 'green', ACT: 'act',
  'New Zealand First': 'nzfirst', 'NZ First': 'nzfirst', 'Te Pāti Māori': 'tpm', 'Te Pati Maori': 'tpm',
}

// surname+party -> slug, from our MP data.
const src = readFileSync(GEN, 'utf8')
const bySurnameParty = new Map()
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`´′ʻ]/g, '').trim()
const slugRe = /slug:\s*'([^']+)'/g
let sm
/**
 * Full-name index beside the surname one. The sheet writes "van Velden,
 * Brooke" and "Menéndez March, Ricardo" — multi-word surnames the last-token
 * key can never hold — and the name regex handles the \' escape that made
 * "O\'Connor" index as the surname "o\". Full name is the most specific key
 * the sheet can offer, so it is tried first.
 */
const byFullName = new Map()
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 800)
  const nm = win.match(/\bname:\s*'((?:\\.|[^'\\])*)'/)
  const pm = win.match(/\bparty:\s*'([^']+)'/)
  if (!nm || !pm) continue
  const clean = nm[1].replace(/\\'/g, "'")
  byFullName.set(norm(clean), sm[1])
  bySurnameParty.set(`${norm(clean.split(/\s+/).pop())}::${pm[1]}`, sm[1])
}
bySurnameParty.set('luxon::national', 'christopher-luxon')
bySurnameParty.set('collins::national', 'judith-collins')

/**
 * Surname-only fallback, for UNIQUE surnames only. An MP who changed party
 * mid-quarter appears in the sheet under a party the roster no longer holds
 * for them — Q1 2026 lists Kapa-Kingi as "Independent (up to 9/3/26)" and
 * "Te Pāti Māori (from 10/3/26)" while the roster says independent, so the
 * second row could never match on surname::party. Surnames shared by two MPs
 * (Davidson, Willis, ...) stay party-qualified: a wrong match on a public
 * spending figure is worse than a miss.
 */
const bySurnameOnly = new Map()
{
  const counts = new Map()
  for (const key of bySurnameParty.keys()) {
    const sn = key.split('::')[0]
    counts.set(sn, (counts.get(sn) ?? 0) + 1)
  }
  for (const [key, slug] of bySurnameParty) {
    const sn = key.split('::')[0]
    if (counts.get(sn) === 1) bySurnameOnly.set(sn, slug)
  }
}

const tmp = join(__dirname, '..', '.tmp-expenses.xlsx')
execFileSync('curl', ['-s', '-L', '--max-time', '60', '-A', UA, XLSX_URL, '-o', tmp], { maxBuffer: 64 * 1024 * 1024 })
const wb = XLSX.read(readFileSync(tmp))
try { unlinkSync(tmp) } catch { /* ignore */ }
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })

const num = (v) => (typeof v === 'number' ? v : 0)
const result = {}
let ok = 0, miss = 0
const missed = []
let lastParty = null  // the sheet groups by party — the label appears once, then is blank
for (const r of rows) {
  const pCell = PARTYMAP[String(r[3] || '').trim()]
  if (pCell) lastParty = pCell
  const member = r[4]
  if (typeof member !== 'string' || !member.includes(',')) continue
  const party = lastParty
  if (!party) continue
  // "O'Connor, Greg (5)" -> "greg oconnor": drop footnote parentheticals,
  // reorder to given-name-first, then try the most specific key down to the
  // least. The parenthetical also carries mid-quarter notes like
  // "(up to 9/3/26)", which are period annotations, not part of the name.
  const cleanMember = member.replace(/\([^)]*\)/g, ' ').trim()
  const [rawSurname, rawGiven = ''] = cleanMember.split(',')
  const surname = norm(rawSurname)
  const fullKey = norm(`${rawGiven} ${rawSurname}`)
  const slug = byFullName.get(fullKey) ?? bySurnameParty.get(`${surname}::${party}`) ?? bySurnameOnly.get(surname)
  if (!slug) { miss++; missed.push(`${member.trim()} [${String(r[3] || party).trim()}]`); continue }
  const accommodation = Math.round((num(r[5]) + num(r[6])) * 100) / 100
  const travel = Math.round((num(r[7]) + num(r[8]) + num(r[9])) * 100) / 100
  const total = Math.round(num(r[10]) * 100) / 100
  // ACCUMULATE, never overwrite: a mid-quarter party change splits one person
  // across two rows ("up to 9/3/26" / "from 10/3/26"), and both are their
  // spending for the quarter. Overwriting kept whichever row came last and
  // silently understated the figure this card exists to disclose.
  const prev = result[slug]
  result[slug] = prev
    ? {
        total: Math.round((prev.total + total) * 100) / 100,
        accommodation: Math.round((prev.accommodation + accommodation) * 100) / 100,
        travel: Math.round((prev.travel + travel) * 100) / 100,
        period: PERIOD, sourceUrl: SOURCE_URL, sourceLabel: SOURCE_LABEL,
      }
    : { total, accommodation, travel, period: PERIOD, sourceUrl: SOURCE_URL, sourceLabel: SOURCE_LABEL }
  ok++
}
if (missed.length) console.log(['unmatched rows:', ...missed].join(String.fromCharCode(10) + '  '))

const banner = `// AUTO-GENERATED by scripts/enrich-mp-expenses.mjs. Do not edit by hand.
// Per-MP taxpayer-funded travel + accommodation for ${PERIOD}, from the official
// quarterly Members' Expense Disclosure (Parliamentary Service / Office of the
// Clerk, parliament.nz). Official source — attributed + dated on the profile.\n`
writeFileSync(OUT, `${banner}\nexport interface MPExpenses { total: number; accommodation: number; travel: number; period: string; sourceUrl: string; sourceLabel: string }\nexport const MP_EXPENSES: Record<string, MPExpenses> = ${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Matched ${ok} MPs (${miss} rows unmatched) → ${OUT}`)
