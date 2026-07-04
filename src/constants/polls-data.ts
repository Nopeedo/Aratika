/**
 * polls-data.ts — a SOURCED snapshot of published 2026 party-vote polls, plus
 * pure helpers to derive a poll-of-polls average and an MMP seat projection.
 *
 * IMPORTANT: every number here is a real, published, dated, attributed figure —
 * nothing is estimated or invented. The poll-of-polls and seat projection are
 * transparent computations (simple average; Sainte-Laguë) over these sourced
 * polls, clearly labelled as such — Aratika does not predict the result.
 *
 * Refresh RECENT_POLLS (and POLLS_AS_AT) as new polls are published.
 */

import type { PartySlug } from '@/types'

export interface Poll {
  pollster:  string
  fieldwork: string   // human-readable fieldwork date range
  date:      string   // ISO date of the last fieldwork day (recency/sorting)
  sourceUrl: string
  parties:   Partial<Record<PartySlug, number>>  // party-vote %
}

// Compiled from the published-polls aggregate (which cites each pollster's release).
export const POLLS_AS_AT   = '21 June 2026'
export const POLLS_SOURCE  = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election'

// The most recent poll from each of the five main companies (party-vote %).
export const RECENT_POLLS: Poll[] = [
  { pollster: 'Roy Morgan', fieldwork: '25 May – 21 Jun 2026', date: '2026-06-21', sourceUrl: 'https://www.roymorgan.com/findings/10271-nz-national-voting-intention-june-2026', parties: { national: 31, labour: 25.5, green: 13.5, act: 9.5, nzfirst: 10.5, tpm: 3, top: 6.5 } },
  { pollster: '1News–Verian', fieldwork: '13–17 Jun 2026', date: '2026-06-17', sourceUrl: POLLS_SOURCE, parties: { national: 29, labour: 32, green: 13, act: 6, nzfirst: 11, tpm: 1.8, top: 4.6 } },
  { pollster: 'The Post–Freshwater', fieldwork: '5–11 Jun 2026', date: '2026-06-11', sourceUrl: POLLS_SOURCE, parties: { national: 29, labour: 35, green: 10, act: 8, nzfirst: 12, tpm: 2 } },
  { pollster: 'Talbot Mills', fieldwork: '1–10 Jun 2026', date: '2026-06-10', sourceUrl: POLLS_SOURCE, parties: { national: 29, labour: 34, green: 13, act: 6, nzfirst: 12, tpm: 2.6, top: 3.3 } },
  { pollster: 'Taxpayers’ Union–Curia', fieldwork: '4–8 Jun 2026', date: '2026-06-08', sourceUrl: POLLS_SOURCE, parties: { national: 30.1, labour: 32.2, green: 11.5, act: 7.8, nzfirst: 11.4, tpm: 3.1, top: 3.2 } },
]

export const POLL_PARTIES: PartySlug[] = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm', 'top']

/** Poll of polls — simple mean per party across RECENT_POLLS (over the polls that report it). */
export function pollOfPolls(): { slug: PartySlug; pct: number }[] {
  return POLL_PARTIES.map((slug) => {
    const vals = RECENT_POLLS.map((p) => p.parties[slug]).filter((v): v is number => typeof v === 'number')
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return { slug, pct: Math.round(avg * 10) / 10 }
  }).sort((a, b) => b.pct - a.pct)
}

const THRESHOLD = 5
// Parties under 5% that still qualify because they hold electorate seats (the "lifeboat").
const ELECTORATE_LIFEBOAT: PartySlug[] = ['tpm']
export const PROJECTION_SEATS = 120
export const MAJORITY_SEATS   = 61

/** MMP seat projection — Sainte-Laguë over qualifying parties' poll-of-polls averages. */
export function seatProjection(): { slug: PartySlug; seats: number; pct: number }[] {
  const pop = pollOfPolls()
  const qualifying = pop.filter((p) => p.pct >= THRESHOLD || ELECTORATE_LIFEBOAT.includes(p.slug))
  const seats: Record<string, number> = Object.fromEntries(qualifying.map((p) => [p.slug, 0]))
  for (let s = 0; s < PROJECTION_SEATS; s++) {
    let best = qualifying[0].slug
    let bestQ = -1
    for (const p of qualifying) {
      const q = p.pct / (2 * seats[p.slug] + 1)
      if (q > bestQ) { bestQ = q; best = p.slug }
    }
    seats[best]++
  }
  return qualifying.map((p) => ({ slug: p.slug, seats: seats[p.slug], pct: p.pct })).sort((a, b) => b.seats - a.seats)
}

/** Preferred Prime Minister — latest published figures. */
export const PREFERRED_PM = {
  asOf:      '13–17 June 2026',
  pollster:  '1News–Verian',
  sourceUrl: POLLS_SOURCE,
  candidates: [
    { name: 'Christopher Luxon', party: 'national' as PartySlug, pct: 18 },
    { name: 'Chris Hipkins',     party: 'labour'   as PartySlug, pct: 16 },
    { name: 'Winston Peters',    party: 'nzfirst'  as PartySlug, pct: 10 },
    { name: 'Chlöe Swarbrick',   party: 'green'    as PartySlug, pct: 6 },
    { name: 'David Seymour',     party: 'act'      as PartySlug, pct: 4 },
  ],
}

// Participation context — official figures from the 2023 General Election (Electoral Commission).
export const TURNOUT_2023      = 78.2   // % of enrolled voters who voted
export const ENROLMENT_2023    = 94.7   // % of eligible people enrolled
export const ENROLMENT_LIVE_URL = 'https://elections.nz/stats-and-research/enrolment-statistics'
export const PARTICIPATION_SOURCE = 'https://elections.nz/democracy-in-nz/historical-events/2023-general-election/voter-turnout-statistics'
