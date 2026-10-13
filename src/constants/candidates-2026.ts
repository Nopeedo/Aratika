/**
 * 2026 electorate candidates — populated DURING the campaign.
 *
 * Candidates are selected by parties and confirmed when nominations close
 * (about a month before election day), so this is intentionally empty for now.
 * As parties announce candidates, add an array per electorate (keyed by the
 * normalised electorate slug). Nothing here is guessed — only confirmed,
 * sourced candidates should be added.
 *
 * Example shape (do not add until confirmed):
 *   'te-atatu': [
 *     { name: 'Jane Doe', party: 'national', confirmed: true,
 *       bio: '…', priorities: ['…'], keyPolicies: [{ title: '…', detail: '…' }],
 *       bills: ['…'] },
 *   ]
 */

import { PartySlug } from '@/types'

export interface Candidate2026 {
  name: string
  party: PartySlug | 'independent'
  /**
   * The affiliation to SHOW, when it is not a party this site profiles.
   *
   * The Electoral Commission's 2026 field is 404 candidates for the 17
   * registered parties, 48 independents, and 17 standing for parties that are
   * NOT registered — Money Free Party NZ, Te Pāti Hira, Economic Euthenics,
   * Your PIC Party and the rest. Those 17 have no PartySlug, because inclusion
   * on this site is by registration (see /party-inclusion), so they get no
   * tile, no colour and no profile link.
   *
   * They are still standing, though, and the previous behaviour dropped any
   * candidate whose label did not map — which is the same silent-drop that hid
   * 30 of 321 candidates until the August 2026 audit. So they carry
   * party: 'independent' structurally, meaning "no registered party", with the
   * stated affiliation here. Its PRESENCE is also what distinguishes them from
   * a true independent, who has none.
   */
  partyLabel?: string
  incumbent?: boolean
  mpSlug?: string
  bio?: string
  priorities?: string[]
  keyPolicies?: { title: string; detail: string }[]
  bills?: string[]
  confirmed: boolean
  /**
   * The candidate ingest's own source_id (`cand:<seat>|<name>`), present on
   * live-ingested candidates only. It is what content tagging keys on, so it is
   * how a candidate joins to the coverage naming them — see
   * scripts/candidate-terms.mjs and getCoverageForCandidates.
   */
  key?: string
  /**
   * A sourced one-liner from the candidate ingest, e.g. "Contested Christchurch
   * East in 2023". Not a bio and not written by us — it comes from the
   * announcement the candidate was recorded from.
   */
  notes?: string
  /** URLs backing the announcement. The whole record rests on these. */
  citations?: string[]
  /**
   * Set when a candidate has pulled out of the race.
   *
   * Recorded, never inferred. A candidate vanishing from the source we scrape is
   * NOT evidence they withdrew — the page restructures, names get respelled, and
   * a broken parse would otherwise read as a mass withdrawal. This is only ever
   * written by scripts/mark-withdrawn.mjs, which requires a citation.
   *
   * Withdrawn candidates are kept and shown as withdrawn rather than deleted.
   * Someone who read about them on this page a week ago comes back and needs to
   * learn what happened; silently removing the row tells them nothing and looks
   * like we got it wrong the first time.
   */
  withdrawn?: { date: string; source: string }
  /**
   * Illustrative-only poll standing (0-100). NZ has no verified electorate-level
   * horse-race polling for most seats — only national party-vote polls and, rarely,
   * a one-off media-commissioned electorate poll for a marquee race. Do NOT populate
   * this for real, confirmed candidates unless there is a genuinely sourced,
   * electorate-specific poll to cite. Mock/preview data only until then.
   */
  pollPct?: number
}

export const CANDIDATES_2026: Record<string, Candidate2026[]> = {}

export function getCandidates(slug: string): Candidate2026[] {
  return CANDIDATES_2026[slug] ?? []
}
