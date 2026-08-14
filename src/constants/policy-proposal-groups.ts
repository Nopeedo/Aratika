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
        // "excluding the family home" is in the headline, not just the detail,
        // because without it the line reads as covering every house sale — and
        // for most people the only property they will ever sell is the one they
        // live in, which this exempts. Matches the document's own wording.
        headline: '28% tax on any profit made when a commercial or residential property is sold, excluding the family home',
        details: [
          'Farms, KiwiSaver, shares, business assets, gifts and inheritances are also exempt',
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

  {
    topic: 'health',
    party: 'labour',
    proposals: [
      {
        // "Three free GP visits a year", not "free GP visits" — the count is
        // the policy. Dropping it would promise unlimited free care, which is
        // the same trap as leaving the family home out of the housing headline.
        headline: 'Three free GP visits a year, plus free prescriptions, maternity scans and cervical screening',
        details: [
          'Three free doctor’s visits per year for everyone, through a new Medicard',
          'The $5 prescription fee removed, making prescriptions free for all',
          'Free maternity scans everywhere in New Zealand',
          'Free cervical screening nationwide',
        ],
      },
      // Workforce, not a service someone receives — stays its own point.
      'A Family Doctor Loan Scheme to increase the number of GPs',
    ],
  },

  {
    topic: 'education',
    party: 'labour',
    // Order follows the recorded proposals rather than being re-ranked: the
    // Māori-education commitments came first, the curriculum position next, the
    // trades ones last.
    proposals: [
      {
        headline: 'Restore Te Tiriti o Waitangi obligations for school boards and reverse cuts to te reo Māori teacher support',
        details: [
          'Restore the legal requirement for school boards to give effect to Te Tiriti o Waitangi',
          'Reverse cuts to support for teachers learning te reo Māori',
          'Work in partnership with schools, kura and communities on Māori education',
        ],
      },
      // A single position on several changes at once — already one point.
      'Oppose changes to curriculum, mandated testing, school qualifications, and charter schools',
      {
        // "from 2027" is in the headline: both parts start then, and a reader
        // who doesn't open the detail would otherwise read it as immediate.
        headline: 'Extend apprenticeship support from 2027, with a $1,000 toolbox grant and more trades covered',
        details: [
          'Extend Apprenticeship Boost employer payments from 2027',
          'Provide a $1,000 toolbox grant to apprentices',
          'Add more trades to the apprenticeship scheme',
        ],
      },
    ],
  },

  {
    topic: 'economy',
    party: 'labour',
    proposals: [
      'Cap weekly public transport fares at $20 per person',
      'Establish a New Zealand Future Fund to invest in the country’s future',
      // Left as recorded. The housing panel carries the merged version with the
      // rate, the exclusion and the start date; expanding it here would be
      // adding, not simplifying, and the two panels would then say it twice.
      'Introduce a Capital Gains Tax',
      {
        // Three health commitments sat on the economy panel because they are
        // what the capital gains tax is said to fund. Merged as one offer; the
        // funding link is stated on the housing panel and in the deep dive
        // rather than asserted here.
        headline: 'Free prescriptions, three free GP visits a year, and free maternity scans and cervical screening',
        details: [
          'Remove the $5 prescription fee, making prescriptions free',
          'Provide three free doctor visits a year via a new Medicard',
          'Make maternity scans and cervical screening free',
        ],
      },
    ],
  },
]

/** The grouping for a topic/party pair, or null to use the raw keyProposals. */
export function getProposalGrouping(topic: string, party: string): ProposalGrouping | null {
  return PROPOSAL_GROUPINGS.find((g) => g.topic === topic && g.party === party) ?? null
}
