/**
 * Electorate → MP / party mapping for the interactive map.
 *
 * ── Credibility note ───────────────────────────────────────────────────────
 * The boundary GEOMETRY comes from official Stats NZ GeoJSON (General &
 * Māori Electorates 2020 — the boundaries used for the 2023 election that
 * elected the current 54th Parliament).
 *
 * This file holds the per-electorate METADATA: which party/MP currently holds
 * each seat. Entries are only added once verified against the Electoral
 * Commission's official 2023 results. Electorates without a verified entry
 * render in a neutral colour and show "MP data pending" — we never guess a
 * seat holder.
 *
 * Keyed by a normalised electorate name so it matches whatever the GeoJSON
 * "name" property turns out to be (macrons, spacing, and case are stripped).
 * ───────────────────────────────────────────────────────────────────────────
 */

import { PartySlug } from '@/types'

export interface ElectorateInfo {
  name:       string                 // display name, e.g. 'Botany'
  type:       'general' | 'maori'
  region?:    string
  party:      PartySlug | null       // holding party (null = not yet verified)
  mpSlug?:    string                 // links to /mps/[slug] if a profile exists
  mpName?:    string
  majority?:  number                 // winning margin (example until verified)
  verified:   boolean                // true once cross-checked vs elections.nz
}

/** Normalise an electorate name to a stable key (handles macrons, case, spacing). */
export function normalizeElectorateKey(name: string): string {
  const combiningMarks = new RegExp('[\\u0300-\\u036f]', 'g')
  return name
    .toLowerCase()
    .normalize('NFD').replace(combiningMarks, '') // strip diacritics/macrons
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Verified electorate data ───────────────────────────────────────────────
// Source: Electoral Commission official 2023 General Election results
// (electionresults.govt.nz — "Electorate Status": leading candidate + margin).
//
// Note on currency: this reflects the 2023 General Election. Port Waikato's 2023
// vote was held as a by-election (a candidate died during the campaign) and is
// included here. Subsequent by-elections / list changes after 2023 are to be
// reconciled during the live Parliament API integration.
//
// MP profile links are derived from mpName at render time (see the map panel),
// so an electorate auto-links once that MP has a profile in mps-data.ts.

const G = 'general' as const
const M = 'maori' as const

const RAW: ElectorateInfo[] = [
  // ── General electorates (65) ──
  { name: 'Auckland Central',     type: G, party: 'green',    mpName: 'Chlöe Swarbrick', mpSlug: 'chle-swarbrick', majority: 3896,  verified: true },
  { name: 'Banks Peninsula',      type: G, party: 'national', mpName: 'Vanessa Weenink',        majority: 396,   verified: true },
  { name: 'Bay of Plenty',        type: G, party: 'national', mpName: 'Tom Rutherford',         majority: 15405, verified: true },
  { name: 'Botany',               type: G, party: 'national', mpName: 'Christopher Luxon', mpSlug: 'christopher-luxon', majority: 16323, verified: true },
  { name: 'Christchurch Central', type: G, party: 'labour',   mpName: 'Duncan Webb',            majority: 1841,  verified: true },
  { name: 'Christchurch East',    type: G, party: 'labour',   mpName: 'Reuben Davidson',        majority: 2397,  verified: true },
  { name: 'Coromandel',           type: G, party: 'national', mpName: 'Scott Simpson',          majority: 17349, verified: true },
  { name: 'Dunedin',              type: G, party: 'labour',   mpName: 'Rachel Brooking',        majority: 7980,  verified: true },
  { name: 'East Coast',           type: G, party: 'national', mpName: 'Dana Kirkpatrick',       majority: 3199,  verified: true },
  { name: 'East Coast Bays',      type: G, party: 'national', mpName: 'Erica Stanford',         majority: 20353, verified: true },
  { name: 'Epsom',                type: G, party: 'act',      mpName: 'David Seymour',          majority: 8142,  verified: true },
  { name: 'Hamilton East',        type: G, party: 'national', mpName: 'Ryan Hamilton',          majority: 5060,  verified: true },
  { name: 'Hamilton West',        type: G, party: 'national', mpName: 'Tama Potaka',            majority: 6488,  verified: true },
  { name: 'Hutt South',           type: G, party: 'national', mpName: 'Chris Bishop',           majority: 1332,  verified: true },
  { name: 'Ilam',                 type: G, party: 'national', mpName: 'Hamish Campbell',        majority: 7830,  verified: true },
  { name: 'Invercargill',         type: G, party: 'national', mpName: 'Penny Simmonds',         majority: 9874,  verified: true },
  { name: 'Kaikōura',             type: G, party: 'national', mpName: 'Stuart Smith',           majority: 11412, verified: true },
  { name: 'Kaipara ki Mahurangi', type: G, party: 'national', mpName: 'Chris Penk',             majority: 19459, verified: true },
  { name: 'Kelston',              type: G, party: 'labour',   mpName: 'Carmel Sepuloni',        majority: 4396,  verified: true },
  { name: 'Mana',                 type: G, party: 'labour',   mpName: 'Barbara Edmonds',        majority: 7324,  verified: true },
  { name: 'Māngere',              type: G, party: 'labour',   mpName: 'Lemauga Lydia Sosene',   majority: 11712, verified: true },
  { name: 'Manurewa',             type: G, party: 'labour',   mpName: 'Arena Williams',         majority: 7113,  verified: true },
  { name: 'Maungakiekie',         type: G, party: 'national', mpName: 'Greg Fleming',           majority: 4617,  verified: true },
  { name: 'Mt Albert',            type: G, party: 'labour',   mpName: 'Helen White',            majority: 18,    verified: true },
  { name: 'Mt Roskill',           type: G, party: 'national', mpName: 'Carlos Cheung',          majority: 1564,  verified: true },
  { name: 'Napier',               type: G, party: 'national', mpName: 'Katie Nimon',            majority: 8909,  verified: true },
  { name: 'Nelson',               type: G, party: 'labour',   mpName: 'Rachel Boyack',          majority: 26,    verified: true },
  { name: 'New Lynn',             type: G, party: 'national', mpName: 'Paulo Garcia',           majority: 1013,  verified: true },
  { name: 'New Plymouth',         type: G, party: 'national', mpName: 'David MacLeod',          majority: 6991,  verified: true },
  { name: 'North Shore',          type: G, party: 'national', mpName: 'Simon Watts',            majority: 16330, verified: true },
  { name: 'Northcote',            type: G, party: 'national', mpName: 'Dan Bidois',             majority: 9270,  verified: true },
  { name: 'Northland',            type: G, party: 'national', mpName: 'Grant McCallum',         majority: 6087,  verified: true },
  { name: 'Ōhāriu',               type: G, party: 'labour',   mpName: "Greg O'Connor",          majority: 1260,  verified: true },
  { name: 'Ōtaki',                type: G, party: 'national', mpName: 'Tim Costley',            majority: 6271,  verified: true },
  { name: 'Pakuranga',            type: G, party: 'national', mpName: 'Simeon Brown',           majority: 18710, verified: true },
  { name: 'Palmerston North',     type: G, party: 'labour',   mpName: 'Tangi Utikere',          majority: 3087,  verified: true },
  { name: 'Panmure-Ōtāhuhu',      type: G, party: 'labour',   mpName: 'Jenny Salesa',           majority: 7970,  verified: true },
  { name: 'Papakura',             type: G, party: 'national', mpName: 'Judith Collins',         majority: 13519, verified: true },
  { name: 'Port Waikato',         type: G, party: 'national', mpName: 'Andrew Bayly',           verified: true }, // 2023 by-election
  { name: 'Rangitata',            type: G, party: 'national', mpName: 'James Meager',           majority: 10846, verified: true },
  { name: 'Rangitīkei',           type: G, party: 'national', mpName: 'Suze Redmayne',          majority: 9785,  verified: true },
  { name: 'Remutaka',             type: G, party: 'labour',   mpName: 'Chris Hipkins',          majority: 8859,  verified: true },
  { name: 'Rongotai',             type: G, party: 'green',    mpName: 'Julie Anne Genter',      majority: 2717,  verified: true },
  { name: 'Rotorua',              type: G, party: 'national', mpName: 'Todd McClay',            majority: 8923,  verified: true },
  { name: 'Selwyn',               type: G, party: 'national', mpName: 'Nicola Grigg',           majority: 19782, verified: true },
  { name: 'Southland',            type: G, party: 'national', mpName: 'Joseph Mooney',          majority: 17211, verified: true },
  { name: 'Taieri',               type: G, party: 'labour',   mpName: 'Ingrid Leary',           majority: 1443,  verified: true },
  { name: 'Takanini',             type: G, party: 'national', mpName: 'Rima Nakhle',            majority: 8775,  verified: true },
  { name: 'Tāmaki',               type: G, party: 'act',      mpName: 'Brooke van Velden',      majority: 4158,  verified: true },
  { name: 'Taranaki-King Country',type: G, party: 'national', mpName: 'Barbara Kuriger',        majority: 14355, verified: true },
  { name: 'Taupō',                type: G, party: 'national', mpName: 'Louise Upston',          majority: 16505, verified: true },
  { name: 'Tauranga',             type: G, party: 'national', mpName: 'Sam Uffindell',          majority: 9370,  verified: true },
  { name: 'Te Atatū',             type: G, party: 'labour',   mpName: 'Phil Twyford',           majority: 131,   verified: true },
  { name: 'Tukituki',             type: G, party: 'national', mpName: 'Catherine Wedd',         majority: 10118, verified: true },
  { name: 'Upper Harbour',        type: G, party: 'national', mpName: 'Cameron Brewer',         majority: 11192, verified: true },
  { name: 'Waikato',              type: G, party: 'national', mpName: 'Tim van de Molen',       majority: 18548, verified: true },
  { name: 'Waimakariri',          type: G, party: 'national', mpName: 'Matt Doocey',            majority: 13010, verified: true },
  { name: 'Wairarapa',            type: G, party: 'national', mpName: 'Mike Butterick',         majority: 2816,  verified: true },
  { name: 'Waitaki',              type: G, party: 'national', mpName: 'Miles Anderson',         majority: 12151, verified: true },
  { name: 'Wellington Central',   type: G, party: 'green',    mpName: 'Tamatha Paul',           majority: 6066,  verified: true },
  { name: 'West Coast-Tasman',    type: G, party: 'national', mpName: 'Maureen Pugh',           majority: 1017,  verified: true },
  { name: 'Whanganui',            type: G, party: 'national', mpName: 'Carl Bates',             majority: 5512,  verified: true },
  { name: 'Whangaparāoa',         type: G, party: 'national', mpName: 'Mark Mitchell',          majority: 23376, verified: true },
  { name: 'Whangārei',            type: G, party: 'national', mpName: 'Shane Reti',             majority: 11424, verified: true },
  { name: 'Wigram',               type: G, party: 'labour',   mpName: 'Megan Woods',            majority: 1179,  verified: true },

  // ── Māori electorates (7) ──
  { name: 'Hauraki-Waikato',      type: M, party: 'tpm',      mpName: 'Hana-Rawhiti Maipi-Clarke', majority: 2911,  verified: true },
  { name: 'Ikaroa-Rāwhiti',       type: M, party: 'labour',   mpName: 'Cushla Tangaere-Manuel', majority: 2874,  verified: true },
  { name: 'Tāmaki Makaurau',      type: M, party: 'tpm',      mpName: 'Oriini Kaipara',         verified: true }, // 2025 by-election (Takutai Tarsh Kemp won 2023, d. 2025)
  { name: 'Te Tai Hauāuru',       type: M, party: 'tpm',      mpName: 'Debbie Ngarewa-Packer',  majority: 9162,  verified: true },
  { name: 'Te Tai Tokerau',       type: M, party: 'tpm',      mpName: 'Mariameno Kapa-Kingi',   majority: 517,   verified: true },
  { name: 'Te Tai Tonga',         type: M, party: 'tpm',      mpName: 'Tākuta Ferris',          majority: 2824,  verified: true },
  { name: 'Waiariki',             type: M, party: 'tpm',      mpName: 'Rawiri Waititi',         majority: 15891, verified: true },
]

export const ELECTORATES: Record<string, ElectorateInfo> = Object.fromEntries(
  RAW.map((e) => [normalizeElectorateKey(e.name), e]),
)

/** Look up electorate metadata by any name spelling. Returns null if not yet populated. */
export function getElectorate(name: string): ElectorateInfo | null {
  return ELECTORATES[normalizeElectorateKey(name)] ?? null
}

// ─── GeoJSON property-name candidates ───────────────────────────────────────
// Stats NZ layers vary in their name field. The map tries these in order.
export const ELECTORATE_NAME_PROPS = [
  'name',
  'NAME',
  'GED2020_V1_00_NAME',   // General Electorate 2020
  'MED2020_V1_00_NAME',   // Māori Electorate 2020
  'GED2020_NAME',
  'MED2020_NAME',
  'electorate',
  'Electorate',
]

/** Extract the electorate display name from a GeoJSON feature's properties. */
export function electorateNameFromProps(props: Record<string, unknown> | null | undefined): string {
  if (!props) return 'Unknown electorate'
  for (const key of ELECTORATE_NAME_PROPS) {
    const v = props[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return 'Unknown electorate'
}
