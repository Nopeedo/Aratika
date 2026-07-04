/**
 * Election data — official results (Electoral Commission) + the upcoming election.
 *
 * 2023: official count result, sourced from electionresults.govt.nz.
 * 2026: upcoming — scaffolded and ready to populate once the campaign begins and
 *       results come in. The date is NOT yet officially set (the Governor-General
 *       sets it on the PM's advice), so it is shown as approximate/TBC.
 */

import { PartySlug } from '@/types'

export interface PartyResult {
  party: PartySlug
  partyVotes: number
  votePct: number
  electorateSeats: number
  listSeats: number
  seats: number
}

export interface MinorPartyResult {
  name: string
  votePct: number
  partyVotes: number
}

export interface ElectionData {
  year: number
  slug: string
  date: string
  dateApprox?: boolean
  status: 'completed' | 'upcoming'
  headline: string
  totalSeats?: number
  totalPartyVotes?: number
  governmentFormed?: string
  results?: PartyResult[]
  others?: MinorPartyResult[]
  notes?: string[]
  sourceUrl: string
}

/** Left→right political-spectrum order, used for the hemicycle. */
export const SPECTRUM_ORDER: PartySlug[] = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act']

const ELECTION_2023: ElectionData = {
  year: 2023,
  slug: '2023',
  date: '14 October 2023',
  status: 'completed',
  headline: 'A National-led coalition replaced Labour after six years in government.',
  totalSeats: 122,
  totalPartyVotes: 2_851_211,
  governmentFormed: 'National – ACT – New Zealand First coalition',
  results: [
    { party: 'national', partyVotes: 1_085_851, votePct: 38.08, electorateSeats: 43, listSeats: 5,  seats: 48 },
    { party: 'labour',   partyVotes: 767_540,   votePct: 26.91, electorateSeats: 17, listSeats: 17, seats: 34 },
    { party: 'green',    partyVotes: 330_907,   votePct: 11.60, electorateSeats: 3,  listSeats: 12, seats: 15 },
    { party: 'act',      partyVotes: 246_473,   votePct: 8.64,  electorateSeats: 2,  listSeats: 9,  seats: 11 },
    { party: 'nzfirst',  partyVotes: 173_553,   votePct: 6.08,  electorateSeats: 0,  listSeats: 8,  seats: 8 },
    { party: 'tpm',      partyVotes: 87_844,    votePct: 3.08,  electorateSeats: 6,  listSeats: 0,  seats: 6 },
  ],
  others: [
    { name: 'The Opportunities Party (TOP)', votePct: 2.22, partyVotes: 63_344 },
    { name: 'New Zealand Loyal',             votePct: 1.20, partyVotes: 34_478 },
    { name: 'Other registered parties',      votePct: 2.15, partyVotes: 61_221 },
  ],
  notes: [
    'These are the official count results (122 seats). A by-election in Port Waikato on 25 November 2023 — held after a candidate died during the campaign — added one National seat, bringing the 54th Parliament to 123 seats (National 49).',
    'Te Pāti Māori won 6 electorate seats, more than its party-vote entitlement, creating a small overhang.',
  ],
  sourceUrl: 'https://www.electionresults.govt.nz/electionresults_2023/',
}

const ELECTION_2026: ElectionData = {
  year: 2026,
  slug: '2026',
  date: 'Saturday 7 November 2026',
  status: 'upcoming',
  headline: 'The next chance for New Zealanders to choose their Parliament.',
  notes: [
    'The election is on Saturday 7 November 2026, announced by the Prime Minister on 21 January 2026.',
    'Results, candidates and the parties contesting will appear here as the campaign unfolds and on election night.',
  ],
  sourceUrl: 'https://www.elections.nz',
}

export const ELECTIONS: ElectionData[] = [ELECTION_2026, ELECTION_2023]

export const ELECTION_SLUGS = ELECTIONS.map((e) => e.slug)

export function getElection(slug: string): ElectionData | undefined {
  return ELECTIONS.find((e) => e.slug === slug)
}

/** The most recent completed election — the current baseline to compare against. */
export const BASELINE_ELECTION = ELECTION_2023

/** Confirmed date of the next election (matches the homepage countdown). */
export const NEXT_ELECTION_DATE = '2026-11-07'
