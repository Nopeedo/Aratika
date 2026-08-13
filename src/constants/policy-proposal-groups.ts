/**
 * Proposal groupings — where several of a position's key proposals are really
 * one policy, this states how they read as one on the homepage panel.
 *
 * The panel's bullets normally come straight from a position's `keyProposals`
 * in the database, one line each. That works when each line is a separate
 * commitment, and reads badly when it isn't: Labour's housing position spent
 * three of its five lines on a single capital gains tax — the rate, the start
 * date, and where the money goes — so a reader scanning the panel saw one
 * policy three times and the rest of the position once.
 *
 * A grouping replaces that list for one topic/party pair. Each entry is either
 * a plain proposal, unchanged, or a headline with the detail folded behind a
 * "See more".
 *
 * ── Two things to know before adding one ──
 *
 * 1. THE LIST IS COMPLETE, NOT A PATCH. When a grouping exists it replaces the
 *    panel's bullets entirely, so every proposal that should appear has to be
 *    in it. That is deliberate — matching against database strings to decide
 *    what to absorb would break silently the moment an editor reworded a line.
 *    The cost is that a proposal added in /editor will NOT reach the panel for
 *    a pair that has a grouping until it is added here too.
 *
 * 2. THE HEADLINE STILL HAS TO BE TRUE ON ITS OWN. Most readers will not open
 *    "See more". Anything that changes what the headline means — an exclusion,
 *    a threshold, a start date that makes it not-yet-in-force — belongs in the
 *    headline, not behind the toggle. `details` is for the mechanics a reader
 *    only wants if they are interested, not for the qualifiers that stop the
 *    headline misleading them.
 */

import type { PartySlug, PolicyTopic } from '@/types'

/** A proposal as the panel should show it: plain, or merged with detail behind a toggle. */
export type GroupedProposal = string | { headline: string; details: string[] }

export interface ProposalGrouping {
  topic: PolicyTopic
  party: PartySlug
  /** The complete list for this pair, in display order. See note 1 above. */
  proposals: GroupedProposal[]
}

export const PROPOSAL_GROUPINGS: ProposalGrouping[] = [
  {
    topic: 'housing',
    party: 'labour',
    proposals: [
      {
        headline: '28% tax on any profit made when a commercial or residential property is sold',
        details: [
          'The family home is excluded, along with farms, KiwiSaver, shares, business assets and inheritances',
          'Applies only to gains made after 1 July 2027 — no profit made before that date is taxed',
          'Paid when the property is sold, not while it is held',
          'Charged at the individual level, so each owner is taxed on their share of the gain',
          'All revenue is ring-fenced for health funding, starting with three free doctor’s visits a year',
        ],
      },
      'SolarSaver scheme to help homeowners and renters access solar without upfront costs',
      'SolarSaver includes subsidies and loan schemes, up and running within 12 months of taking office',
    ],
  },
]

/** The grouping for a topic/party pair, or null to use the raw keyProposals. */
export function getProposalGrouping(topic: string, party: string): ProposalGrouping | null {
  return PROPOSAL_GROUPINGS.find((g) => g.topic === topic && g.party === party) ?? null
}
