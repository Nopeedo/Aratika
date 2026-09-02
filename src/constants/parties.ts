import { PartySlug } from '@/types'

// ─── Party Display Names ──────────────────────────────────────────────────────

export const PARTY_NAMES: Record<PartySlug, { short: string; full: string }> = {
  national: { short: 'National', full: 'New Zealand National Party' },
  labour:   { short: 'Labour',   full: 'New Zealand Labour Party' },
  act:      { short: 'ACT',      full: 'ACT New Zealand' },
  green:    { short: 'Green',    full: 'Green Party of Aotearoa New Zealand' },
  nzfirst:  { short: 'NZ First', full: 'New Zealand First' },
  tpm:      { short: 'Te Pāti Māori', full: 'Te Pāti Māori' },
  top:      { short: 'TOP', full: 'The Opportunity Party' },
  'womens-rights': { short: 'Women’s Rights', full: 'The New Zealand Women’s Rights Party' },
  // Names exactly as they sit on the Electoral Commission register, because
  // that is what appears on the ballot paper.
  'alliance': { short: 'Alliance', full: 'Alliance Party of Aotearoa New Zealand' },
  'free-palestine': { short: 'Free Palestine', full: 'Free Palestine' },
  'nz-loyal': { short: 'NZ Loyal', full: 'New Zealand Loyal' },
  'te-tai-tokerau-party': { short: 'Te Tai Tokerau', full: 'Te Tai Tokerau Party' },
  'animal-justice': { short: 'Animal Justice', full: 'Animal Justice Party Aotearoa New Zealand' },
  'alcp': { short: 'ALCP', full: 'Aotearoa Legalise Cannabis Party' },
  'conservative': { short: 'Conservative', full: 'Conservative Party NZ' },
  'nz-outdoors': { short: 'Outdoors & Freedom', full: 'NZ Outdoors & Freedom Party' },
  'vision-nz': { short: 'Vision NZ', full: 'Vision New Zealand' },
  independent: { short: 'Independent', full: 'Independent' },
}

// ─── Party Colours ───────────────────────────────────────────────────────────
// Sourced from official party brand guidelines

// Colours refined for white backgrounds per design handoff.
// Source: Official NZ party brand guidelines.
export const PARTY_COLORS: Record<PartySlug, { bg: string; text: string; light: string }> = {
  national:    { bg: '#0A5BA8', text: '#ffffff', light: '#e8f0f9' },
  labour:      { bg: '#D5202B', text: '#ffffff', light: '#faeaea' },
  act:         { bg: '#F5C518', text: '#1c1605', light: '#fef9e1' },
  green:       { bg: '#1F8A4C', text: '#ffffff', light: '#e6f4ec' },
  nzfirst:     { bg: '#181a1f', text: '#ffffff', light: '#ebebeb' },
  tpm:         { bg: '#B11226', text: '#ffffff', light: '#f8e6e8' },
  top:         { bg: '#00E5CC', text: '#06302c', light: '#e5fdfc' },
  'womens-rights': { bg: '#6B3FA0', text: '#ffffff', light: '#efe7f6' },
  'alliance': { bg: '#821918', text: '#ffffff', light: '#f5e8e8' },
  'free-palestine': { bg: '#0F4225', text: '#ffffff', light: '#e7efea' },
  'nz-loyal': { bg: '#B38600', text: '#ffffff', light: '#fbf3dd' },
  'te-tai-tokerau-party': { bg: '#734930', text: '#ffffff', light: '#f1ebe6' },
  'animal-justice': { bg: '#159A7B', text: '#ffffff', light: '#e7f5f0' },
  'alcp': { bg: '#3E9B35', text: '#ffffff', light: '#ecf6ea' },
  'conservative': { bg: '#1FA39A', text: '#ffffff', light: '#e7f6f4' },
  'nz-outdoors': { bg: '#5F8D2E', text: '#ffffff', light: '#eef4e6' },
  'vision-nz': { bg: '#163A66', text: '#ffffff', light: '#e7ecf3' },
  independent: { bg: '#6B7280', text: '#ffffff', light: '#f3f4f6' },
}

// ─── Current Parliament (54th) Seat Count ────────────────────────────────────
// Source: Electoral Commission — 2023 General Election official results

export const CURRENT_SEATS: Record<PartySlug, number> = {
  national:    49,
  labour:      34,
  act:         11,
  green:       15,
  nzfirst:      8,
  tpm:          6,
  top:          0,
  'womens-rights': 0,
  // 2023 General Election result, the basis every seat count on this site uses.
  // All four registered in 2026 and so contested no seats in 2023. Te Tai
  // Tokerau Party's founder sits in this Parliament, but she was elected for
  // Te Pāti Māori — crediting the seat here would misstate the 2023 result and
  // double-count it against them.
  'alliance': 0,
  'free-palestine': 0,
  'nz-loyal': 0,
  'te-tai-tokerau-party': 0,
  'animal-justice': 0,
  'alcp': 0,
  'conservative': 0,
  'nz-outdoors': 0,
  'vision-nz': 0,
  independent:  0,
}

export const TOTAL_SEATS = 123  // 54th Parliament — overhang seats

// ─── Coalition Status ────────────────────────────────────────────────────────

export const GOVERNING_PARTIES: PartySlug[] = ['national', 'act', 'nzfirst']
export const OPPOSITION_PARTIES: PartySlug[] = ['labour', 'green', 'tpm']

export const PARTY_STATUS: Record<PartySlug, 'governing' | 'opposition' | 'support' | 'none'> = {
  national:    'governing',
  act:         'governing',
  nzfirst:     'governing',
  labour:      'opposition',
  green:       'opposition',
  tpm:         'opposition',
  top:         'none',
  'womens-rights': 'none',
  'alliance': 'none',
  'free-palestine': 'none',
  'nz-loyal': 'none',
  'te-tai-tokerau-party': 'none',
  'animal-justice': 'none',
  'alcp': 'none',
  'conservative': 'none',
  'nz-outdoors': 'none',
  'vision-nz': 'none',
  independent: 'none',
}

// ─── Party Order (by seats, descending) ──────────────────────────────────────

export const PARTY_ORDER: PartySlug[] = [
  'national',
  'labour',
  'green',
  'act',
  'nzfirst',
  'tpm',
]

// ─── 2026 contesting field — fair, registration-based inclusion ───────────────
// Inclusion is decided by ELECTORAL COMMISSION REGISTRATION, not by polling — so
// every party able to contest the party vote gets equal structural presence, and
// smaller parties are never erased by poll thresholds. Poll-derived figures are
// labelled as such and never inferred for a party polls don't measure.
// The parliamentary group is ordered by current seats (a fact). The contesting
// group is stored alphabetically, which is the order the ones pollsters do not
// break out are displayed in; where a party has a published poll reading, the
// election hub orders by that (see orderForDisplay in parties-contesting.tsx).

export const PARLIAMENTARY_PARTIES: PartySlug[] = [
  'national', 'labour', 'green', 'act', 'nzfirst', 'tpm',
]

export const NON_PARLIAMENTARY_CONTESTING: PartySlug[] = [
  'alcp', 'alliance', 'animal-justice', 'conservative', 'free-palestine', 'nz-loyal',
  'nz-outdoors', 'te-tai-tokerau-party', 'top', 'vision-nz', 'womens-rights',
]

// Every registered party contesting 2026 (excludes 'independent').
export const CONTESTING_PARTIES: PartySlug[] = [
  ...PARLIAMENTARY_PARTIES, ...NON_PARLIAMENTARY_CONTESTING,
]
