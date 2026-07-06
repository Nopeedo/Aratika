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
