/**
 * Extended MP data for individual profile pages.
 *
 * ── Credibility note ───────────────────────────────────────────────────────
 * Fields are split into two categories:
 *
 *   VERIFIED  — biographical facts that are a matter of public record
 *               (name, role, electorate, career, key dates). Sourced from
 *               parliament.nz and public record. Shown to users normally.
 *
 *   EXAMPLE   — dynamic data (sponsored bills, voting records, committee
 *               memberships, declared interests). These are PLACEHOLDERS for
 *               layout purposes only and are flagged in the UI with a visible
 *               "example data" banner. They will be replaced wholesale by the
 *               live NZ Parliament API in the Phase 2 integration.
 *
 * This mirrors the extensible Record<slug, …> pattern used in parties-data.ts
 * so adding the remaining ~122 MPs later is a pure data exercise.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { PartySlug } from '@/types'
import { GENERATED_MPS } from './mps-generated'
import { MP_DETAIL } from './mps-detail'
import { GENERATED_DETAIL } from './mps-detail-generated'
import { MP_PHOTOS } from './mp-photos'

export interface SponsoredBillExample {
  title:  string
  stage:  string
  date:   string   // ISO
}

export interface VoteExample {
  bill:   string
  vote:   'Aye' | 'No' | 'Abstain'
  result: 'Passed' | 'Defeated'
  date:   string   // ISO
}

export interface MPProfile {
  // ── VERIFIED (public record / parliament.nz) ──────────────────────────────
  slug:              string
  name:              string
  fullName:          string
  party:             PartySlug
  role:              'electorate' | 'list'
  electorate?:       string          // electorate MPs only
  status:            'active' | 'former'
  title?:            string          // e.g. 'Prime Minister'
  enteredParliament?: number         // year first elected
  bornYear?:         number
  bornPlace?:        string
  priorCareer?:      string
  bio?:              string          // short biography, public record
  photo?:            string          // headshot path (local /public)
  photoCredit?:      string          // author/source for attribution
  photoLicense?:     string          // licence (e.g. 'CC0 1.0')
  photoSourceUrl?:   string          // link to the original image record
  parliamentUrl:     string          // profile on parliament.nz
  email?:            string
  website?:          string

  // ── DETAILED (optional — present for fully-built profiles, else pending API) ─
  portfolios?:        string[]       // ministerial portfolios held
  committees?:        string[]       // select committee memberships
  declaredInterests?: string[]       // register of pecuniary interests
  electorateMajority?: number        // winning margin (last election)
  sponsoredBills?:    SponsoredBillExample[]
  recentVotes?:       VoteExample[]
}

// ─── MP profiles ────────────────────────────────────────────────────────────
// Christopher Luxon is the fully-built exemplar (rich detail). The other ~121
// MPs are generated as verified basic profiles in mps-generated.ts and merged
// below; their detailed sections show "pending Parliament API" until built out.

const LUXON: MPProfile = {
    // ── Verified ──
    slug:              'christopher-luxon',
    name:              'Christopher Luxon',
    fullName:          'Christopher Mark Luxon',
    party:             'national',
    role:              'electorate',
    electorate:        'Botany',
    status:            'active',
    title:             'Prime Minister',
    enteredParliament: 2020,
    bornYear:          1970,
    bornPlace:         'Christchurch',
    priorCareer:       'Former Chief Executive of Air New Zealand (2013–2019); earlier a senior executive at Unilever, working across Canada, the United States and Europe.',
    bio:
      'Christopher Luxon is the Prime Minister of New Zealand and leader of the New Zealand ' +
      'National Party. He was first elected as the Member of Parliament for Botany at the 2020 ' +
      'general election and became leader of the National Party in November 2021. Following the ' +
      'October 2023 general election, he formed a coalition government with ACT New Zealand and ' +
      'New Zealand First, and was sworn in as Prime Minister on 27 November 2023. Before entering ' +
      'politics, he led Air New Zealand as Chief Executive and held senior international roles at Unilever.',
    parliamentUrl:     'https://www.parliament.nz/en/mps-and-electorates/members-of-parliament/luxon-christopher',
    website:           'https://www.national.org.nz',
    photo:             '/mps/christopher-luxon.jpg',
    photoCredit:       'Office of the Governor-General of New Zealand',
    photoLicense:      'CC0 1.0 (Public Domain)',
    photoSourceUrl:    'https://commons.wikimedia.org/wiki/File:Christopher_Luxon_2025_(mid_cropped).jpg',

    // ── Roles (real — Prime Minister's portfolios) ──
    portfolios: [
      'Prime Minister',
      'Minister for National Security and Intelligence',
      'Minister Responsible for Ministerial Services',
      'National Party Leader',
    ],
    electorateMajority: 16323,
    // Sponsored bills, voting record and declared interests follow with the
    // Parliament API integration — not shown as fabricated placeholders.
}

// Manually added: present in the official count (123 MPs) but not rendered in
// the parliament.nz list table at extraction time (virtualised row). Verified
// current — Judith Collins, National MP for Papakura.
const CURATED: MPProfile[] = [
  {
    slug: 'judith-collins', name: 'Judith Collins', fullName: 'Judith Collins',
    party: 'national', role: 'electorate', electorate: 'Papakura', status: 'active',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/members-of-parliament/collins-judith',
  },
]

// ── Assemble: generated basics + curated additions + Luxon's rich profile ──
export const MP_PROFILES: Record<string, MPProfile> = (() => {
  const map: Record<string, MPProfile> = {}
  for (const mp of GENERATED_MPS) map[mp.slug] = mp
  for (const mp of CURATED) map[mp.slug] = mp
  // Layer enriched detail (scraped from parliament.nz) over the basic profiles.
  // Generated backbench detail first, then hand-built executive detail (wins on overlap).
  for (const [slug, detail] of Object.entries(GENERATED_DETAIL)) {
    if (map[slug]) map[slug] = { ...map[slug], ...detail }
  }
  for (const [slug, detail] of Object.entries(MP_DETAIL)) {
    if (map[slug]) map[slug] = { ...map[slug], ...detail }
  }
  map[LUXON.slug] = LUXON   // rich profile overrides the generated basic one

  // Merge in freely-licensed Wikimedia Commons portraits (with attribution).
  // Does not override a profile that already has its own photo (e.g. Luxon).
  for (const slug in MP_PHOTOS) {
    const p = MP_PHOTOS[slug]
    if (map[slug] && !map[slug].photo) {
      map[slug] = {
        ...map[slug],
        photo: p.photo,
        photoCredit: p.credit,
        photoLicense: p.license,
        photoSourceUrl: p.sourceUrl,
      }
    }
  }
  return map
})()

// All MP slugs (for generateStaticParams + directory)
export const MP_SLUGS: string[] = Object.keys(MP_PROFILES)
