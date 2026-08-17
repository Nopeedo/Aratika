/**
 * bill-terms.mjs — the terms that tag a news story to a bill someone tracks.
 *
 * Why this is curated rather than generated from the 270-bill dataset:
 * measured against 400 real approved articles, the formal bill title appeared
 * verbatim in exactly ONE. News does not print "Sentencing (Reinstating Three
 * Strikes) Amendment Bill"; it prints "three strikes". Generating terms by
 * stripping titles down to their subject was worse than useless — it matched 26
 * articles and nearly all were wrong, because stripping leaves generic phrases:
 * "local government" pulled in seven unrelated bills on a story about South
 * Island council plans, and "parliament" tagged a story about Luxon's
 * leadership. Wrongly telling someone a leadership story is news about the RMA
 * bill is worse than telling them nothing.
 *
 * So: the aliases below are how each bill is actually referred to in coverage,
 * written by hand, plus the exact formal titles of the real bills each editorial
 * grouping covers. A formal-title match is rare but always right.
 *
 * Keyed on the EDITORIAL defining-bill slug, not the Parliament slug, because
 * that is what a bookmark holds — /bills/<slug> pages exist only for the curated
 * bills, so every tracked bill is one of these eight.
 *
 * MATCHING IS PLAIN SUBSTRING (see tag() in ingest-news.mjs), so every term here
 * must be long and specific enough to survive it. Bare 'rma' would match
 * "format" and "performance"; bare 'smokefree' would match Smokefree Rockquest,
 * a schools music competition. Multi-word or don't bother.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** How coverage actually names each bill. Lowercase; substring-matched. */
const CURATED_BILL_TERMS = {
  'treaty-principles-bill': [
    'treaty principles bill', 'treaty principles', 'principles of the treaty of waitangi bill',
  ],
  'three-strikes-sentencing': [
    'three strikes', 'three-strikes',
  ],
  'gangs-act-2024': [
    'gangs act', 'gang patch ban', 'gang patches', 'gang insignia', 'patch ban',
  ],
  'fast-track-approvals-act-2024': [
    'fast-track approvals', 'fast track approvals', 'fast-track act', 'fast-track law',
    'fast-track consenting', 'fast-track regime', 'fast-track projects',
    // 'fast-tracked' is a deliberate accuracy trade, measured on 1000 articles:
    // it appeared 3 times — a wind farm consent, a Road of National Significance
    // (both granted under this Act) and a nitrous-oxide ban (generic use of the
    // word). It also catches "Fast-tracked housing developments can't be paused",
    // which nothing else here matches. Two true and one false per thousand
    // articles is worth it; drop this line if the misfires ever outweigh that.
    'fast-tracked',
  ],
  'resource-management-reform': [
    'resource management act', 'resource management reform', 'rma reform', 'rma replacement',
    'replacing the rma', 'replace the rma', 'natural and built environment',
  ],
  'local-water-done-well': [
    'local water done well', 'water done well', 'three waters', 'water services bill',
  ],
  'pae-ora-maori-health-authority': [
    'māori health authority', 'maori health authority', 'te aka whai ora', 'pae ora',
  ],
  'smokefree-environments-repeal': [
    // NOT bare 'smokefree' — Smokefree Rockquest is a national schools music
    // competition and gets more coverage than the repeal does.
    'smokefree environments', 'smokefree repeal', 'smokefree law', 'smokefree generation',
    'smokefree legislation', 'smoked tobacco',
  ],
}

/**
 * Phrases stripped from the text BEFORE matching, because they contain a bill
 * term without being about the bill. Ministerial titles are the whole problem:
 * "RMA Reform Minister" is Chris Bishop's job title and appears in every
 * planning press release he issues, so on a 400-article sample it tagged three
 * unrelated stories — a Hamilton district plan consultation, a Wellington
 * heritage consultation, and a local-government reform initiative — as news
 * about the RMA replacement. Stripping the title leaves "the RMA reform bill"
 * matching normally.
 */
const TITLE_NOISE = [
  'rma reform minister',
  'resource management reform minister',
  'minister for rma reform',
]

/** Editorial slug -> the real Parliament bill slugs it covers. */
function definingBillMap() {
  const raw = JSON.parse(readFileSync(join(root, 'src/constants/defining-bill-map.json'), 'utf8'))
  delete raw._comment
  return raw
}

/** Formal titles from the daily Parliament snapshot, keyed by Parliament slug. */
function officialTitles() {
  const src = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  const marker = 'BILLS_54: Bill54[] = '
  const tail = src.slice(src.indexOf(marker) + marker.length)
  const bills = JSON.parse(tail.slice(0, tail.lastIndexOf(']') + 1))
  const out = {}
  for (const b of bills) if (b.slug && b.title) out[b.slug] = b.title
  return out
}

/**
 * @returns {Record<string, string[]>} defining-bill slug -> lowercase terms.
 */
export function buildBillTerms() {
  const map = definingBillMap()
  const titles = officialTitles()
  const out = {}
  for (const [slug, curated] of Object.entries(CURATED_BILL_TERMS)) {
    const terms = new Set(curated.map((t) => t.toLowerCase()))
    // A formal title is a rare but zero-false-positive match, so include it.
    for (const parliamentSlug of map[slug] || []) {
      const title = titles[parliamentSlug]
      if (title) terms.add(title.toLowerCase())
    }
    out[slug] = [...terms]
  }
  return out
}

/** Tag a block of text with every bill it names. */
export function tagBills(text, terms) {
  let t = String(text || '').toLowerCase()
  for (const noise of TITLE_NOISE) t = t.split(noise).join(' ')
  return Object.keys(terms).filter((slug) => terms[slug].some((term) => t.includes(term)))
}
