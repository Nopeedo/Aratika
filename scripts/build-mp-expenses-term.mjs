/**
 * build-mp-expenses-term.mjs — MPs' taxpayer-funded expenses across the WHOLE
 * 54th Parliament term (since the 2023 election), for relevance to the 2026
 * election. Pulls every published quarterly disclosure from data.govt.nz /
 * parliament.nz (the same official source as enrich-mp-expenses.mjs, just
 * looped across all 9 quarters published so far: Q4 2023 – Q4 2025).
 *
 * Per-MP: an array of quarters (each attributed + dated) + a term-to-date
 * running total. Official source, nothing invented; unmatched rows skipped
 * and reported (some MPs who've changed party mid-term may not match every
 * quarter — a known, disclosed limitation, not fabricated data).
 *
 * Run:  node scripts/build-mp-expenses-term.mjs
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-expenses-term.ts')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const SOURCE_URL = 'https://www.parliament.nz/en/mps-and-electorates/mps-expenses/'
const SOURCE_LABEL = "Members' expense disclosure (parliament.nz)"

// Every quarter published so far within the 54th Parliament term (elected 14 Oct 2023).
const QUARTERS = [
  { period: '1 October – 31 December 2023', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/d0904c14-7e35-466a-a9bb-71720c71af14/download/disclosure-of-members-expenses-from-1-october-to-31-december-2023-xlsx.xlsx' },
  { period: '1 January – 31 March 2024', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/cc0f63b4-fec4-490a-a989-eb1277f13419/download/disclosure-of-members-expenses-from-1-january-to-31-march-2024-xlsx.xlsx' },
  { period: '1 April – 30 June 2024', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/582d4878-0281-4509-aade-ab6029f54220/download/disclosure-of-members-expenses-from-1-april-to-30-june-2024-xlsx.xlsx' },
  { period: '1 July – 30 September 2024', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/40d0d8e0-c3ce-4092-b73a-0b70ab313e30/download/disclosure-of-members-expenses-from-1-july-to-30-september-2024-xlsx.xlsx' },
  { period: '1 October – 31 December 2024', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/c81dd20f-72cd-4750-bf52-63496afc54af/download/disclosure-of-members-expenses-from-1-october-to-31-december-2024.xlsx' },
  { period: '1 January – 31 March 2025', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/b8eef537-62bb-4b4e-97ba-b63b1efbf635/download/disclosure-of-members-expenses-from-1-january-to-31-march-2025.xlsx' },
  { period: '1 April – 30 June 2025', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/2290c2ea-3fab-48a0-bb5b-d36044ca9787/download/disclosure-of-members-expenses-from-1-april-to-30-june-2025-xlsx.xlsx' },
  { period: '1 July – 30 September 2025', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/51504f7e-b4eb-44cc-8ee8-8a6f4cfc0d9f/download/disclosure-of-members-expenses-from-1-july-to-30-september-2025.xlsx' },
  { period: '1 October – 31 December 2025', url: 'https://catalogue.data.govt.nz/dataset/3e3238a7-e74f-4256-8979-07e609b83961/resource/a3bfb180-bce5-4c5d-b99c-3fc16d096d4a/download/disclosure-of-members-expenses-from-1-october-to-31-december-2025.xlsx' },
]

const PARTYMAP = {
  Independent: 'independent', National: 'national', Labour: 'labour', Green: 'green', ACT: 'act',
  'New Zealand First': 'nzfirst', 'NZ First': 'nzfirst', 'Te Pāti Māori': 'tpm', 'Te Pati Maori': 'tpm',
}

// surname+party -> slug, from our CURRENT MP data (so an MP who has since changed
// party may not match older quarters filed under their old party — disclosed below).
const src = readFileSync(GEN, 'utf8')
const bySurnameParty = new Map()
const norm = (s) => String(s).toLowerCase().replace(/['’`´′ʻ]/g, '').trim()
const slugRe = /slug:\s*'([^']+)'/g
let sm
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 800)
  const nm = win.match(/\bname:\s*'([^']+)'/)
  const pm = win.match(/\bparty:\s*'([^']+)'/)
  if (nm && pm) bySurnameParty.set(`${norm(nm[1].split(/\s+/).pop())}::${pm[1]}`, sm[1])
}
bySurnameParty.set('luxon::national', 'christopher-luxon')
bySurnameParty.set('collins::national', 'judith-collins')

const num = (v) => (typeof v === 'number' ? v : 0)

// The XLSX column layout is NOT consistent across years (data.govt.nz's export has
// shifted columns release to release) — detect the real column positions per file by
// scanning its own header row, rather than assuming fixed indices.
function findColumns(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i] || []
    const norm2 = (c) => String(c ?? '').trim().toLowerCase()
    const partyIdx = row.findIndex((c) => norm2(c) === 'party')
    const memberIdx = row.findIndex((c) => norm2(c) === 'member')
    if (partyIdx !== -1 && memberIdx !== -1) {
      const accIdx = row.findIndex((c) => norm2(c) === 'accommodation')
      const travelIdx = row.findIndex((c) => norm2(c) === 'travel')
      const totalIdx = row.findIndex((c) => norm2(c).includes('grand total'))
      if (accIdx !== -1 && travelIdx !== -1 && totalIdx !== -1) {
        return { partyIdx, memberIdx, accIdx, travelIdx, totalIdx }
      }
    }
  }
  return null
}

const perMP = {}   // slug -> { quarters: [...] }
let totalOk = 0, totalMiss = 0

for (const q of QUARTERS) {
  const tmp = join(__dirname, '..', `.tmp-expenses-${q.period.replace(/\W+/g, '-')}.xlsx`)
  try {
    execFileSync('curl', ['-s', '-L', '--max-time', '60', '-A', UA, q.url, '-o', tmp], { maxBuffer: 64 * 1024 * 1024 })
    const wb = XLSX.read(readFileSync(tmp))
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
    const cols = findColumns(rows)
    if (!cols) { console.warn(`${q.period}: could not locate header columns — SKIPPED`); continue }
    const { partyIdx, memberIdx, accIdx, travelIdx, totalIdx } = cols
    let lastParty = null
    let ok = 0, miss = 0
    for (const r of rows) {
      const pCell = PARTYMAP[String(r[partyIdx] || '').trim()]
      if (pCell) lastParty = pCell
      const member = r[memberIdx]
      if (typeof member !== 'string' || !member.includes(',')) continue
      const party = lastParty
      if (!party) continue
      const surname = norm(member.split(',')[0])
      const slug = bySurnameParty.get(`${surname}::${party}`)
      if (!slug) { miss++; continue }
      const accommodation = Math.round((num(r[accIdx]) + num(r[accIdx + 1])) * 100) / 100
      const travel = Math.round((num(r[travelIdx]) + num(r[travelIdx + 1]) + num(r[travelIdx + 2])) * 100) / 100
      const total = Math.round(num(r[totalIdx]) * 100) / 100
      ;(perMP[slug] ||= []).push({ period: q.period, total, accommodation, travel })
      ok++
    }
    totalOk += ok; totalMiss += miss
    console.log(`${q.period}: matched ${ok}, unmatched ${miss} (cols party=${partyIdx} member=${memberIdx} acc=${accIdx} travel=${travelIdx} total=${totalIdx})`)
  } catch (e) {
    console.warn(`FAILED to fetch/parse ${q.period}: ${e.message}`)
  } finally {
    try { unlinkSync(tmp) } catch { /* ignore */ }
  }
}

const result = {}
for (const [slug, quarters] of Object.entries(perMP)) {
  const termTotal = Math.round(quarters.reduce((n, q) => n + q.total, 0) * 100) / 100
  const termAccommodation = Math.round(quarters.reduce((n, q) => n + q.accommodation, 0) * 100) / 100
  const termTravel = Math.round(quarters.reduce((n, q) => n + q.travel, 0) * 100) / 100
  result[slug] = { quarters, termTotal, termAccommodation, termTravel }
}

const banner = `// AUTO-GENERATED by scripts/build-mp-expenses-term.mjs. Do not edit by hand.
// Per-MP taxpayer-funded travel + accommodation for EVERY quarter published so far in
// the 54th Parliament term (since the 14 Oct 2023 election) — official quarterly
// Members' Expense Disclosure (Parliamentary Service / Office of the Clerk, via
// data.govt.nz). Nothing invented; MPs who changed party mid-term may be missing
// some earlier quarters (filed under their old party) — a disclosed limitation.
// Covers: ${QUARTERS[0].period} to ${QUARTERS[QUARTERS.length - 1].period}.\n`

writeFileSync(OUT, `${banner}
export interface MPExpenseQuarter { period: string; total: number; accommodation: number; travel: number }
export interface MPExpensesTerm { quarters: MPExpenseQuarter[]; termTotal: number; termAccommodation: number; termTravel: number }
export const TERM_EXPENSES_META = {
  asOf: '${QUARTERS[QUARTERS.length - 1].period}',
  quarterCount: ${QUARTERS.length},
  sourceUrl: '${SOURCE_URL}',
  sourceLabel: "${SOURCE_LABEL}",
}
export const MP_EXPENSES_TERM: Record<string, MPExpensesTerm> = ${JSON.stringify(result, null, 2)}
`, 'utf8')

console.log(`\nTotal matched ${totalOk}, unmatched ${totalMiss} → ${OUT}`)
console.log(`MPs with term data: ${Object.keys(result).length}`)
