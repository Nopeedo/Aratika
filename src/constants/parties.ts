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
