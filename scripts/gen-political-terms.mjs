/**
 * gen-political-terms.mjs — builds scripts/political-terms.mjs (the shared term
 * lists both ingests use for party tagging + political relevance) from the current
 * MP roster, so detection stays in sync with Parliament.
 *
 * Every current MP's FULL NAME is mapped to their party (full names are high
 * precision — "Chris Bishop" won't false-match "bishop", "Simeon Brown" won't
 * match "Wayne Brown"). Layered on top: curated multi-word party terms (we avoid
 * ambiguous bare words like "act"/"green"/"national team") + general political
 * signal terms. Regenerate with: node scripts/gen-political-terms.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

// ── 1. Pull every MP's full name + party from the roster files ────────────────
const files = ['src/constants/mps-generated.ts', 'src/constants/mps-data.ts']
// Every party the site covers must be taggable, or the news/video feeds quietly
// revert to inclusion-by-prominence while the policy pages use inclusion-by-
// registration. The extra-parliamentary parties have no MPs in the roster, so they
// are taggable via CURATED alone. `independent` picks up MPs who now sit as
// independents (e.g. the Nov-2025 Te Pāti Māori expulsions) — without it, their
// names tag to no party at all.
const byParty = {
  national: new Set(), labour: new Set(), green: new Set(), act: new Set(),
  nzfirst: new Set(), tpm: new Set(), top: new Set(), independent: new Set(),
  alcp: new Set(), 'animal-justice': new Set(), conservative: new Set(),
  'nz-outdoors': new Set(), 'vision-nz': new Set(), 'womens-rights': new Set(),
}
// Christopher Luxon is intentionally excluded from mps-generated.ts (rich profile).
byParty.national.add('christopher luxon')

// Per-MP terms: slug → Set of full-name variants, so a news/video item can be
// tagged to the individual MP it names (not just their party). Multi-word full
// names only — bare surnames ("brown", "webb") false-match far too easily.
const mpTerms = {}
const addMp = (slug, term) => { (mpTerms[slug] ??= new Set()).add(term) }
addMp('christopher-luxon', 'christopher luxon') // excluded from the roster files below

for (const rel of files) {
  const text = readFileSync(join(root, rel), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/name:\s*'([^']+)'[^\n]*?party:\s*'([a-z-]+)'/)
    if (!m) continue
    const name = m[1].trim().toLowerCase()
    const party = m[2]
    if (byParty[party] && name.includes(' ')) byParty[party].add(name)
    // Capture the slug + every name variant on this line for individual-MP tagging.
    const slug = line.match(/slug:\s*'([^']+)'/)?.[1]
    if (slug) {
      const full = line.match(/fullName:\s*'([^']+)'/)?.[1]?.trim().toLowerCase()
      for (const v of [name, full]) if (v && v.includes(' ')) addMp(slug, v)
    }
  }
}

// ── 2. Curated party terms (unambiguous multi-word forms + distinctive leaders) ─
// Deliberately NO bare ambiguous words. "peters" is a very common surname,
// and a bare "greens" matches leafy greens / bowling greens — a party match makes
// an item election-relevant, which would let obvious noise past the denylist.
const CURATED = {
  national: ['national party', "national's", 'national government', 'national-led', 'national mp', 'national minister', 'luxon', 'nicola willis'],
  labour:   ['labour party', "labour's", 'labour government', 'labour-led', 'labour mp', 'hipkins'],
  green:    ['green party', "greens'", 'green mp', 'the greens', 'swarbrick', 'chlöe swarbrick', 'chloe swarbrick', 'marama davidson'],
  act:      ['act party', 'act new zealand', "act's", 'act mp', 'seymour', 'david seymour'],
  nzfirst:  ['nz first', 'new zealand first', 'winston peters', 'shane jones'],
  tpm:      ['te pāti māori', 'te pati maori', 'māori party', 'maori party', 'waititi', 'rawiri waititi', 'ngarewa-packer'],
  top:      ['opportunity party', 'top party', 'qiulae wong'],
  // ── Registered extra-parliamentary parties (no MPs) — full names only, never a
  //    bare common word ("conservative", "outdoors", "women's rights" are topics). ──
  alcp:             ['aotearoa legalise cannabis', 'legalise cannabis party', 'alcp', 'maki herbert', 'michael appleby'],
  'animal-justice': ['animal justice party', 'animal justice', 'danette wereta', 'rob mcneil'],
  conservative:     ['conservative party nz', 'conservative party', 'helen houghton'],
  'nz-outdoors':    ['outdoors & freedom', 'outdoors and freedom', 'nz outdoors', 'sue grey'],
  'vision-nz':      ['vision nz', 'vision new zealand', 'hannah tamaki'],
  'womens-rights':  ["women's rights party", 'womens rights party', 'jill ovens'],
  // `independent` has no party phrases — it is populated from the roster with the
  // names of MPs currently sitting as independents.
  independent: [],
}

// Subject-led headline phrases: "National promises…", "ACT announces…" — catches a
// bare party name used as the sentence subject, WITHOUT matching "national team",
// "national park", etc. (only party-name + an action verb qualifies).
const VERBS = ['promises', 'announces', 'pledges', 'unveils', 'proposes', 'reveals', 'commits to', 'vows', 'confirms', 'plans to', 'wants', 'says', 'rules out', 'hits out', 'slams', 'defends', 'backs']
// NB: 'act' and 'top' are deliberately NOT subjects. Both are ordinary English words —
// "the Act says…" (a statute, on a site full of legislation coverage) would tag ACT,
// and "a top official says…" would tag TOP. The curated multi-word forms cover them.
const SUBJECTS = { national: ['national'], labour: ['labour'], nzfirst: ['nz first'], tpm: ['te pāti māori', 'māori party'] }
const PLURAL = { green: ['greens', 'the greens'] }
const PLURAL_VERBS = ['promise', 'announce', 'pledge', 'unveil', 'propose', 'reveal', 'want', 'say', 'rule out', 'hit out', 'slam', 'defend', 'back']

const partyTerms = {}
for (const p of Object.keys(byParty)) {
  const subj = []
  for (const s of SUBJECTS[p] || []) for (const v of VERBS) subj.push(`${s} ${v}`)
  for (const s of PLURAL[p] || []) for (const v of PLURAL_VERBS) subj.push(`${s} ${v}`)
  partyTerms[p] = Array.from(new Set([...(CURATED[p] || []), ...byParty[p], ...subj])).sort()
}

// ── 3. General political-relevance signal (not tied to one party) ──────────────
const POLITICAL_TERMS = [
  'prime minister', 'deputy prime minister', 'cabinet minister', 'associate minister', 'minister', 'cabinet',
  'parliament', 'select committee', 'the beehive', 'coalition government', 'coalition deal', 'opposition leader',
  'question time', 'by-election', 'referendum', 'legislation', 'law change', "government's", 'the government announced',
  'government policy', 'roads of national significance', 'fast-track', 'three strikes', 'treaty principles',
  'te tiriti', 'waitangi tribunal', 'electorate mp', 'list mp',
]

// ── 4. Write the shared module ────────────────────────────────────────────────
const total = Object.values(partyTerms).reduce((n, a) => n + a.length, 0)
const mpTermsObj = Object.fromEntries(
  Object.entries(mpTerms).sort(([a], [b]) => a.localeCompare(b)).map(([slug, set]) => [slug, Array.from(set).sort()])
)
const mpCount = Object.keys(mpTermsObj).length
const out = `/**
 * AUTO-GENERATED by scripts/gen-political-terms.mjs — do not edit by hand.
 * Shared party + political term lists for ingest-news.mjs and ingest-videos.mjs.
 * ${total} party terms across ${Object.keys(partyTerms).length} parties (every current MP by full name)
 * plus ${POLITICAL_TERMS.length} general political signal terms, and per-MP name
 * tags for ${mpCount} MPs (slug → full-name variants) for individual-MP tagging.
 */

export const PARTY_TERMS = ${JSON.stringify(partyTerms, null, 2)}

export const POLITICAL_TERMS = ${JSON.stringify(POLITICAL_TERMS, null, 2)}

export const MP_TERMS = ${JSON.stringify(mpTermsObj, null, 2)}

/** Party slugs mentioned in the text (matched case-insensitively). */
export function tagParties(text) {
  const t = text.toLowerCase()
  return Object.keys(PARTY_TERMS).filter((p) => PARTY_TERMS[p].some((term) => t.includes(term)))
}

/** MP slugs named in the text (case-insensitive, multi-word full name = high precision). */
export function tagMPs(text) {
  const t = text.toLowerCase()
  return Object.keys(MP_TERMS).filter((slug) => MP_TERMS[slug].some((term) => t.includes(term)))
}

/** True if the text is politically relevant — mentions a party or a political signal term. */
export function isPolitical(text, parties) {
  if (parties && parties.length > 0) return true
  const t = text.toLowerCase()
  return POLITICAL_TERMS.some((term) => t.includes(term))
}
`
writeFileSync(join(here, 'political-terms.mjs'), out)
console.log(`wrote political-terms.mjs — ${total} party terms, ${POLITICAL_TERMS.length} political terms, ${mpCount} MPs tagged`)
for (const p of Object.keys(partyTerms)) console.log(`  ${p}: ${partyTerms[p].length}`)
