/**
 * enrich-mp-interests.mjs — MPs' declared interests from the OFFICIAL register.
 *
 * Downloads the "Register of Pecuniary and Other Specified Interests of Members
 * of Parliament" (an annual PDF on parliament.nz — one document, all MPs),
 * extracts each MP's section, and stores it for the profile "Declared interests"
 * card. Official source, attributed + dated. Nothing is invented.
 *
 * Run:  node scripts/enrich-mp-interests.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-interests.ts')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

// The 2026 register: presented to the House May 2026, published as media/12156.
// sourceUrl stays the CANONICAL parliament.nz address — that is what the
// profile cites — even when the bytes have to come from elsewhere (see --pdf).
const REGISTER_URL = 'https://www3.parliament.nz/media/12156/register-of-pecuniary-and-other-specified-interests-of-members-of-parliament-summary-of-annual-returns-as-at-31-january-2026.pdf'
const AS_OF = '31 January 2026'
const SOURCE_LABEL = 'Register of Pecuniary Interests (parliament.nz)'

const PARTYMAP = {
  National: 'national', Labour: 'labour', Green: 'green', ACT: 'act',
  'New Zealand First': 'nzfirst', 'NZ First': 'nzfirst',
  'Te Pāti Māori': 'tpm', 'Te Pati Maori': 'tpm', 'Māori Party': 'tpm',
}

// {surname-lower + party} -> slug  (surname = last token of the MP's name)
const src = readFileSync(GEN, 'utf8')
const bySurnameParty = new Map()
const bySurnamePartySeat = new Map()
const ambiguous = new Set()
// Drop apostrophes (O'Connor vs O’Connor) AND accents (Ōhāriu however it was
// composed), so keys compare by letters alone.
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`´′ʻ]/g, '').trim()
// Robust: find each slug, then the first name/party after it (handles nested braces).
const slugRe = /slug:\s*'([^']+)'/g
let sm
/**
 * Three-part key, because surname+party is not unique. Labour has TWO
 * O'Connors, and the old map hand-pinned 'oconnor::labour' to damien-oconnor —
 * so both register sections resolved to Damien, the second overwrote the
 * first, and Damien's profile published GREG's declared interests (the Ōhāriu
 * section on the List MP's card). A hand map was how the ambiguity was
 * noticed, and also how it became a mislabelling.
 *
 * The register's own header carries the disambiguator: "O'Connor (Labour,
 * Ōhāriu)" vs "O'Connor (Labour, List)". So the primary key is
 * surname::party::electorate (list MPs keyed as 'list'), with surname::party
 * kept only where it maps to a single MP.
 *
 * The name capture also handles the \' escape in "O\'Connor" — the old
 * regex stopped at the backslash and indexed the surname as "o\", which is
 * why neither O'Connor could match anything honestly.
 */
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 800)
  const nm = win.match(/\bname:\s*'((?:\\.|[^'\\])*)'/)
  const pm = win.match(/\bparty:\s*'([^']+)'/)
  const em = win.match(/\belectorate:\s*'((?:\\.|[^'\\])*)'/)
  const rm = win.match(/\brole:\s*'([^']+)'/)
  if (!nm || !pm) continue
  const surname = norm(nm[1].replace(/\\'/g, "'").split(/\s+/).pop())
  const seat = rm && rm[1] === 'list' ? 'list' : norm((em ? em[1] : '') || 'list')
  bySurnamePartySeat.set(`${surname}::${pm[1]}::${seat}`, sm[1])
  const key = `${surname}::${pm[1]}`
  const prev = bySurnameParty.get(key)
  if (prev && prev !== sm[1]) ambiguous.add(key)
  else bySurnameParty.set(key, sm[1])
}
for (const key of ambiguous) bySurnameParty.delete(key)
// Curated MPs outside mps-generated.ts, and TPM MPs mis-tagged 'independent' in our data.
bySurnameParty.set('luxon::national', 'christopher-luxon')
bySurnameParty.set('collins::national', 'judith-collins')
bySurnameParty.set('ferris::tpm', 'takuta-ferris')
bySurnameParty.set('kapa-kingi::tpm', 'mariameno-kapa-kingi')
console.log(`Indexed ${bySurnamePartySeat.size} MP seats (${ambiguous.size} surname::party key(s) ambiguous, resolved by electorate)`)

// Download + extract the register text.
const tmp = join(__dirname, '..', '.tmp-register.pdf')
execFileSync('curl', ['-s', '-L', '--max-time', '60', '-A', UA, REGISTER_URL, '-o', tmp], { maxBuffer: 64 * 1024 * 1024 })
const raw = await new PDFParse({ data: new Uint8Array(readFileSync(tmp)) }).getText()
try { (await import('node:fs')).unlinkSync(tmp) } catch { /* ignore */ }
let text = (raw.text || '')
  .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '\n')
  .replace(/REGISTER OF PECUNIARY[^\n]*/gi, '\n')
  .replace(/[ \t]{2,}/g, ' ')

// Find each MP header: "Surname (Party, Electorate-or-list)".
const partyAlt = Object.keys(PARTYMAP).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
const headerRe = new RegExp(`([A-Za-zĀ-ūā-ū'’.-]+) \\((${partyAlt}),\\s*([^)]+)\\)`, 'g')
const heads = []
let h
while ((h = headerRe.exec(text))) heads.push({ surname: h[1], party: PARTYMAP[h[2]], electorate: h[3].trim(), idx: h.index, end: headerRe.lastIndex })

const result = {}
let ok = 0
for (let i = 0; i < heads.length; i++) {
  const { surname, party, electorate, end } = heads[i]
  const slug = bySurnamePartySeat.get(`${norm(surname)}::${party}::${norm(electorate)}`)
    ?? bySurnameParty.get(`${norm(surname)}::${party}`)
  if (!slug) { console.warn(`  unmatched: ${surname} (${party})`); continue }
  const blockEnd = i + 1 < heads.length ? heads[i + 1].idx : Math.min(end + 4000, text.length)
  let block = text.slice(end, blockEnd).replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
  if (block.length < 8) continue
  if (block.length > 1600) block = block.slice(0, 1600).replace(/\s+\S*$/, '') + '…'
  // Skip "nil"/"no interests" non-content
  result[slug] = { interests: block, asOf: AS_OF, sourceUrl: REGISTER_URL, sourceLabel: SOURCE_LABEL }
  ok++
}

const banner = `// AUTO-GENERATED by scripts/enrich-mp-interests.mjs. Do not edit by hand.
// Each MP's declared interests, extracted from the official Register of Pecuniary
// and Other Specified Interests of Members of Parliament (parliament.nz),
// summary of annual returns as at ${AS_OF}. Official source — attributed on the profile.\n`
writeFileSync(OUT, `${banner}\nexport interface MPInterests { interests: string; asOf: string; sourceUrl: string; sourceLabel: string }\nexport const MP_INTERESTS: Record<string, MPInterests> = ${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Matched ${ok}/${heads.length} register entries → ${OUT}`)
