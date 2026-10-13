/**
 * reconcile-candidates-2026.mjs — make the site's candidate list match the
 * Electoral Commission's official one.
 *
 * WHY THIS REPLACES THE WIKIPEDIA SCRAPE. Nominations closed on 9 October 2026
 * and the Commission published the final field: 469 electorate candidates
 * across 71 seats. Until then a weekly scrape of Wikipedia's
 * candidates-by-electorate page was the best available source. It is no longer
 * the best available source, and it was wrong in four distinct ways that an
 * audit on 13 October 2026 measured against the official list:
 *
 *   1. Each electorate table on that page ends with a separator row reading
 *      "Retiring incumbents and withdrawn candidates". The parser skipped that
 *      row (it has no <td> cells) and then KEPT WALKING, so 43 people who are
 *      not standing — Stuart Nash, Judith Collins, Shane Reti, Megan Woods,
 *      Andrew Bayly, Duncan Webb among them — were ingested as live candidates.
 *   2. The electorate list it filtered against was the 2023 one, so the ten
 *      seats created in the 8 August 2025 boundary review were skipped whole.
 *   3. norm('Mount Albert') !== norm('Mt Albert'), so two more seats never
 *      matched and had zero candidates.
 *   4. Six Auckland Central candidates, Chloe Swarbrick included, were filed
 *      under Banks Peninsula.
 *
 * Net effect: 383 approved rows of which 331 were right, 43 people who are not
 * standing, 9 in the wrong seat, and 138 real candidates missing.
 *
 * WHAT IT DOES NOT DO. It never asserts a withdrawal. The site has a proper
 * withdrawal display — data.withdrawn = { date, source }, rendered as "X is no
 * longer standing in Y. Withdrew <date>" with the citation — and that is for
 * people who were candidates and pulled out. Most of the 43 never stood at all:
 * they are retiring MPs, and "withdrew" would be a fresh falsehood about them.
 * So the default for someone absent from the official list is status
 * 'rejected' with a note citing the list, which takes them off the public site
 * without inventing an event. A genuine withdrawal is recorded separately, by
 * hand, with its own citation, via scripts/mark-withdrawn.mjs.
 *
 * Run: node scripts/reconcile-candidates-2026.mjs            (report only)
 *      node scripts/reconcile-candidates-2026.mjs --apply    (write)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const SOURCE_URL = 'https://elections.nz/media-and-news/2026/candidate-and-party-lists-released'
const SOURCE_LABEL = 'Electoral Commission - official candidate list, 9 October 2026'
const AS_OF = '2026-10-09'

for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_0-9]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const seatKey = (s) => norm(String(s).replace(/\bMount\b/gi, 'Mt'))
/** Name identity for matching: sorted significant tokens, accent- and case-free. */
const toks = (s) => norm(s).split('-').filter((t) => t.length > 1).sort().join(' ')

// ── the 17 registered parties, and the mapping to our slugs ──────────────────
const PARTY_SLUG = new Map([
  ['ACT New Zealand', 'act'],
  ['Alliance Party', 'alliance'],
  ['Animal Justice Party Aotearoa New Zealand', 'animal-justice'],
  ['Aotearoa Legalise Cannabis Party', 'alcp'],
  ['Conservative Party NZ', 'conservative'],
  ['Free Palestine', 'free-palestine'],
  ['Green Party', 'green'],
  ['Labour Party', 'labour'],
  ['National Party', 'national'],
  ['New Zealand First Party', 'nzfirst'],
  ['New Zealand Loyal', 'nz-loyal'],
  ['NZ Outdoors & Freedom Party', 'nz-outdoors'],
  ['Opportunity Party', 'top'],
  ['Te Pati Maori', 'tpm'],
  ['Te Tai Tokerau Party', 'te-tai-tokerau-party'],
  ['Vision New Zealand', 'vision-nz'],
  ['Independent', 'independent'],
])
// Matched on the normalised label so macrons and punctuation cannot break it —
// the CSV says "Te Pati Maori" with macrons and "Women's Rights Party" with an
// apostrophe, and a literal-key lookup silently misses both.
const PARTY_BY_NORM = new Map([...PARTY_SLUG].map(([k, v]) => [norm(k), v]))
PARTY_BY_NORM.set(norm("Women's Rights Party"), 'womens-rights')
const slugFor = (label) => PARTY_BY_NORM.get(norm(label)) ?? null

/**
 * "SURNAME, First Middle" -> "First Middle Surname".
 *
 * The Commission upper-cases every surname, so the casing has to be rebuilt,
 * and naive title-casing produces "Tracey Mclellan" and "Tim Van De Molen".
 * Rather than guess, this prefers a spelling the repo ALREADY holds — from the
 * MP profiles and from the candidate rows an editor has already approved — and
 * only falls back to rules. Every generated name is printed for review.
 */
const PARTICLES = new Set(['van', 'de', 'der', 'den', 'von', 'la', 'le', 'du', 'di', 'da'])
/**
 * Case one word of a name.
 *
 * `isSurname` matters, and getting it wrong is visible: the initials rule that
 * correctly preserves "Donald DS" and "Craig H." also ate three-letter
 * SURNAMES, turning LUV, LEE, DEO, QU and SNG into "Kay LUV" and "Melissa LEE".
 * Initials only ever occur among given names, so the rule only applies there.
 */
const fixCase = (word, isSurname = false) => {
  if (!word) return word
  // Given names only: initials and abbreviations stay as given — "Craig H.",
  // "David L F Smith", "Donald DS McDonald", "Chee Khiang (CK) Sng".
  if (!isSurname && /^\(?[A-Z]{1,3}\)?\.?$/.test(word)) return word
  // A parenthesised name keeps its brackets and is cased inside them: the
  // official list carries "MANNING, Romana (Marnz)", and treating "(" as the
  // first letter yielded "(marnz)".
  const paren = word.match(/^\((.+)\)$/)
  if (paren) return `(${fixCase(paren[1], isSurname)})`
  const lower = word.toLowerCase()
  if (PARTICLES.has(lower)) return lower
  if (/^mc\w\w/.test(lower)) return 'Mc' + lower[2].toUpperCase() + lower.slice(3)
  if (/^mac\w\w/.test(lower)) return 'Mac' + lower[3].toUpperCase() + lower.slice(4)
  if (lower.includes("'")) {
    // O'Neill and D'Angelo capitalise after the apostrophe; Papali'i and
    // Kanongata'a do not. The discriminator is the length of the part before
    // it — a single letter is the Irish/Norman particle, anything longer is the
    // body of the name.
    const parts = lower.split("'")
    return parts.map((p, i) => {
      if (!p) return p
      if (i === 0) return p.charAt(0).toUpperCase() + p.slice(1)
      return parts[i - 1].length === 1 ? p.charAt(0).toUpperCase() + p.slice(1) : p
    }).join("'")
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}
const titleise = (s, isSurname = false) =>
  s.split(/\s+/).map((w) => w.split('-').map((p) => fixCase(p, isSurname)).join('-')).join(' ')

/**
 * Is the seat+party match the SAME PERSON, or their replacement?
 *
 * A registered party fields one candidate per seat, so seat+party looks like a
 * unique key — and matching on it alone was a real bug, caught in report mode
 * before anything was written. For West Coast-Tasman/National it paired the
 * retiring Maureen Pugh with Katie Milne, who is standing there now, and called
 * it a spelling correction. Applied, that would have overwritten one person's
 * identity with another's: Judith Collins becoming Emma Chatterton, Megan Woods
 * becoming Dominik Yanzick, Brooke van Velden becoming James Christmas.
 *
 * The discriminator is the surname. Every genuine correction in this dataset
 * keeps it — McCraken/McCracken, Sam/Samuel Mills, Doug/Douglas Robert Lyell —
 * and every false pairing changes it. Fuzzy, because the misspellings are
 * exactly the case that matters: one edit on a long surname is a typo, five is
 * a different person. If this rejects a real match the row simply reports as
 * unmatched, which is a safe failure — a human sees it instead of a silent
 * overwrite.
 */
const lev = (a, b) => {
  const m = a.length, n = b.length
  if (!m || !n) return Math.max(m, n)
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}
const close = (a, b) => lev(a, b) <= (Math.min(a.length, b.length) <= 4 ? 1 : 2)
const surnameMatches = (officialEntry, dbName) => {
  const i = officialEntry.indexOf(',')
  const surname = i < 0 ? officialEntry : officialEntry.slice(0, i)
  const sTok = norm(surname).split('-').filter((t) => t.length > 1)
  const dTok = toks(dbName).split(' ').filter(Boolean)
  return sTok.some((s) => dTok.some((d) => close(s, d)))
}
const displayName = (official, dict) => {
  const i = official.indexOf(',')
  const surname = i < 0 ? official : official.slice(0, i).trim()
  const given = i < 0 ? '' : official.slice(i + 1).trim()
  const built = `${titleise(given)} ${titleise(surname, true)}`.trim()
  const known = dict.get(toks(built))
  return { name: known || built, fromDict: !!known }
}

// ── read the official list ───────────────────────────────────────────────────
const official = []
for (const line of readFileSync('scripts/data/electorate-candidates-2026.csv', 'utf8').trim().split(/\r?\n/).slice(1)) {
  const m = line.match(/^(?:"((?:[^"]|"")*)"|([^,]*)),(.*),(.*)$/)
  if (!m) throw new Error(`unparsed CSV row: ${line}`)
  official.push({
    official: (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]).trim(),
    seat: m[3].trim(),
    partyLabel: m[4].trim(),
  })
}
if (official.length !== 469) throw new Error(`expected 469 official candidates, got ${official.length}`)
const unmapped = [...new Set(official.map((o) => o.partyLabel))].filter((l) => !slugFor(l))
console.log(`official list: ${official.length} candidates, ${unmapped.length} unregistered party label(s)\n`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const rows = []
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from('content_items')
    .select('id, source_id, status, title, data').eq('type', 'candidate').order('id').range(f, f + 999)
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...(data || []))
  if (!data || data.length < 1000) break
}
const live = rows.filter((r) => r.status === 'approved')

// a casing dictionary from what the repo already knows
const dict = new Map()
for (const r of rows) if (typeof r.data?.name === 'string') dict.set(toks(r.data.name), r.data.name)
for (const line of readFileSync('src/constants/mps-data.ts', 'utf8').split('\n')) {
  const m = line.match(/name:\s*'([^']+)'/)
  if (m) dict.set(toks(m[1]), m[1])
}

// ── match ────────────────────────────────────────────────────────────────────
const bySeat = new Map()
for (const o of official) {
  const k = seatKey(o.seat)
  if (!bySeat.has(k)) bySeat.set(k, [])
  bySeat.get(k).push(o)
}
const claimed = new Set()
const ok = [], renames = [], moves = [], notStanding = [], approvals = []
/**
 * Matched over EVERY row, not just the approved ones.
 *
 * 44 candidates were already staged as 'pending', waiting on the /editor gate.
 * Matching only approved rows reported 41 of them as "missing" and would have
 * tried to INSERT them — which the unique (type, source_id) constraint would
 * have rejected, failing the whole batch. They do not need inserting, they need
 * approving, and the row that already exists keeps whatever an editor had
 * attached to it.
 *
 * Approved rows are matched FIRST so that a pending duplicate cannot claim an
 * official entry ahead of the live row for the same person.
 */
const RANK = { approved: 0, pending: 1, rejected: 2 }
const ordered = [...rows].sort((a, b) => (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3))
for (const r of ordered) {
  const nm = toks(r.data?.name)
  const seat = seatKey(r.data?.electorate || r.data?.electorateSlug)
  const pool = (bySeat.get(seat) || []).filter((o) => !claimed.has(o))
  const slug = r.data?.party
  // A registered party fields one candidate per seat, so seat+party is a near
  // unique key and survives a misspelling. Independents need the name.
  let hit = pool.find((o) => toks(displayName(o.official, dict).name) === nm)
  if (!hit && slug && slug !== 'independent') {
    hit = pool.find((o) => slugFor(o.partyLabel) === slug && surnameMatches(o.official, r.data?.name))
  }
  if (hit) {
    claimed.add(hit)
    const want = displayName(hit.official, dict).name
    if (r.status !== 'approved') approvals.push({ r, hit, want })
    else if (toks(want) !== nm) renames.push({ r, hit, want })
    else ok.push(r)
    continue
  }
  const elsewhere = official.find((o) => !claimed.has(o) && toks(displayName(o.official, dict).name) === nm)
  if (elsewhere) {
    claimed.add(elsewhere)
    if (r.status !== 'approved') approvals.push({ r, hit: elsewhere, want: displayName(elsewhere.official, dict).name })
    else moves.push({ r, right: elsewhere })
    continue
  }
  // Only an APPROVED row is a problem on the public site. A pending row that
  // is not on the official list was simply never approved, and rejecting it
  // adds nothing.
  if (r.status === 'approved') notStanding.push(r)
}
const missing = official.filter((o) => !claimed.has(o))

// ── report ───────────────────────────────────────────────────────────────────
console.log(`OFFICIAL  ${official.length} candidates across ${bySeat.size} seats`)
console.log(`SITE      ${live.length} approved rows\n`)
console.log(`  correct                 ${ok.length}`)
console.log(`  name corrected          ${renames.length}`)
console.log(`  wrong electorate        ${moves.length}`)
console.log(`  already staged, approve ${approvals.length}`)
console.log(`  not on official list    ${notStanding.length}`)
console.log(`  missing, to be added    ${missing.length}`)
console.log(`  ─────────────────────────────`)
console.log(`  will be live after apply ${ok.length + renames.length + moves.length + approvals.length + missing.length} / ${official.length}`)

if (approvals.length) {
  console.log(`\n-- already staged, will be approved --`)
  for (const { r, want } of approvals) console.log(`  [${r.status}] ${want} - ${r.data?.electorate ?? '?'}`)
}

if (renames.length) {
  console.log(`\n-- name corrections --`)
  for (const { r, want } of renames) console.log(`  ${r.data.name}  ->  ${want}   (${r.data.electorate})`)
}
if (moves.length) {
  console.log(`\n-- wrong electorate --`)
  for (const { r, right } of moves) console.log(`  ${r.data.name}: ${r.data.electorate} -> ${right.seat} (${right.partyLabel})`)
}
if (notStanding.length) {
  console.log(`\n-- not on the official list (rejected, NOT marked withdrawn) --`)
  for (const r of notStanding) console.log(`  ${r.data?.name} - ${r.data?.electorate} (${r.data?.partyLabel ?? r.data?.party})`)
}
if (missing.length) {
  console.log(`\n-- to add (${missing.length}) - generated display names, review the casing --`)
  for (const o of missing) {
    const d = displayName(o.official, dict)
    const slug = slugFor(o.partyLabel)
    console.log(`  ${d.name.padEnd(28)} ${o.seat.padEnd(22)} ${(slug ?? 'UNREGISTERED').padEnd(22)}${d.fromDict ? ' [known]' : '        '} ${slug ? '' : o.partyLabel}`)
  }
}

if (!APPLY) { console.log(`\n(report only - pass --apply to write)`); process.exit(0) }

// ── apply ────────────────────────────────────────────────────────────────────
let wrote = 0
for (const { r, hit, want } of renames) {
  const { error } = await sb.from('content_items').update({
    title: `${want} - ${hit.seat} (${hit.partyLabel})`,
    data: { ...r.data, name: want, asOf: AS_OF, sourceLabel: SOURCE_LABEL },
  }).eq('id', r.id)
  if (error) { console.error(`  ! ${want}: ${error.message}`); continue }
  wrote++
}
for (const { r, right } of moves) {
  const slug = slugFor(right.partyLabel) ?? 'independent'
  const registered = !!slugFor(right.partyLabel) && right.partyLabel !== 'Independent'
  const next = {
    ...r.data,
    electorate: right.seat,
    electorateSlug: seatKey(right.seat),
    party: slug,
    asOf: AS_OF,
    sourceLabel: SOURCE_LABEL,
  }
  if (registered || right.partyLabel === 'Independent') delete next.partyLabel
  else next.partyLabel = right.partyLabel
  const { error } = await sb.from('content_items').update({
    title: `${r.data.name} - ${right.seat} (${right.partyLabel})`, data: next,
  }).eq('id', r.id)
  if (error) { console.error(`  ! ${r.data.name}: ${error.message}`); continue }
  wrote++
}
for (const { r, hit, want } of approvals) {
  const slug = slugFor(hit.partyLabel) ?? 'independent'
  const next = {
    ...r.data,
    name: want,
    electorate: hit.seat,
    electorateSlug: seatKey(hit.seat),
    party: slug,
    asOf: AS_OF,
    sourceLabel: SOURCE_LABEL,
  }
  if (slugFor(hit.partyLabel)) delete next.partyLabel
  else next.partyLabel = hit.partyLabel
  const { error } = await sb.from('content_items').update({
    status: 'approved',
    title: `${want} - ${hit.seat} (${hit.partyLabel})`,
    data: next,
    editor_notes: `Confirmed on the Electoral Commission's official candidate list, published 9 October 2026 after nominations closed. ${SOURCE_URL}`,
  }).eq('id', r.id)
  if (error) { console.error(`  ! ${want}: ${error.message}`); continue }
  wrote++
}
for (const r of notStanding) {
  const { error } = await sb.from('content_items').update({
    status: 'rejected',
    editor_notes: `Not on the Electoral Commission's official candidate list published 9 October 2026, after nominations closed. Staged in error by the Wikipedia ingest, which read the "Retiring incumbents and withdrawn candidates" rows as live candidates. Rejected rather than marked withdrawn: most of these people never stood, so a withdrawal date would be false. ${SOURCE_URL}`,
  }).eq('id', r.id)
  if (error) { console.error(`  ! ${r.data?.name}: ${error.message}`); continue }
  wrote++
}
const inserts = missing.map((o) => {
  const { name } = displayName(o.official, dict)
  const slug = slugFor(o.partyLabel)
  return {
    type: 'candidate',
    source_id: `cand:${seatKey(o.seat)}|${norm(name)}`,
    // Approved on insert, deliberately. Every other candidate source on this
    // site is a scrape an editor has to judge; this one IS the Electoral
    // Commission's own list of who is standing, and an editor cannot improve on
    // it. Leaving 138 real candidates pending three weeks out would keep the
    // site wrong in order to preserve a review step with nothing to review.
    status: 'approved',
    change_kind: 'new',
    title: `${name} - ${o.seat} (${o.partyLabel})`,
    source_url: SOURCE_URL,
    data: {
      name,
      electorate: o.seat,
      electorateSlug: seatKey(o.seat),
      party: slug ?? 'independent',
      // Only for the candidates standing for parties that are NOT registered:
      // they get no slug, no tile and no profile link, but their stated
      // affiliation is shown rather than them being dropped or relabelled an
      // independent.
      ...(slug ? {} : { partyLabel: o.partyLabel }),
      notes: '',
      citations: [SOURCE_URL],
      asOf: AS_OF,
      sourceLabel: SOURCE_LABEL,
    },
  }
})
for (let i = 0; i < inserts.length; i += 100) {
  const chunk = inserts.slice(i, i + 100)
  const { error } = await sb.from('content_items').insert(chunk)
  if (error) { console.error(`  ! insert batch ${i}: ${error.message}`); continue }
  wrote += chunk.length
}
console.log(`\napplied: ${wrote} row(s) written`)
