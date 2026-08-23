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
