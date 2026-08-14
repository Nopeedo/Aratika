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

  // ── ACT ───────────────────────────────────────────────────────────────────
  // Climate, environment, immigration and foreign policy have no recorded ACT
  // position, so there is nothing to group there.

  {
    topic: 'economy',
    party: 'act',
    proposals: [
      {
        headline: 'A two-rate income tax with a top rate of 28%, aligned with trust and company rates',
        details: [
          'Introduce a two-rate income tax system with a top rate of 28%',
          'Align personal, trust, and company tax rates to simplify the system',
        ],
      },
      'Continue identifying and cutting low-value government spending',
      {
        headline: 'Remove regulations and streamline consenting, and open markets to more competition',
        details: [
          'Remove unnecessary regulations to make it easier for businesses to invest and hire',
          'Streamline consenting processes and open markets to more competition',
        ],
      },
      'Maintain 90-day trial periods for all employers',
    ],
  },

  {
    topic: 'housing',
    party: 'act',
    proposals: [
      'Allow thousands of overseas building products to be used in New Zealand to lower construction costs',
      {
        headline: 'Repeal and replace the Resource Management Act with a property-rights-based, rules-based system',
        details: [
          'Repeal and replace the Resource Management Act with a property-rights-based system',
          'Create a rules-based framework where development can proceed quickly without lengthy compliance',
        ],
      },
      'Enable private investment in major infrastructure through Public Private Partnerships',
    ],
  },

  {
    topic: 'health',
    party: 'act',
    proposals: [
      {
        headline: 'Government to purchase health services rather than provide them, expanding contracts with private hospitals',
        details: [
          'Expand contracts with private hospitals for elective surgeries, diagnostics and specialist care',
          'Government to act as a purchaser of health services rather than a direct provider',
        ],
      },
      'Remove remaining race-based health policies and deliver services based on patient need',
      {
        headline: 'Publish detailed performance reports and set measurable targets for Health NZ',
        details: [
          'Publish regular, detailed performance reports for hospitals and health services',
          'Set measurable, trackable targets for Health NZ',
        ],
      },
      'Focus health funding on frontline services rather than management',
    ],
  },

  {
    topic: 'education',
    party: 'act',
    // Only one merge here. Student Education Accounts and partnership schools
    // both widen choice, but they are two distinct mechanisms — an account
    // families spend, and a type of school — so they stay apart.
    proposals: [
      'Introduce Student Education Accounts — publicly funded accounts parents can spend at any registered school or provider',
      'Publish detailed, comparable school performance data for parents',
      {
        headline: 'Raise teacher training standards and introduce performance-based pay',
        details: [
          'Raise teacher training standards with a focus on evidence-based literacy and numeracy methods',
          'Introduce performance-based pay so schools can reward their best teachers',
        ],
      },
      'Restore and expand partnership (charter) schools — publicly funded but independently run',
      'Keep curriculum focused on core subjects: reading, writing, maths, science, and history',
    ],
  },

  {
    topic: 'crime-justice',
    party: 'act',
    proposals: [
      {
        headline: 'Bring back Three Strikes, and longer sentences for attacks on vulnerable workers',
        details: [
          'Bring back Three Strikes — serious repeat violent or sexual offenders serve full sentences with no parole',
          'Longer sentences for attacks on vulnerable workers such as shop staff and bus drivers',
        ],
      },
      {
        headline: 'Expand prison capacity and drop targets to reduce prisoner numbers',
        details: [
          'Expand prison capacity and remove targets to reduce prisoner numbers',
          'Keep dangerous offenders in prison based on evidence of rehabilitation, not political targets',
        ],
      },
      'Allow prisoners early parole only if they gain literacy, a trade, or a qualification',
      'Focus police on frontline work against gangs and violent crime by cutting paperwork',
    ],
  },

  {
    topic: 'treaty-maori-affairs',
    party: 'act',
    // The most contested set on the site. The merges here are mechanical — two
    // lines on the same subject joined, each party's own wording kept intact in
    // the detail — and no proposal is dropped, softened or characterised.
    proposals: [
      'Define Treaty of Waitangi principles in law based on the 1840 text, including equal rights for all',
      'End co-governance arrangements in water, infrastructure, conservation, and local services',
      {
        headline: 'Remove remaining race-based policies across government, with ‘need not race’ as the guiding principle',
        details: [
          'Remove remaining race-based policies across all areas of government',
          'Keep ‘need not race’ as the guiding principle for government policy',
        ],
      },
      {
        headline: 'Keep the public’s right to challenge Māori council wards, and oppose voting rights for unelected appointees',
        details: [
          'Maintain the public’s right to challenge Māori council wards',
          'Oppose unelected appointees gaining voting rights on councils',
        ],
      },
    ],
  },

  // ── NZ First ──────────────────────────────────────────────────────────────
  // Six proposals on every one of the ten topics, and most are genuinely
  // separate policies rather than one policy stated several ways — so the
  // merging here is the lightest of any party. Economy is left whole (six
  // distinct measures), as is Treaty and Māori affairs, where the six sit in
  // six different domains: language, health, international law, local
  // government, coalition policy, curriculum.

  {
    topic: 'housing',
    party: 'nzfirst',
    proposals: [
      'Reinstate interest tax deductibility for landlords to encourage more rental homes to be built',
      'Evaluate allowing KiwiSaver members to use savings above a set level to pay down their mortgage',
      {
        headline: 'Support for older renters: a Seniors Housing plan and a higher Accommodation Supplement for SuperGold holders',
        details: [
          'Develop a Seniors Housing plan for older New Zealanders in rental accommodation',
          'Work to increase the Accommodation Supplement for SuperGold card holders',
        ],
      },
      'Absorb the Ministry of Housing and Urban Development into a new Ministry for Infrastructure',
    ],
  },

  {
    topic: 'health',
    party: 'nzfirst',
    proposals: [
      'Replace Pharmac with a new patient-focused medicines agency, adding $1.3 billion in funding',
      'Create a $925 million-a-year GP-controlled fund to clear the 60,000-person waiting list',
      {
        headline: 'Recruit around 2,000 extra doctors through immigration, fast-tracking registration of overseas-trained GPs',
        details: [
          'Recruit approximately 2,000 extra doctors through immigration as a priority',
          'Fast-track registration of overseas-trained doctors into general practice',
        ],
      },
      'Set up digital health clinics in hard-to-staff areas, led by nurse practitioners',
      'Abolish the Māori Health Authority and base health care on need, not race',
    ],
  },

  {
    topic: 'education',
    party: 'nzfirst',
    proposals: [
      'Enforce compulsory schooling and address truancy',
      'Focus school curriculum on reading, writing, and arithmetic; remove gender ideology and critical race theory',
      'Conduct a Select Committee Inquiry into whether NCEA is working',
      // Left separate from the trades pair below: this one is about when a
      // university student stops paying, not about shortage fields.
      'Move ‘Fees Free’ from first year to third year for full-time students who pass all coursework',
      {
        headline: 'Free apprenticeships in in-demand trades, and student loan write-offs for working in shortage fields',
        details: [
          'Free apprenticeships for in-demand trades, with fees refunded after each successful trade exam',
          'Student loan abatement: one year of loans wiped for every two years of full-time work in a shortage field',
        ],
      },
    ],
  },

  {
    topic: 'climate',
    party: 'nzfirst',
    proposals: [
      {
        headline: 'Repeal the ban on new offshore oil and gas exploration, and investigate reopening the Marsden Point refinery',
        details: [
          'Repeal the 2018 law banning new offshore oil and gas exploration permits',
          'Investigate reopening the Marsden Point oil refinery',
        ],
      },
      'Establish a Ministry of Energy focused on powering economic growth',
      'Keep the Tiwai Point aluminium smelter open',
      'Work with other countries on climate change resilience through foreign policy',
      'Make cheap renewable energy a competitive advantage for New Zealand’s economy',
    ],
  },

  {
    topic: 'environment',
    party: 'nzfirst',
    proposals: [
      'Fix infrastructure damaged by severe weather events',
      'Address aquatic and land-based pests, weeds, and biosecurity threats',
      {
        headline: 'Repeal Labour’s planning laws, temporarily reinstate the RMA, and replace the Environment Court with legislation limiting third-party appeals',
        details: [
          'Repeal Labour’s planning laws and temporarily reinstate the Resource Management Act',
          'Replace the Environment Court with new planning legislation limiting third-party appeals',
        ],
      },
      'Repeal the 2018 law banning new oil and gas exploration',
      'Improve water storage in productive rural regions',
    ],
  },

  {
    topic: 'crime-justice',
    party: 'nzfirst',
    proposals: [
      {
        headline: 'Add at least 500 frontline police within 18 months, and double the number of Youth Aid officers',
        details: [
          'Add at least 500 new frontline police within the first 18 months',
          'Double the number of Youth Aid officers',
        ],
      },
      'Introduce mandatory minimum sentences for serious violent and sexual offenders',
      'Create a gang-only prison and designate gangs as terrorist organisations',
      'Introduce a Youth Justice Demerit Points system for young offenders',
      'Establish Mental Health Response Units for mental health crises in communities',
    ],
  },

  {
    topic: 'immigration',
    party: 'nzfirst',
    proposals: [
      'Replace the Accredited Employer Work Visa with a Skills Shortage Visa and a Labour Shortage Visa',
      {
        headline: 'Prioritise recruiting around 2,000 overseas doctors, fast-tracking residence for in-demand clinical staff',
        details: [
          'Fast-track residence (within 30 days) and permanent residence (within 2 years) for in-demand clinical staff from six named countries',
          'Make recruiting overseas doctors an immigration priority to fill a shortfall of around 2,000',
        ],
      },
      'Crack down on exploitation of immigrant workers in poor working conditions',
      'Establish an Essential Worker workforce planning mechanism for long-term skills and labour shortage planning',
      'Combine Immigration New Zealand, Customs, and the Defence Force into a new Border Protection Force',
    ],
  },

  {
    topic: 'foreign-policy',
    party: 'nzfirst',
    proposals: [
      {
        headline: 'Pursue closer Commonwealth economic relations and a full free trade agreement with the United States',
        details: [
          'Launch a Closer Commonwealth Economic Relations arrangement with the UK, Australia, Canada, Singapore, Malaysia and Brunei',
          'Continue working toward a full free trade agreement with the United States',
        ],
      },
      {
        headline: 'Increase defence spending to 2% of GDP by 2030, with a permanent Defence Capital Fund for equipment',
        details: [
          'Progressively increase defence spending to reach 2% of GDP by 2030',
          'Establish a permanent Defence Capital Fund to pay for military equipment',
        ],
      },
      'Create a New Zealand Border Protection Force combining Defence, Customs, and Immigration',
      'Require a national interest test before following United Nations or WHO directives',
    ],
  },

  // ── Te Pāti Māori ─────────────────────────────────────────────────────────
  // Kaupapa-based like Green's, so merged lightly for the same reason: joining
  // two broad commitments produces a vaguer one. Treaty and Māori affairs is
  // left whole — six distinct constitutional commitments, and it is the topic
  // where a merge is most likely to read as editorial. Immigration has no
  // recorded position.

  {
    topic: 'economy',
    party: 'tpm',
    proposals: [
      'Make the wealthiest pay more tax and use revenue for public services',
      'Build Māori-led institutions and funds to grow Māori enterprise and wealth',
      'Protect Māori data and knowledge through data sovereignty',
      {
        headline: 'Lift incomes, strengthen welfare, and provide cost-of-living relief including transport affordability',
        details: [
          'Lift incomes so people can live with dignity',
          'Strengthen welfare so whānau are not penalised for being poor',
          'Back practical cost-of-living relief including transport affordability',
        ],
      },
    ],
  },

  {
    topic: 'housing',
    party: 'tpm',
    proposals: [
      'Build and support more public and affordable homes',
      'Make it easier to build homes on Māori and ancestral land',
      {
        headline: 'Stop speculation and land-banking, and act on vacant properties',
        details: [
          'Stop speculation and land-banking',
          'Take action on vacant properties',
        ],
      },
      'Use tax revenue from the wealthiest to fund housing',
    ],
  },

  {
    topic: 'health',
    party: 'tpm',
    proposals: [
      'Rebuild and strengthen a Māori-led health authority',
      'Shift health services toward prevention and whānau wellbeing rather than crisis response',
      {
        headline: 'Make health services accessible, culturally safe, and accountable to Māori communities',
        details: [
          'Make health services accessible and culturally safe for Māori',
          'Make health services accountable to Māori communities',
        ],
      },
      'Fund health through tax revenue from the wealthiest',
    ],
  },

  {
    topic: 'education',
    party: 'tpm',
    proposals: [
      {
        headline: 'Establish a Māori-led education authority, with Māori governance and decision-making in education',
        details: [
          'Establish a Māori-led education authority',
          'Support Māori governance and decision-making in education',
        ],
      },
      'Embed mātauranga Māori properly across learning',
      'Remove barriers that block whānau from accessing education and training',
    ],
  },

  {
    topic: 'climate',
    party: 'tpm',
    proposals: [
      {
        headline: 'Ban seabed mining and protect land and ocean from extractive industries',
        details: [
          'Ban seabed mining',
          'Protect land and ocean from extractive industries',
        ],
      },
      'Invest in climate resilience for communities most at risk',
      'Support regenerative and sustainable approaches aligned with Māori values',
    ],
  },

  {
    topic: 'environment',
    party: 'tpm',
    proposals: [
      {
        headline: 'Assert Māori rights and authority over freshwater, requiring Māori consent for decisions about water',
        details: [
          'Assert Māori rights and authority over freshwater',
          'Stop decisions about water being made without Māori consent',
        ],
      },
      // Seed sovereignty and GE stay separate from the land/food pair below:
      // it is a distinct stance, not a description of the same commitment.
      'Protect Māori seed sovereignty and reject GE foods',
      {
        headline: 'Invest in regenerative Māori agriculture and community food systems, and increase access to land for food production',
        details: [
          'Invest in regenerative Māori agriculture and community food systems',
          'Increase access to land for food production',
        ],
      },
      'Protect whenua, wai and climate as part of their core kaupapa',
    ],
  },

  {
    topic: 'crime-justice',
    party: 'tpm',
    proposals: [
      {
        headline: 'Establish a Māori-led justice authority and develop Māori-led community justice solutions',
        details: [
          'Establish a Māori-led justice authority',
          'Develop Māori-led community justice solutions',
        ],
      },
      'Reform laws that criminalise poverty and survival',
      'Move away from mass imprisonment toward long-term transformation',
    ],
  },

  {
    topic: 'foreign-policy',
    party: 'tpm',
    proposals: [
      {
        headline: 'Declare Aotearoa militarily neutral, and withdraw from military alignments seen as undermining sovereignty',
        details: [
          'Declare Aotearoa a militarily neutral nation',
          'Review and withdraw from military alignments seen as undermining sovereignty',
        ],
      },
      'Reset foreign policy to be independent and grounded in Māori values',
      'Build stronger relationships with Pacific and Indigenous nations',
      // What the Defence Force does, rather than who it aligns with.
      'Refocus the Defence Force on protection, disaster response, and Pacific support',
      'Uphold international human rights and hold war criminals to account',
    ],
  },
]

/** The grouping for a topic/party pair, or null to use the raw keyProposals. */
export function getProposalGrouping(topic: string, party: string): ProposalGrouping | null {
  return PROPOSAL_GROUPINGS.find((g) => g.topic === topic && g.party === party) ?? null
}
