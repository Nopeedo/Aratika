/**
 * Policy deep dives — long-form breakdowns built from a party's own published
 * policy document, for readers who want the mechanics rather than the summary.
 *
 * This sits a level below the position reader. The reader answers "what is their
 * position"; a deep dive answers "how would it actually work, and what happens in
 * my situation". Only topic/party pairs with a real published document get one —
 * there is no partial or inferred version.
 *
 * ── Editorial rules, because this is the most quotable thing on the site ──
 *
 * 1. MECHANICS ONLY. Policy documents are campaign documents: they mix rules with
 *    rhetoric about opponents. We take the rules. Labour's CGT document, for
 *    instance, closes with several paragraphs about the Prime Minister's record —
 *    that is the party making its case, and it belongs on the party's own page,
 *    not in a neutral explainer. Nothing in `mechanics`, `covered`, `exempt`,
 *    `examples` or `facts` may carry a claim about another party.
 *
 * 2. QUOTES ARE VERBATIM. Every string in `quotes` is character-for-character
 *    from the document. If it needs tidying to read well, it is not a quote —
 *    put it in your own words in a section instead. (This is the failure the
 *    July 2026 position audit found: paraphrases sitting inside quote marks.)
 *
 * 3. SUMMARISE, DON'T REPRODUCE. `mechanics` is Arapono's own description of
 *    what the document sets out. We are relying on fair dealing for criticism,
 *    review and reporting — short attributed excerpts plus our own summary, with
 *    a link out. Reproducing the document wholesale would not be that.
 *
 * 4. GAPS ARE CONTENT. `openQuestions` records what the document leaves
 *    unresolved. Every entry must be checkable against the document itself — a
 *    thing it explicitly defers, or a term it uses without defining. Not our
 *    critique of the policy.
 */

import type { PartySlug, PolicyTopic } from '@/types'

/** A headline number or date — the things a reader wants before anything else. */
export interface DeepDiveFact {
  label: string
  value: string
  /** Qualifier shown under the value. Use for conditions the value alone implies wrongly. */
  note?: string
}

/** One mechanic of the policy, in Arapono's words. */
export interface DeepDiveSection {
  heading: string
  body: string
  bullets?: string[]
}

/** A worked example. Where the document supplies one, we follow its figures. */
export interface DeepDiveExample {
  title: string
  /** Set-up, in order. */
  setup: string[]
  /** What the policy does with that set-up. */
  outcome: string[]
  /** True when the scenario and figures are the document's own, not ours. */
  fromDocument: boolean
}

export interface DeepDiveQuote {
  /** Verbatim. See rule 2 above. */
  text: string
  /** Section of the document it appears under, to make it findable. */
  context: string
}

export interface PolicyDeepDive {
  /** Topic pages this appears on. A tax on property sales is both. */
  topics: PolicyTopic[]
  party: PartySlug
  /** Arapono's neutral title for the policy. */
  title: string
  /** One paragraph, plain language, no advocacy. */
  summary: string
  facts: DeepDiveFact[]
  covered: string[]
  exempt: string[]
  /** Headings for the two lists. Default to the tax framing the first deep dive
   *  needed; an entitlement wants "What the visits cover" / "What they don't". */
  coveredLabel?: string
  exemptLabel?: string
  mechanics: DeepDiveSection[]
  examples: DeepDiveExample[]
  revenue?: {
    rows: { period: string; amount: string }[]
    /** How the party says the forecast was produced. */
    basis: string
    /** Defaults to raising money. Set for a policy that costs rather than raises. */
    heading?: string
  }
  quotes: DeepDiveQuote[]
  openQuestions: string[]
  source: {
    documentTitle: string
    publisher: string
    /** The promoter statement printed on the document, where it carries one. */
    authorisedBy?: string
    /** Omit until the public URL is confirmed — never guess one. */
    url?: string
    /** ISO date we read the document. */
    retrieved: string
  }
}

export const POLICY_DEEP_DIVES: PolicyDeepDive[] = [
  {
    topics: ['housing', 'economy'],
    party: 'labour',
    title: 'Targeted capital gains tax on property',
    summary:
      'Labour proposes a 28 percent tax on the profit made when a commercial or residential property is sold, ' +
      'excluding the family home. It applies only to gains made after 1 July 2027 — any increase in value before ' +
      'that date is not taxed — and is generally paid at the point of sale. The party says all revenue would be ' +
      'ring-fenced for health, funding three free GP visits a year for everyone.',

    facts: [
      { label: 'Rate', value: '28%', note: 'Flat, at the individual level, with no indexation for inflation' },
      { label: 'Gains taxed from', value: '1 July 2027', note: 'Called “valuation day”; earlier gains are not taxed' },
      { label: 'Applies to', value: 'Commercial and residential property', note: 'Excluding the family home' },
      { label: 'Paid', value: 'When the property is sold', note: 'With exceptions where ownership does not substantively change' },
      { label: 'Revenue use', value: 'Ring-fenced for health', note: 'Starting with three free doctor’s visits a year' },
      { label: 'Forecast revenue', value: '$700m a year', note: 'Party’s own average across the forecast period' },
    ],

    covered: [
      'Commercial property',
      'Residential property that is not the family home',
      'New Zealand resident individuals and entities',
      'Non-residents, on income sourced from New Zealand',
    ],

    exempt: [
      'The family home, including lifestyle blocks',
      'Farms',
      'KiwiSaver',
      'Shares',
      'Business assets',
      'Inheritances',
      'Gifts',
      'Personal items such as cars, boats, art, furniture and jewellery',
    ],

    mechanics: [
      {
        heading: 'Valuation day sets the starting point',
        body:
          'Commercial and residential properties other than the family home are given an opening value at 1 July 2027. ' +
          'Only the gain above that value can be taxed, so nothing earned before that date is captured. The document ' +
          'says several valuation options would be available, following the 2019 Tax Working Group’s recommendations, ' +
          'but does not settle on one.',
      },
      {
        heading: 'How the gain is worked out',
        body:
          'The taxable gain is the sale price, minus the purchase price (or the 1 July 2027 valuation where that applies), ' +
          'minus eligible costs. The cost of capital improvements is deducted, with what the document calls clear ' +
          'requirements to show the work was done.',
        bullets: [
          'Purchase costs are deductible at the time of sale',
          'Capital improvements are deducted from sale proceeds',
          'Holding costs such as rates and interest are not deductible, following the Tax Working Group',
        ],
      },
      {
        heading: 'Taxed per person, not per property',
        body:
          'The tax applies at the individual level, so each owner is taxed on their share of a gain. The document’s ' +
          'example: two business partners each owning half an investment property sold for a $100,000 net gain would ' +
          'each pay 28 percent on their own $50,000.',
      },
      {
        heading: 'Transfers that do not trigger the tax',
        body:
          'The tax is generally paid on sale, but not where ownership does not substantively change. Transfers to a ' +
          'spouse, civil union partner or de facto partner are not taxed, nor are transfers arising from a relationship ' +
          'ending or from death. If the property is later sold and is taxable, the gain is measured only from 1 July 2027.',
      },
      {
        heading: 'Losses can be carried forward, but only against like assets',
        body:
          'Selling a covered property for less than its cost, including improvements, creates a capital loss. That loss ' +
          'can be carried forward against future capital gains, but it is ring-fenced — it cannot be set against salary ' +
          'or other income.',
      },
      {
        heading: 'Death is not a taxing point',
        body:
          'An inheritance is not treated as a realisation event, so no tax is triggered when someone dies. The document ' +
          'lists inheritances among the exemptions.',
      },
    ],

    examples: [
      {
        title: 'A rental and a business, sold on retirement',
        fromDocument: true,
        setup: [
          'Daniel owns his family home, a rental property, and all the shares in his laundromat business',
          'He bought the rental for $650,000; on valuation day it was worth $700,000',
          'On valuation day the laundromat was valued at $1,100,000, of which the building was $800,000',
          'He buys new machines, and the business grows to $1,400,000',
        ],
        outcome: [
          'The family home is excluded, so it is not taxed',
          'The rental sells for $750,000 — tax applies only to the $50,000 gain since valuation day',
          'On the business sale, the building’s value must be separated from the business’s',
          'Only the part of the price reflecting the rise in the commercial property is taxed — not gains from the business itself or the new equipment',
        ],
      },
      {
        title: 'A family home and a holiday home, passing through an estate',
        fromDocument: true,
        setup: [
          'Phyllis and Liam own their Wellington family home, valued at $900,000',
          'They also own a Northland holiday home valued at $600,000, in both their names',
        ],
        outcome: [
          'When Liam dies, his share transfers to Phyllis with no tax to pay',
          'When Phyllis dies, the five children cannot agree how to split the assets and decide to sell both',
          'Inheritances are exempt, so no tax is due when the assets transfer to the executor',
          'Both are sold within six months — the family home for $1,100,000 and the holiday home for $650,000',
          'The children split $1,750,000 with no tax to pay',
        ],
      },
    ],

    revenue: {
      rows: [
        { period: '2027/28', amount: '$100m' },
        { period: '2028/29', amount: '$385m' },
        { period: '2029/30', amount: '$965m' },
        { period: '2030 & outyears', amount: '$1,350m' },
        { period: 'Average', amount: '$700m' },
      ],
      basis:
        'Labour’s own forecast, using the model developed by the 2019 Tax Working Group with an updated asset base ' +
        'and assumptions. It is not a Treasury costing.',
    },

    quotes: [
      {
        text:
          'There will be a 28 percent tax on any profit made after 1 July 2027 when a commercial or residential property (excluding the family home) is sold. Not a single dollar of profit made before 1 July 2027 will be taxed.',
        context: 'How it works — what’s included',
      },
      {
        text:
          'Every dollar raised will be ring-fenced to provide all New Zealanders with better healthcare, starting with three free doctor’s visits each year for all New Zealanders.',
        context: 'How it works — where the money goes',
      },
      {
        text:
          'Losses are ring-fenced, so they can only be used to offset gains from the same type of asset, not against salary or other income.',
        context: 'The detail — losses',
      },
    ],

    openQuestions: [
      'The document does not define “family home”, so how the exemption applies to mixed-use or multi-dwelling properties is not set out.',
      'The valuation method is not fixed — it says different options will be available, in line with the Tax Working Group’s recommendations.',
      'Everything not covered in the document is deferred: it states that all other tax technical details will follow the 2019 Tax Working Group’s recommendations.',
      'The revenue figures are the party’s projection from a 2019 model with updated assumptions, not an independent costing.',
    ],

    source: {
      documentTitle: 'Targeted tax changes to grow the economy and invest in health',
      publisher: 'New Zealand Labour Party',
      authorisedBy: 'Rob Salmond, 2 Gilmer Terrace, Wellington',
      url: 'https://www.labour.org.nz/capitalgainstax',
      retrieved: '2026-08-14',
    },
  },

  {
    topics: ['health'],
    party: 'labour',
    title: 'Three free doctor’s visits a year, with a new Medicard',
    summary:
      'Labour proposes giving every New Zealander three free GP visits a year, claimed with a new Medicard at the ' +
      'practice they are enrolled with. The visits cover a doctor or nurse appointment, do not roll over if unused, ' +
      'and exclude after-hours and ACC care. Alongside it the party would change how general practice is funded, ' +
      'through an Independent Pricing Authority, and fund the package from its proposed capital gains tax.',

    facts: [
      { label: 'Free visits', value: 'Three a year', note: 'Per person; they do not roll over into the next year' },
      { label: 'Claimed with', value: 'A new Medicard', note: 'Also usable through a secure app' },
      { label: 'Where', value: 'Your enrolled practice', note: 'An appointment with a doctor or a nurse' },
      { label: 'Who gets one', value: 'Every New Zealander', note: 'Issued at birth, or on becoming a citizen or resident' },
      { label: 'Cost', value: '$393.3m, then ~$553m a year', note: 'Party’s own figures, from 2027/28' },
      { label: 'Funded by', value: 'The proposed capital gains tax', note: 'See Labour’s housing policy for how that works' },
    ],

    coveredLabel: 'What the three visits cover',
    exemptLabel: 'What they don’t cover',

    covered: [
      'Appointments with a doctor at the general practice you are enrolled with',
      'Appointments with a nurse at that same practice',
      'Access through a secure app as well as the card',
    ],

    exempt: [
      'Services that are already free, such as immunisations or Access and Choice services',
      'After-hours care',
      'ACC visits',
      'Clinical phone triage — which also does not count against your three visits',
    ],

    mechanics: [
      {
        heading: 'How you get and use the card',
        body:
          'People receive a Medicard at birth, or when they become a citizen, resident, or otherwise eligible for ' +
          'healthcare. It is used at the practice you are enrolled with, and the same three visits are accessible ' +
          'through an app.',
        bullets: [
          'Holds your National Health Index number and your entitlement information',
          'Integrates with My Health Account, New Zealand’s digital health identity system',
          'Tracks entitlements in real time and integrates with primary and community provider software',
          'The document says it is designed for privacy, accessibility including non-digital users, and multilingual support',
        ],
      },
      {
        heading: 'Three a year, use them or lose them',
        body:
          'The entitlement is three visits per person per calendar year and does not accumulate — unused visits do not ' +
          'carry into the next year. Where an issue is resolved through phone triage rather than an appointment, it is ' +
          'not counted against the three.',
      },
      {
        heading: 'Changing how general practice is paid',
        body:
          'The document sets out the funding model as the underlying problem: general practice has been paid mainly a ' +
          'flat amount per enrolled person, with clinics able to charge a co-payment on top. It cites independent ' +
          'analysis from 2022 finding general practice underfunded by around 7.6 percent — about $137 million against ' +
          'total practice income of $1.67 billion.',
      },
      {
        heading: 'An Independent Pricing Authority',
        body:
          'A proposed new body, modelled on Australia’s Independent Health and Aged Care Pricing Authority, would set a ' +
          'national evidence-based rate for GP funding, and be operating by July 2028. When the rate rises, Health NZ ' +
          'would be required to fund the increase the following year.',
        bullets: [
          'Would use practice costs, staffing, patient mix, service delivery and sector-wide cost studies',
          'Money currently collected in co-payments would be added to general practice funding',
        ],
      },
      {
        heading: 'Freeing up appointments to absorb the demand',
        body:
          'Labour says more people seeing a doctor is the point, and that it worked with general practice ' +
          'representatives on changes to free up around 4.58 million appointments a year.',
        bullets: [
          'Clinical phone triage — around 1.9 million freed, and a further 2.9 million streamlined',
          'AI scribes and other digital tools — around 1.5 million',
          'Better information for people with long-term conditions — around 1 million',
          'Targeted facilities funding in high-demand areas — around 180,000',
        ],
      },
      {
        heading: 'Other changes in the package',
        body:
          'Three smaller measures sit alongside the visits themselves, aimed at practice running costs and how ' +
          'technology is adopted.',
        bullets: [
          'A Digital Innovation Fund so clinics can adopt proven technology quickly',
          'Extending primary care access to the national Health System Catalogue for bulk procurement pricing',
          'A review of telehealth funding, to ensure it complements rather than replaces face-to-face care',
        ],
      },
    ],

    // The document carries no worked examples of an individual's situation, so
    // there are none to report. It illustrates scale instead, which is in the
    // appointments section above.
    examples: [],

    revenue: {
      heading: 'What they expect it to cost',
      rows: [
        { period: '2027/28', amount: '$393.3m' },
        { period: '2028/29', amount: '$553m' },
        { period: '2029/30', amount: '$553m' },
        { period: '2030 & outyears', amount: '$548m' },
      ],
      basis:
        'Labour’s own costings for the whole package — the visits themselves, the Medicard and app, clinical triage, ' +
        'digital tools, self-care, the Independent Pricing Authority and facilities grants. The document does not ' +
        'state an independent cost check.',
    },

    quotes: [
      {
        text: 'The three free visits apply per year and don’t roll over. If they aren’t used within the year, they won’t carry into the next.',
        context: 'How the Medicard works',
      },
      {
        text: 'Your three free visits cover appointments with a doctor or nurse at your enrolled general practice. They don’t include services that are already free (such as immunisations or Access and Choice services), after-hours care, or ACC visits.',
        context: 'How the Medicard works',
      },
      {
        text: 'Money currently in co-payments will be added to general practice funding, so clinics won’t be worse off under the new system.',
        context: 'Fixing the funding problem',
      },
    ],

    openQuestions: [
      'The document does not say what a patient pays for a fourth visit in the same year.',
      'The national GP funding rate is not specified — the document says the Independent Pricing Authority would set it once operating, by July 2028.',
      'The 4.58 million appointments figure is Labour’s estimate, developed with general practice representatives; no independent modelling is cited.',
      'The costings are the party’s own, and the document does not state an independent cost check.',
    ],

    source: {
      documentTitle: 'Free doctor’s visits for all New Zealanders',
      publisher: 'New Zealand Labour Party',
      authorisedBy: 'Rob Salmond, 2 Gilmer Terrace, Wellington',
      url: 'https://www.labour.org.nz/medicard',
      retrieved: '2026-08-14',
    },
  },
]

/** The deep dive for a topic/party pair, or null. */
export function getDeepDive(topic: string, party: string): PolicyDeepDive | null {
  return POLICY_DEEP_DIVES.find(
    (d) => d.party === party && d.topics.includes(topic as PolicyTopic),
  ) ?? null
}
