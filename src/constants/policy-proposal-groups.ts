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

  // ── National ──────────────────────────────────────────────────────────────
  // Economy (3) and environment (6) are left ungrouped. Economy is already
  // short, and environment's six are six different domains — freshwater,
  // biodiversity, oceans, waste, planning, restoration — so merging them would
  // flatten distinct commitments into one vague "nature" line.

  {
    topic: 'housing',
    party: 'national',
    proposals: [
      {
        headline: 'Require councils to zone enough land for 30 years of housing demand, through upzoning and planning reform',
        details: [
          'Require councils to zone enough land for 30 years of housing demand',
          'Enable more housing through upzoning and planning reform',
        ],
      },
      'Reform infrastructure funding and financing to reduce the cost of new developments',
      'Establish a $1 billion fund rewarding councils that consent more new homes',
    ],
  },

  {
    topic: 'health',
    party: 'national',
    proposals: [
      {
        headline: 'More GPs and a 24/7 digital service for online consultations, prescriptions and lab referrals',
        details: [
          'Train more doctors and allow overseas-trained GPs to work in New Zealand practices',
          'Run a 24/7 digital service for online GP consultations, prescriptions, and lab referrals',
        ],
      },
      'Extend free breast screening to women aged 70–74',
      {
        headline: 'Build new hospitals in Nelson and Dunedin, and install 38 scanners over three years',
        details: [
          'Build new hospitals (Nelson, Dunedin) and upgrade facilities nationwide',
          'Install 38 new or replacement CT, MRI and SPECT scanners over three years',
        ],
      },
      'Fund more medicines through Pharmac and set health targets to reduce waiting times',
    ],
  },

  {
    topic: 'education',
    party: 'national',
    proposals: [
      {
        headline: 'An hour a day each on reading, writing and maths, taught with structured literacy and numeracy',
        details: [
          'Require an hour a day each on reading, writing and maths',
          'Use structured literacy and numeracy teaching methods in all schools',
        ],
      },
      'Ban cell phones in schools to reduce distractions',
      {
        headline: 'Replace NCEA with a new national qualification, and introduce a new curriculum for Years 1 to 10',
        details: [
          'Replace NCEA with a new national qualification',
          'Introduce a new curriculum for Years 1 to 10',
        ],
      },
      'Increase learning support for students who need extra help',
    ],
  },

  {
    topic: 'climate',
    party: 'national',
    proposals: [
      {
        headline: 'Faster and longer consents for renewable energy, and no consent needed for transmission upgrades',
        details: [
          'Require resource consent decisions for new renewable energy projects to be issued within one year',
          'Make resource consents for renewable projects last 35 years',
          'Remove consent requirements for upgrades to existing electricity transmission lines and most new infrastructure',
        ],
      },
      'Double New Zealand’s supply of renewable electricity from wind, solar, and geothermal sources',
      'Support the shift to electric vehicles, electric public transport, and electric industrial processing',
      'Reduce agricultural emissions through new technology',
    ],
  },

  {
    topic: 'crime-justice',
    party: 'national',
    proposals: [
      {
        headline: 'Tougher sentences for criminals, including specifically for sexual offending',
        details: [
          'Tougher sentences for criminals',
          'Tougher sentences specifically for sexual offending',
        ],
      },
      'Cracking down on gangs',
      {
        headline: 'More tools and powers for Police, and more foot patrols',
        details: [
          'More tools and powers for Police',
          'More Police foot patrols',
        ],
      },
    ],
  },

  {
    topic: 'immigration',
    party: 'national',
    proposals: [
      {
        // All five recorded proposals are this one visa and its conditions, so
        // the panel showed a single policy five times. The conditions are named
        // in the headline rather than left behind the toggle: sponsorship and
        // health insurance decide who can actually use it.
        headline: 'A Parent Visa Boost: a five-year multiple-entry visa, extendable for another five, with sponsorship and health-insurance conditions',
        details: [
          'Require visa holders to be sponsored by their children or grandchildren in New Zealand',
          'Require visa holders to carry health insurance for the duration of their stay',
          'Exclude visa holders from NZ Super and other government entitlements',
          'Require visa holders to pass standard Immigration New Zealand health and other requirements',
        ],
      },
    ],
  },

  {
    topic: 'foreign-policy',
    party: 'national',
    proposals: [
      'Prioritise diplomacy, international partnerships, and trade agreements in line with NZ values',
      {
        headline: 'Maintain a combat-ready military and work with allies on security challenges',
        details: [
          'Maintain a modern, combat-ready military to protect New Zealand’s Exclusive Economic Zone',
          'Collaborate with allies and global partners to address security challenges',
        ],
      },
      // Left separate from the diplomacy line above: one is how New Zealand
      // trades and partners, the other is what it advocates for.
      'Promote democracy, freedom, human rights, and inclusivity internationally',
      'Ensure veterans receive timely care, recognition, and support',
    ],
  },

  // ── Green ─────────────────────────────────────────────────────────────────
  // Green's recorded proposals are more principle-based than the other two
  // parties', so the merging here is deliberately lighter: combining two broad
  // statements produces a vaguer one, not a clearer one. Only groups where the
  // same commitment is repeated across domains, or several mechanics serve one
  // policy, are merged. Health (1), education (3), crime & justice (2) and
  // environment (6 separately published policies) are left alone.

  {
    topic: 'housing',
    party: 'green',
    proposals: [
      'Large-scale government building of public housing',
      'End homelessness through community-based housing-first support',
      {
        // Four of the six were renting: evictions, rent levels, quality, and
        // rights in general. One tenancy policy stated four times.
        headline: 'Strengthen renters’ rights: ban no-cause evictions, stabilise rent increases and lift rental quality standards',
        details: [
          'Ban no-cause evictions for renters',
          'Stabilise rent increases',
          'Improve the quality standards of rental homes',
          'Strengthen renters’ rights overall',
        ],
      },
    ],
  },

  {
    topic: 'economy',
    party: 'green',
    proposals: [
      {
        headline: 'Publish an alternative budget and apply a Green Fiscal Strategy to how public money is managed',
        details: [
          'Publish an alternative budget showing different spending and revenue choices',
          'Apply a Green Fiscal Strategy to guide how public money is managed',
        ],
      },
      // Left separate: both are aims for the economy rather than instruments,
      // and merging them would say less than either does on its own.
      'Build an economy that meets everyone’s basic needs',
      'Give everyday people more power to shape the economic system',
    ],
  },

  {
    topic: 'climate',
    party: 'green',
    proposals: [
      'Take urgent, equitable, evidence-based action on climate change',
      {
        headline: 'Transition to renewable energy accessible to everyone, with a democratised energy system',
        details: [
          'Transition to renewable energy accessible to everyone',
          'Democratise the energy system, prioritising community wellbeing over private profit',
        ],
      },
      'Protect nature and ecosystems as part of climate response',
      'Help communities prepare for and recover from climate-related disasters',
    ],
  },

  {
    topic: 'treaty-maori-affairs',
    party: 'green',
    proposals: [
      'Honour Te Tiriti o Waitangi as a foundational commitment',
      'Uphold Māori rights across government',
      'Support Māori development',
      {
        // The same commitment applied to four areas — governance, oceans,
        // energy, immigration — stated as four proposals.
        headline: 'Apply a Tiriti-based approach across governance, ocean and marine management, energy and immigration',
        details: [
          'Apply a Tiriti-based approach to governance, making it fair and inclusive',
          'Apply a Tiriti-based approach to ocean and marine management',
          'Apply a Tiriti-based approach to the energy system and immigration system',
        ],
      },
    ],
  },

  {
    topic: 'immigration',
    party: 'green',
    proposals: [
      'Build a progressive, Tiriti-based immigration system',
      {
        // Three descriptions of how the same system should behave.
        headline: 'An immigration system that is humane, fair, practical and sensitive to those affected',
        details: [
          'Ensure the immigration system is humane and fair',
          'Make immigration practical and sustainable',
          'Be sensitive to the requirements and concerns of all people affected',
        ],
      },
    ],
  },

  {
    topic: 'foreign-policy',
    party: 'green',
    proposals: [
      'Take independent, principled stances on the world stage',
      'Cooperate globally to uphold rights and interests of all people and the planet',
      {
        headline: 'Protect New Zealand from external threats and promote peaceful resolution of conflict globally',
        details: [
          'Protect New Zealand from external threats',
          'Promote conflict prevention and peaceful conflict resolution globally',
        ],
      },
      'Support trade and foreign investment that prioritises sustainability and justice',
    ],
  },
]

/** The grouping for a topic/party pair, or null to use the raw keyProposals. */
export function getProposalGrouping(topic: string, party: string): ProposalGrouping | null {
  return PROPOSAL_GROUPINGS.find((g) => g.topic === topic && g.party === party) ?? null
}
