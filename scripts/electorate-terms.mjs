/**
 * electorate-terms.mjs — which electorate does a news/video item belong to?
 *
 * Used by ingest-news.mjs and ingest-videos.mjs to tag items to seats, which is
 * what feeds each battleground page's news section. Three layers:
 *
 *  1. GENERATED, all 72 seats (from electorates-data.ts): the seat's own name —
 *     bare when it's multi-word and distinctive, qualified as "<name> electorate"
 *     when a single word (Nelson, Napier: city ≠ contest) — plus the sitting
 *     MP's full name.
 *  2. CURATED overrides: the original hand-tuned battleground list, which
 *     encodes ambiguity judgement calls (e.g. bare 'wigram' is safe, bare
 *     'east coast' is not). Curated wins over generated.
 *  3. CANDIDATES (optional, via Supabase): announced 2026 challengers from the
 *     candidate ingest — so coverage naming a challenger tags their battle even
 *     when the seat isn't mentioned. Multi-word names only (precision), and
 *     never from rejected items.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// The original hand-tuned list (closest 2023 races) — judgement calls preserved.
export const CURATED_ELECTORATE_TERMS = {
  'Mt Albert': ['mt albert', 'mount albert', 'helen white'],
  'Nelson': ['nelson electorate', 'rachel boyack'],
  'Te Atatū': ['te atatu', 'te atatū', 'phil twyford'],
  'Banks Peninsula': ['banks peninsula', 'vanessa weenink'],
  'West Coast-Tasman': ['west coast-tasman', 'west coast tasman', 'maureen pugh'],
  'New Lynn': ['new lynn', 'paulo garcia'],
  'Wigram': ['wigram', 'megan woods'],
  'Hutt South': ['hutt south', 'chris bishop'],
  'Taieri': ['taieri', 'ingrid leary'],
  'Ōhāriu': ['ohariu', 'ōhāriu', "greg o'connor"],
  'Mt Roskill': ['mt roskill', 'mount roskill', 'carlos cheung'],
  'Christchurch Central': ['christchurch central', 'duncan webb'],
  'Te Tai Tokerau': ['te tai tokerau', 'mariameno kapa-kingi'],
  'Christchurch East': ['christchurch east', 'reuben davidson'],
  'Rongotai': ['rongotai', 'julie anne genter'],
  'Te Tai Tonga': ['te tai tonga', 'takuta ferris', 'tākuta ferris'],
  'Ikaroa-Rāwhiti': ['ikaroa-rawhiti', 'ikaroa-rāwhiti', 'cushla tangaere-manuel'],
  'Hauraki-Waikato': ['hauraki-waikato', 'hana-rawhiti maipi-clarke'],
  'Wairarapa': ['wairarapa', 'mike butterick'],
  'East Coast': ['east coast electorate', 'dana kirkpatrick'],
  'Palmerston North': ['palmerston north', 'tangi utikere'],
}

// Multi-word seat names that are still too generic to match bare.
const AMBIGUOUS_MULTIWORD = new Set(['east coast', 'west coast-tasman', 'north shore', 'bay of plenty'])

const strip = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Terms for every seat, generated from the site's own electorate dataset. */
export function buildElectorateTerms() {
  const map = {}
  const text = readFileSync(join(root, 'src/constants/electorates-data.ts'), 'utf8')
  for (const line of text.split('\n')) {
    const name = line.match(/name:\s+'([^']+)'/)?.[1]
    if (!name) continue
    const mpName = line.match(/mpName:\s+'([^']+)'/)?.[1]
    const lower = name.toLowerCase()
    const terms = new Set()
    const oneWord = !lower.includes(' ') && !lower.includes('-')
    if (oneWord || AMBIGUOUS_MULTIWORD.has(lower)) terms.add(`${strip(lower)} electorate`)
    else { terms.add(lower); if (strip(lower) !== lower) terms.add(strip(lower)) }
    if (mpName && mpName.includes(' ')) { terms.add(mpName.toLowerCase()); if (strip(mpName) !== mpName.toLowerCase()) terms.add(strip(mpName)) }
    map[name] = [...terms]
  }
  // Curated judgement wins / extends.
  for (const [name, terms] of Object.entries(CURATED_ELECTORATE_TERMS)) {
    map[name] = [...new Set([...(map[name] || []), ...terms])]
  }
  return map
}

/**
 * Add announced challengers' names to their seat's terms (multi-word only,
 * pending or approved — never rejected). Pass the ingest's Supabase client.
 */
export async function addCandidateTerms(map, sb) {
  const { data, error } = await sb
    .from('content_items')
    .select('status, data')
    .eq('type', 'candidate')
    .in('status', ['pending', 'approved'])
  if (error) { console.warn('candidate terms unavailable: ' + error.message); return 0 }
  let added = 0
  for (const r of data || []) {
    const name = r.data?.name, electorate = r.data?.electorate
    if (!name || !electorate || !name.includes(' ')) continue
    if (!map[electorate]) map[electorate] = []
    const t = name.toLowerCase()
    if (!map[electorate].includes(t)) { map[electorate].push(t); added++ }
    const st = strip(name)
    if (st !== t && !map[electorate].includes(st)) map[electorate].push(st)
  }
  return added
}
