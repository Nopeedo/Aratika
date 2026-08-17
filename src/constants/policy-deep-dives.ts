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
  /** URL segment under /policies/[topic]/[party]/. Hand-written, never derived
   *  from the title — a title can be reworded without breaking a live link, and
   *  these are pages we want indexed. Unique across the whole file. */
  slug: string
  /** Arapono's neutral title for the policy. */
  title: string
  /** One paragraph, plain language, no advocacy. */
  summary: string
  facts: DeepDiveFact[]
  /** Both optional. Not every policy has two sides — a screening programme has
   *  who it covers and no exclusion list, and padding one out to fill the panel
   *  would be inventing content. Omit either and its panel is not rendered. */
  covered?: string[]
  exempt?: string[]
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
    /** When the party published it, as printed on the document — "February 2026",
     *  "October 2023". Shown next to the attribution rather than buried in the
     *  footer, because a policy document's age is part of reading it: a
     *  manifesto written before a party entered government is a different claim
     *  from one written this year. Omit only when the document carries no date. */
    documentDate?: string
    /** The promoter statement printed on the document, where it carries one. */
    authorisedBy?: string
    /** Omit until the public URL is confirmed — never guess one. */
    url?: string
    /** ISO date we read the document. */
    retrieved: string
    /** Further documents this draws on. Some policies are published across more
     *  than one — an energy plan plus a standalone explainer for the entity it
     *  creates — and covering each separately would repeat most of both. Every
     *  document a page draws on has to be named, whichever one is primary. */
    alsoFrom?: { documentTitle: string; note?: string }[]
  }
}

export const POLICY_DEEP_DIVES: PolicyDeepDive[] = [
  {
    topics: ['housing', 'economy'],
    party: 'labour',
    slug: 'capital-gains-tax',
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
    slug: 'free-doctor-visits',
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

  {
    topics: ['economy'],
    party: 'labour',
    slug: 'future-fund',
    title: 'A New Zealand Future Fund',
    summary:
      'Labour proposes a state investment fund that would sit alongside, but separate from, the New Zealand Super ' +
      'Fund. It would be seeded with a small number of Crown-owned assets plus an initial capital contribution, run ' +
      'by the Guardians of the Super Fund with the Minister of Finance as sole shareholder, and invest in ' +
      'infrastructure and New Zealand businesses. The assets it is seeded with would be barred from sale by law.',

    facts: [
      { label: 'What it is', value: 'A state investment fund', note: 'Separate from the New Zealand Super Fund' },
      { label: 'Run by', value: 'Guardians of the Super Fund', note: 'The existing body that manages the Super Fund' },
      { label: 'Shareholder', value: 'The Minister of Finance', note: 'Sole shareholder, but cannot pick investments' },
      { label: 'Seeded with', value: 'Crown assets and capital', note: 'Assets with a commercial and public good purpose' },
      { label: 'Seed assets', value: 'Protected in law', note: 'Sale prevented by legislation' },
      { label: 'Invests in', value: 'Infrastructure and NZ businesses', note: 'For financial and social returns' },
    ],

    coveredLabel: 'What it would do',
    exemptLabel: 'What it could not do',

    covered: [
      'Invest in infrastructure and innovative New Zealand businesses',
      'Hold Crown-owned assets that have both a commercial and a public good purpose',
      'Invest and borrow in its own right',
      'Take returns that are social as well as financial — the document gives community renewable energy and high-tech start-ups as examples',
    ],

    exempt: [
      'Sell the assets it is seeded with — the document says this would be prevented in legislation',
      'Sell its other assets without explicit Ministerial approval',
      'Be told by the Minister of Finance which individual investments to make',
    ],

    mechanics: [
      {
        heading: 'Separate from the Super Fund, run by the same people',
        body:
          'The fund would sit alongside the New Zealand Super Fund rather than inside it, and be governed by the ' +
          'Guardians of the Super Fund — the existing body that runs it. The Minister of Finance would be sole ' +
          'shareholder.',
      },
      {
        heading: 'How it would be seeded',
        body:
          'The document describes a foundation of existing government assets plus an initial capital contribution. The ' +
          'assets would be a small number of Crown-owned ones with both a commercial and a public good purpose, giving ' +
          'the fund dividend income, a base to borrow against, and something to invest from.',
      },
      {
        heading: 'The seed assets would be locked in law',
        body:
          'Those assets would be protected in legislation so they cannot be sold and stay in public ownership. Assets ' +
          'the fund acquires later would need explicit Ministerial approval before any sale.',
      },
      {
        heading: 'What independence would mean in practice',
        body:
          'The fund would operate under legislation and a public policy statement. The Minister of Finance would set ' +
          'broad objectives through a letter of expectation but would have no power to direct individual investments — ' +
          'the same arm’s-length arrangement the Super Fund uses.',
      },
      {
        heading: 'Returns measured two ways',
        body:
          'The document is explicit that some investments may not deliver the returns of global markets, and argues ' +
          'they would create national value instead — stronger communities, lower costs, more resilient industries, and ' +
          'keeping talent and ideas in New Zealand.',
      },
      {
        heading: 'The comparisons it draws',
        body:
          'The case is made against three reference points, all figures from the document itself.',
        bullets: [
          'Singapore’s Temasek: began in 1974 with S$354 million, now worth more than S$434 billion',
          'Australia’s superannuation: grown to A$4.2 trillion',
          'New Zealand’s own Super Fund: $85 billion, of which the document says only 11 percent is invested in New Zealand',
        ],
      },
    ],

    // No worked examples in the document, and no financial forecast either —
    // see the open questions, which are the substantive part of this one.
    examples: [],

    quotes: [
      {
        text: 'It will be independently governed by the Guardians of the Super Fund, with the Minister of Finance as sole shareholder.',
        context: 'How the Future Fund works',
      },
      {
        text: 'The Minister of Finance will set broad objectives through a letter of expectation, but will have no power to direct individual investments.',
        context: 'How the Future Fund works',
      },
      {
        text: 'The Future Fund will have the authority to invest and borrow, but any sale of seeded assets will be prevented in legislation.',
        context: 'How the Future Fund works',
      },
    ],

    openQuestions: [
      'The document does not say how large the initial capital contribution would be.',
      'It does not name which Crown-owned assets would be used to seed the fund.',
      'No target size, return or timeframe is given for the fund.',
      'No start date is stated, and the document does not say what legislation would be needed first.',
    ],

    source: {
      documentTitle: 'New Zealand Future Fund',
      publisher: 'New Zealand Labour Party',
      authorisedBy: 'Rob Salmond, 2 Gilmer Terrace, Wellington',
      url: 'https://www.labour.org.nz/futurefund',
      retrieved: '2026-08-14',
    },
  },

  {
    topics: ['health'],
    party: 'labour',
    slug: 'family-doctor-loan-scheme',
    title: 'A Family Doctor Loan Scheme',
    // Scoped to the loan scheme. The back half of this document repeats the
    // free-visits one — the 4.5 million appointments, independent pricing —
    // which the Medicard deep dive above already covers. Restating it here
    // would have the same page tell a reader the same thing twice.
    summary:
      'Labour proposes low-interest loans to help doctors buy into or set up an owner-operated general practice. A ' +
      'loan would cover up to 90 percent of the buy-in cost to a maximum of $500,000, be interest-free for two years ' +
      'and then charge 3 percent, with ten years to repay. Up to 50 would be available a year from 1 July 2027, ' +
      'targeted at communities with no GP clinic or where practices have closed their books.',

    facts: [
      { label: 'Loan size', value: 'Up to 90% of the buy-in', note: 'Capped at $500,000' },
      { label: 'Interest', value: 'Nil for two years, then 3%', note: 'Repayments start after year two' },
      { label: 'Term', value: '10 years to repay', note: 'In total, including the interest-free period' },
      { label: 'How many', value: 'Up to 50 a year', note: 'One loan per doctor' },
      { label: 'Available from', value: '1 July 2027', note: 'Through the existing Small Business Cashflow Loan Scheme' },
      { label: 'Targeted at', value: 'Underserved communities', note: 'No GP clinic, or books partially or fully closed' },
    ],

    coveredLabel: 'Who and what it covers',
    exemptLabel: 'What it excludes',

    covered: [
      'Doctors buying into an existing general practice, or setting up a new one',
      'Up to 90 percent of the cost of buying in, capped at $500,000',
      'Practices in communities with no GP clinic, or where GP books are partially or fully closed',
      'Delivered through the existing Small Business Cashflow Loan Scheme',
    ],

    exempt: [
      'Corporate-owned practices — the document says the scheme is for owner-operated clinics only',
      'A second loan for a doctor who has already had one',
      'More than 50 loans in any year',
    ],

    mechanics: [
      {
        heading: 'What the loan covers',
        body:
          'A doctor could borrow up to 90 percent of the cost of buying into a practice, to a maximum of $500,000. ' +
          'The document restricts it to owner-operated practices and excludes corporate-owned ones, on the stated ' +
          'grounds of backing locally run clinics connected to their communities.',
      },
      {
        heading: 'How repayment works',
        body:
          'No interest and no repayments for the first two years. Monthly repayments then begin on the outstanding ' +
          'balance, and an annual interest rate of 3 percent applies from that point. The full term is ten years.',
      },
      {
        heading: 'Who gets one, and where',
        body:
          'Up to 50 loans a year, one per doctor, targeted to communities with no GP clinic or where practices have ' +
          'partially or fully closed their books. The document does not set out how those communities would be ' +
          'identified.',
      },
      {
        heading: 'Delivered through an existing scheme',
        body:
          'Rather than a new institution, the loans would run through the Small Business Cashflow Loan Scheme, which ' +
          'already exists, from 1 July 2027.',
      },
      {
        heading: 'The problem the party says it addresses',
        body:
          'The document argues the number of owner-operated practices is falling because buying in is unaffordable for ' +
          'younger GPs who already carry student loans and mortgages, and that this leaves fewer clinics in smaller ' +
          'towns and rural areas.',
      },
    ],

    examples: [
      {
        title: 'Buying into a retiring doctor’s practice',
        fromDocument: true,
        setup: [
          'Katherine wants to move back to Cambridge, near family, and buy a house',
          'A local doctor is retiring and wants to sell his practice in 2029',
          'He has had interest from a corporate provider but would prefer it stayed owner-operated',
          'Buying in would take $400,000, and she also plans a $500,000 mortgage at $2,500 a month',
        ],
        outcome: [
          'Borrowing the $400,000 from a bank could cost upwards of $5,000 a month',
          'Under the scheme she borrows the same $400,000 with no repayments or interest until 2031',
          'She then has until 2039 to repay it',
          'The document’s point is that the first two years are free of repayments, so she can focus on the practice rather than the loan',
        ],
      },
    ],

    quotes: [
      {
        text: 'Providing low-interest loans will back those doctors who want to spend their careers caring for their local communities.',
        context: 'Care close to home',
      },
      {
        text: 'Practices are expensive to establish, difficult to run, and high interest rates make taking on that risk even harder.',
        context: 'Care close to home',
      },
    ],

    openQuestions: [
      'The document does not say what the scheme would cost, or how the lending would be funded.',
      'It does not say whether the 3 percent rate is fixed for the rest of the term.',
      'It does not set out how a community with “no GP clinic, or where GP books are partially or fully closed” would be assessed.',
      'It does not say what happens if more than 50 doctors apply in a year.',
    ],

    source: {
      documentTitle: 'Backing your family doctor',
      publisher: 'New Zealand Labour Party',
      url: 'https://www.labour.org.nz/familydoctorloanscheme',
      retrieved: '2026-08-14',
    },
  },

  {
    topics: ['health'],
    party: 'labour',
    slug: 'free-cervical-screening',
    title: 'Free cervical screening',
    // The shortest source so far — a one-page factsheet — but a specific one:
    // age range, start date, delivery, funding source and a costing. Short deep
    // dive rather than a padded one; there is no exclusion list because the
    // document states none.
    summary:
      'Labour proposes making cervical screening free for everyone aged 25 to 69 from 1 October 2027. Eligibility ' +
      'would be loaded automatically onto the Medicard and claimed by scanning it at a general practice or a ' +
      'community screening event. The screening would sit on top of the three free doctor’s visits rather than ' +
      'counting against them, and be funded from existing health baselines.',

    facts: [
      { label: 'Who', value: 'Everyone aged 25 to 69' },
      { label: 'From', value: '1 October 2027' },
      { label: 'Claimed with', value: 'The Medicard', note: 'Eligibility loaded onto it automatically' },
      { label: 'Where', value: 'GP or community screening events' },
      { label: 'Counts against the free visits', value: 'No', note: 'It is in addition to the three a year' },
      { label: 'Cost', value: '$21.6m in the first full year', note: 'From existing health baselines' },
    ],

    coveredLabel: 'What it covers',
    covered: [
      'Everyone aged 25 to 69',
      'Screening at the general practice you are enrolled with, or at community screening events',
      'Claimed by scanning your Medicard, with eligibility loaded onto it automatically',
      'In addition to the three free doctor’s visits, not counted against them',
    ],
    // No exempt list: the document states no exclusions, and inventing one to
    // fill the panel would be exactly the padding these pages avoid.

    mechanics: [
      {
        heading: 'Who it covers and when it starts',
        body:
          'Free screening for those aged 25 to 69, from 1 October 2027. The document does not describe any other ' +
          'eligibility condition.',
      },
      {
        heading: 'How you would claim it',
        body:
          'Eligibility would be loaded automatically onto the Medicard, the same card carrying the three free doctor’s ' +
          'visits. It would be claimed by scanning the card at a general practice or a community screening event.',
      },
      {
        heading: 'It sits on top of the free visits',
        body:
          'The document is explicit that free screening is in addition to the three free doctor’s visits, so using it ' +
          'would not reduce the number of free appointments available in a year.',
      },
      {
        heading: 'How it would be paid for',
        body:
          'Unlike the free visits, which the party would fund from its proposed capital gains tax, screening is stated ' +
          'as coming from existing health baselines. The costing given is $21.6 million for the first full year.',
      },
      {
        heading: 'The case the party makes',
        body:
          'The document argues cervical cancer is among the most preventable cancers, that 85 percent of those ' +
          'diagnosed have never been screened or have missed screenings, and that making it free would bring it into ' +
          'line with other nationwide free cancer screening programmes.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they expect it to cost',
      rows: [{ period: 'First full year', amount: '$21.6m' }],
      basis: 'Labour’s own figure. The document says the screening would be funded from existing health baselines.',
    },

    quotes: [
      {
        text: 'Cervical cancer is among the most preventable cancers - yet 85 percent of those diagnosed have never been screened or missed screenings.',
        context: 'Why it matters',
      },
      {
        text: 'Screening will be funded from existing health baselines.',
        context: 'The cost',
      },
    ],

    openQuestions: [
      'The document does not say what applies to people outside the 25 to 69 age range.',
      'It does not say how often a free screening would be available within that range.',
      'It says the screening comes from existing health baselines, but does not say what that funding is currently spent on.',
    ],

    source: {
      documentTitle: 'Free cervical screening',
      publisher: 'New Zealand Labour Party',
      authorisedBy: 'Rob Salmond, 2 Gilmer Terrace, Wellington',
      url: 'https://www.labour.org.nz/cervicalscreening',
      retrieved: '2026-08-14',
    },
  },

  // ── Green ─────────────────────────────────────────────────────────────────

  {
    // On housing as well as economy: two of the six measures are property ones,
    // and it sits alongside Labour's capital gains tax there for comparison.
    topics: ['economy', 'housing'],
    party: 'green',
    slug: 'tax-plan',
    title: 'A tax system for all of us',
    summary:
      'The Green Party proposes six revenue measures and an income tax cut. A 2.5 percent annual tax on net assets ' +
      'over $10 million and a 33 percent tax on inheritances and gifts received over $1 million; a higher company ' +
      'rate for large firms, a levy on the big banks, and enforcement of withholding tax on profits sent offshore; ' +
      'and reversal of the landlord interest deduction and the brightline change. Income tax is cut, with the first ' +
      '$10,000 tax-free and a new 45 percent rate over $160,000.',

    facts: [
      { label: 'Tax on net assets', value: '2.5% a year over $10m', note: '$20m for a couple, after debts; family home exempt' },
      { label: 'Inheritances and gifts', value: '33% over $1m', note: 'Paid by the recipient; family home and farm exempt' },
      { label: 'Large company rate', value: '33%', note: 'Turnover over $30m; small and medium firms stay at 28%' },
      { label: 'Tax-free threshold', value: 'First $10,000', note: 'The party says 96% of people get a tax cut' },
      { label: 'New top rate', value: '45% over $160,000', note: 'On the portion above the threshold' },
      { label: 'Net revenue', value: '$5.1bn in 2027/28', note: 'After the income tax cut; party’s own modelling' },
    ],

    coveredLabel: 'What would be taxed more',
    exemptLabel: 'What is exempt or unchanged',

    covered: [
      'Net assets above $10 million, or $20 million for a couple, at 2.5 percent a year',
      'Inheritances and gifts received above $1 million, at 33 percent',
      'Companies with turnover above $30 million, at 33 percent instead of 28',
      'Banks with more than $100 billion in liabilities, at 0.06 percent of total liabilities',
      'Profits sent offshore by large multinationals, through the 5 percent withholding rate',
      'Income above $160,000, at 45 percent',
    ],

    exempt: [
      'The family home, from the tax on net assets',
      'Family homes and family farms, from the inheritance and gift tax',
      'Māori land under Te Ture Whenua Māori Act, and the assets of Post-Settlement Governance Entities',
      'The assets of charities, NGOs and clubs',
      'Small and medium businesses, which stay on the 28 percent company rate',
    ],

    mechanics: [
      {
        heading: 'The tax on net assets',
        body:
          'A 2.5 percent annual charge on net assets above $10 million for an individual, or $20 million for a couple, ' +
          'measured after mortgages and other debt. It is a tax on wealth held, not on income from wages or work.',
        bullets: [
          'Covers property, shares and bonds, which the document says have known values because they trade often',
          'Artworks and similar worth more than $50,000 are valued at what they are insured for',
          'Wealth in a discretionary trust is assessed against the settlor; a fixed-interest trust is apportioned to beneficiaries',
        ],
      },
      {
        heading: 'The Capital Acquisitions Tax',
        body:
          'A 33 percent tax on inheritances and gifts worth more than $1 million, paid by the person receiving them ' +
          'rather than the estate. The document says it would apply to about 1,100 people a year, and that the 33 ' +
          'percent rate matches the base rate on income earned by a trust or by the estate of someone who has died.',
      },
      {
        heading: 'A higher company rate for large firms only',
        body:
          'The company rate rises from 28 to 33 percent for businesses with annual turnover above $30 million — the ' +
          'threshold Inland Revenue uses to define a large business, which the document says is about 0.7 percent of ' +
          'firms. Everyone below it stays at 28 percent.',
      },
      {
        heading: 'A levy on the big banks',
        body:
          'An annual levy of 0.06 percent on the total liabilities of banks holding more than $100 billion — which the ' +
          'document says captures ANZ, ASB, BNZ and Westpac, and matches a levy Australia already has. The stated ' +
          'purposes are the fiscal risk of highly leveraged banks, bank profitability, and levelling the field for ' +
          'smaller competitors.',
      },
      {
        heading: 'Enforcing withholding tax on offshore profits',
        body:
          'The document argues large multinationals reduce their New Zealand taxable profit by classifying what are in ' +
          'substance royalties as service and licence fees. The policy is to enforce the existing 5 percent withholding ' +
          'rate on them, and it says this would apply to any company misclassifying royalties this way, not only the ' +
          'named examples.',
      },
      {
        heading: 'Reversing the two property tax changes',
        body:
          'Interest deductibility on residential investment property would be removed, and the brightline test returned ' +
          'to 10 years from the current 2. The document notes this taxes the gain at the seller’s marginal rate and ' +
          'does not apply to the family home.',
      },
      {
        heading: 'The proposed income tax scale',
        body:
          'Seven brackets replacing the current five, with the first $10,000 untaxed and a new top rate on income over ' +
          '$160,000. Only the portion above each threshold is taxed at that rate.',
        bullets: [
          '$0–$9,999 at 0% · $10,000–$19,999 at 10% · $20,000–$39,999 at 17.5%',
          '$40,000–$59,999 at 25.5% · $60,000–$79,999 at 30.5% · $80,000–$159,999 at 33.5%',
          '$160,000 and over at 45%',
        ],
      },
    ],

    examples: [
      {
        title: 'Two inheritances, one taxed and one not',
        fromDocument: true,
        setup: [
          'In the first, someone is gifted a family home worth $1.5 million and $250,000 in shares',
          'In the second, someone is gifted a family home worth $1.5 million and $1.25 million in shares and bonds',
        ],
        outcome: [
          'The first pays nothing — the family home is exempt, and what is left is under the $1 million threshold',
          'The second pays 33 percent on $250,000, being the value above $1 million once the family home is excluded',
        ],
      },
    ],

    revenue: {
      rows: [
        { period: '2027/28', amount: '$5,147m' },
        { period: '2028/29', amount: '$5,348m' },
        { period: '2029/30', amount: '$5,541m' },
        { period: '2030/31', amount: '$5,725m' },
      ],
      basis:
        'Net totals, after the income tax cut (about $2.3bn a year) and extra Inland Revenue funding. Modelled by the ' +
        'Parliamentary Library using Inland Revenue, Stats NZ, Reserve Bank and Treasury data. The document states ' +
        'that behavioural response is beyond the models’ scope, though it assumes 28.5 percent of the net-assets tax ' +
        'revenue would be lost to avoidance and evasion.',
    },

    quotes: [
      {
        text: 'The person receiving the inheritance or gift will pay the tax, not the estate or person passing it on.',
        context: 'How it will work — Capital Acquisitions Tax',
      },
      {
        text: 'Modelling the behavioural response to a change in the tax system is beyond the scope of these models.',
        context: 'Modelling assumptions',
      },
      {
        text: 'Costings for each policy have been projected through to the end of 2031 and are estimates only based on the best available information.',
        context: 'Modelling assumptions',
      },
    ],

    openQuestions: [
      'The document does not say when the changes would take effect; the costings begin in 2027/28.',
      'Beyond property, shares and bonds having known values, and art over $50,000 being taken at its insured value, it does not set out how net assets would be valued each year.',
      'Behavioural response to the changes is excluded from the modelling, which the document states directly.',
      'Flow-on effects on other tax revenue — it gives GST and company tax as examples — are described as uncertain and are not included.',
    ],

    source: {
      documentTitle: 'A tax system for all of us — Tax policy 2026',
      publisher: 'Green Party of Aotearoa New Zealand',
      authorisedBy: 'Marama Davidson and Chlöe Swarbrick, Green Party Co-leaders, Parliament Buildings, Wellington',
      // The Green Party's policy index has no dedicated tax page, so there is no
      // URL to point at yet. Better to say so than to guess one.
      retrieved: '2026-08-14',
    },
  },

  {
    topics: ['climate'],
    party: 'green',
    slug: 'energy-plan-kiwipower',
    title: 'Power for all of us — the energy plan and Kiwipower',
    // Covers both the energy policy and the standalone Kiwipower explainer.
    // They overlap heavily on Kiwipower, so two deep dives would repeat most of
    // each other; both documents are named in the source block.
    summary:
      'The Green Party proposes cutting power bills through household and community ownership of renewable ' +
      'generation, and creating Kiwipower — a publicly owned Crown entity to build and contract the backup ' +
      '“firming” capacity the system needs when hydro lakes are low or wind drops. It includes zero-interest loans ' +
      'for solar and batteries, a renters’ right to solar, expanded home insulation, and funds for community, ' +
      'public-housing and Māori-housing renewable projects.',

    facts: [
      { label: 'Clean energy loans', value: 'Zero interest', note: 'For solar, batteries and efficiency upgrades; tied to the property' },
      { label: 'Renters', value: 'A right to solar', note: 'Plus legalising cheaper plug-in solar' },
      { label: 'Public housing', value: 'Solar on over half', note: 'Of all public homes, within four years' },
      { label: 'Community energy', value: '$200m', note: 'Reallocated from fossil fuel subsidies' },
      { label: 'Kiwipower', value: '$980m over four years', note: 'A new publicly owned Crown entity' },
      { label: 'Warmer Kiwi Homes', value: '50,000 upgrades', note: 'At an 80% subsidy rate' },
    ],

    coveredLabel: 'What the plan would do',
    covered: [
      'Zero-interest loans for rooftop solar, batteries and energy efficiency upgrades',
      'A renters’ right to solar, and legalisation of cheaper plug-in solar systems',
      'Expand Warmer Kiwi Homes, including replacing gas heating and stoves',
      'Fund community-owned renewable projects on schools, marae and other local sites',
      'Put solar on more than half of all public homes, and fund renewable energy on Māori housing',
      'Establish Kiwipower to build and contract renewable firming capacity',
    ],
    // No exemption list — this is a spending and regulation plan, not a tax.

    mechanics: [
      {
        heading: 'Zero-interest loans, tied to the house rather than the person',
        body:
          'A government-backed scheme would lend for rooftop solar, batteries and efficiency upgrades at zero interest, ' +
          'with the loan attached to the property and repaid over time through a separate levy rather than up front. ' +
          'The document says a fully electric home with solar could save up to $1,000 a year including repayments.',
        bullets: [
          'Central government would hold 20 percent, with councils and the Local Government Funding Agency splitting the rest',
          'The Energy Efficiency and Conservation Authority would run it',
          'Up to 90 percent of rateable properties could access it — if all councils take part',
          'The document estimates the scheme could be running in as little as six months',
        ],
      },
      {
        heading: 'Renters, and plug-in solar',
        body:
          'The document says renters are four to five times more likely to experience energy hardship but least able ' +
          'to benefit from rooftop solar. It proposes legalising plug-in solar — smaller, cheaper units needing no ' +
          'special installation that can move with a tenant — and a right to solar stopping landlords or body ' +
          'corporates unreasonably blocking safe, certified systems, through changes to tenancy and body corporate law.',
      },
      {
        heading: 'Being paid fairly for power sent back to the grid',
        body:
          'The party would regulate to ensure households and businesses with rooftop solar get a fair price for ' +
          'electricity exported to the grid, and reform network pricing so solar users pay only for the infrastructure ' +
          'they actually use rather than a flat charge.',
      },
      {
        heading: 'Expanding Warmer Kiwi Homes',
        body:
          'Costed for 50,000 upgrades over four years at an 80 percent subsidy rate, covering replacement of gas ' +
          'heating and stoves, ventilation, and hot water heat pumps.',
      },
      {
        heading: 'Community-owned generation',
        body:
          '$200 million for locally led projects — the document names schools, marae, libraries, recreation centres, ' +
          'community energy groups, iwi and Māori organisations and local government — funded by reallocating fossil ' +
          'fuel subsidies. It estimates this could put solar on 1,500 schools and 500 marae and fund 500 further ' +
          'projects, and includes enabling peer-to-peer energy trading.',
      },
      {
        heading: 'Public and Māori housing',
        body:
          'Rooftop solar on more than half of all public homes within four years, with installation mandated on new or ' +
          'renovated public homes where appropriate. Separately, $80 million for renewable energy on Māori housing — ' +
          'the document notes Māori are two to three times more likely to experience energy hardship.',
      },
      {
        heading: 'Kiwipower: what it is and how it would work',
        body:
          'A publicly owned Crown entity, accountable to a Minister, created to fix what the documents call a firming ' +
          'shortage — the backup capacity that keeps supply reliable when hydro and wind are low. It would be ' +
          'established by the end of 2027 with legislation passed and a board appointed.',
        bullets: [
          'Contract access to existing firming, including hydro and thermal now held by the big power companies',
          'Invest in new renewable firming and storage — geothermal, biomass, batteries, small pumped hydro, demand response',
          'Offer fair, transparent contracts to independent retailers, generators and large energy users',
          'Big power companies would face a regulated access obligation to offer a portion of their firming capacity, at a fair return',
          'Funded by a four-year $980 million appropriation, which the party attributes to its proposed tax on the super-rich',
        ],
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they expect it to cost',
      rows: [
        { period: 'Kiwipower', amount: '$980m' },
        { period: 'Warmer Kiwi Homes', amount: '$969.8m' },
        { period: 'Public housing solar', amount: '$460m' },
        { period: 'Clean energy loan subsidy', amount: '$421.2m' },
        { period: 'Community energy', amount: '$200m' },
        { period: 'Māori housing energy', amount: '$80m' },
      ],
      basis:
        'Four-year totals, each as stated in the document’s own costings rather than summed by us. Modelled using ' +
        'Parliamentary Library information, a Rewiring Aotearoa model for the loan subsidy, and EECA figures for ' +
        'installation costs and savings. The party says the plan is paid for by its proposed tax on the super-rich.',
    },

    quotes: [
      {
        text: 'The loans would be tied to the property and repaid over time, avoiding full upfront costs.',
        context: 'Making household power bills more affordable',
      },
      {
        text: 'Kiwipower will be funded through a four year $980 million appropriation, paid for by our Super Rich Tax.',
        context: 'Building a resilient energy system',
      },
      {
        text: 'Kiwipower will be established by the end of 2027, with legislation passed and a board appointed.',
        context: 'Kiwipower explainer — timeline and accountability',
      },
    ],

    openQuestions: [
      'The loan scheme depends on councils opting in. The document says up to 90 percent of rateable properties could access it if all councils participate, but does not say what happens where they do not.',
      'The split between operating and capital spending for Kiwipower is not set — the document says its board would decide, within the $980 million envelope.',
      'No start date is given for the renters’ right to solar or for legalising plug-in solar.',
      'The savings figures are modelled estimates, and the document says the plug-in solar figure is based on Parliamentary Library estimates of savings in Australia rather than New Zealand data.',
    ],

    source: {
      documentTitle: 'Power for all of us — Energy policy 2026',
      publisher: 'Green Party of Aotearoa New Zealand',
      authorisedBy: 'Marama Davidson and Chlöe Swarbrick, Green Party Co-leaders, Parliament Buildings, Wellington',
      url: 'https://www.greens.org.nz/energy_policy',
      retrieved: '2026-08-14',
      alsoFrom: [
        {
          documentTitle: 'Kiwipower explainer',
          note: 'an image-only PDF, read by optical character recognition and checked against the pages themselves',
        },
      ],
    },
  },

  {
    topics: ['treaty-maori-affairs'],
    party: 'green',
    slug: 'te-tiriti-policy',
    title: 'Te Tiriti o Waitangi policy',
    // A different kind of document from the costed ones: it sets constitutional
    // position and values rather than a programme with dates and dollars. The
    // summary says so plainly, so nobody arrives expecting an implementation
    // plan and reads its absence as an omission on our part.
    //
    // Macrons are stripped by text extraction, so every te reo word here is
    // written out correctly by hand rather than copied from the extract, and no
    // quote containing one is used — a quote we cannot check character for
    // character is not a quote.
    summary:
      'This is the Green Party’s foundational Tiriti policy rather than a costed programme: it sets the ' +
      'constitutional position every other Green policy is required to align with. It affirms the te reo Māori texts ' +
      'of He Whakaputanga 1835 and Te Tiriti o Waitangi 1840 as the country’s founding documents, seeks a fully ' +
      'resourced Waitangi Tribunal with binding authority, supports the return of whenua and restitution for ' +
      'breaches, and upholds UNDRIP.',

    facts: [
      { label: 'What it is', value: 'A foundational policy', note: 'All other Green policies must align with it' },
      { label: 'Founding texts', value: 'He Whakaputanga and Te Tiriti', note: 'The te reo Māori texts, of 1835 and 1840' },
      { label: 'Waitangi Tribunal', value: 'Binding authority', note: 'And fully resourced' },
      { label: 'Constitutional change', value: 'As set out in Matike Mai', note: 'Referred to rather than restated' },
      { label: 'International', value: 'UNDRIP upheld', note: 'Alongside the Mataatua Declaration' },
      { label: 'Written by', value: 'Te Rōpū Pounamu', note: 'The party’s Māori member collective' },
    ],

    coveredLabel: 'What the policy commits to',
    covered: [
      'Affirming the te reo Māori texts of He Whakaputanga o te Rangatiratanga o Nu Tireni 1835 and Te Tiriti o Waitangi 1840 as the founding constitutional documents',
      'A Waitangi Tribunal that is fully resourced and has binding decision-making authority',
      'Mutually agreed resolution of, and restitution for, outstanding historical and contemporary breaches',
      'Return of whenua to Māori — Hoki Whenua Mai — as central to restoring wellbeing',
      'Constitutional transformation along the lines envisioned by Matike Mai',
      'Upholding UNDRIP and the Mataatua Declaration on Cultural and Intellectual Property Rights of Indigenous Peoples',
    ],

    mechanics: [
      {
        heading: 'Where the policy comes from',
        body:
          'The party amended its Charter in 2001 to recognise Te Tiriti o Waitangi as the country’s founding document ' +
          'and Māori as tangata whenua. The party and its political office were restructured in 2022, and this policy ' +
          'was developed by Te Rōpū Pounamu, the party’s Māori member collective.',
      },
      {
        heading: 'Tikanga as law',
        body:
          'The policy states that Māori values and cultural practices expressed through tikanga and kawa were the first ' +
          'laws in Aotearoa, continue to guide Māori, and have been recognised by the courts as part of the country’s ' +
          'law. It commits the party to explaining concepts from te ao Māori whenever it uses them.',
      },
      {
        heading: 'Tino rangatiratanga',
        body:
          'It affirms tino rangatiratanga of whānau, hapū and iwi over their whenua, awa, moana, kāinga and taonga, ' +
          'both tangible and intangible — including mātauranga Māori, rongoā, tikanga and kawa, and taonga species — ' +
          'and commits to devolving power and resources to tangata whenua-led decision-making.',
      },
      {
        heading: 'Its position on co-governance',
        body:
          'The policy draws a distinction worth reading carefully: it says rangatira did not sign Te Tiriti to ' +
          'co-govern taonga over which they already had authority, while acknowledging that co-governance can enable ' +
          'progress towards what it calls a mature Tiriti-based relationship.',
      },
      {
        heading: 'Whenua and restitution',
        body:
          'It describes colonisation and Tiriti breaches as having disconnected generations of Māori from their land, ' +
          'treats Hoki Whenua Mai as central to restoring cultural, physical, mental and spiritual wellbeing, and ' +
          'states a Crown obligation to prevent further breaches, including environmental degradation and biodiversity ' +
          'loss.',
      },
      {
        heading: 'Ōritetanga — equity',
        body:
          'The policy attributes inequitable systems and disparities to the systemic racism of settler colonialism, ' +
          'notes further disparity for rangatahi, takatāpui and tāngata whaikaha, and seeks equitable outcomes across ' +
          'health, education, justice, te taiao, housing and economic wellbeing.',
      },
      {
        heading: 'How it binds the rest of the party’s policy',
        body:
          'Rather than sitting as a standalone kaupapa Māori policy, it requires every other Green policy to align ' +
          'with it. The party says Te Rōpū Pounamu’s direction on any policy is accepted as binding, and that every ' +
          'full policy review seeks mātauranga Māori and applies a Critical Tiriti Analysis to draft content.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The Waitangi Tribunal must be fully resourced and have binding decision-making authority to ensure Tiriti breaches are addressed.',
        context: 'Mana Motuhake',
      },
      {
        text: 'All Green Party policies are rooted in Te Tiriti o Waitangi and must be aligned with this foundational policy.',
        context: 'Tiriti-based policy',
      },
    ],

    openQuestions: [
      'The policy sets direction rather than implementation: it does not say what legislation would be introduced, or when.',
      'It does not set out what binding Waitangi Tribunal authority would cover in practice, or how it would be given legal effect.',
      'Constitutional transformation is referred to through Matike Mai rather than described in the document itself.',
      'As a foundational policy rather than a programme, it carries no costings.',
    ],

    source: {
      documentTitle: 'Te Tiriti o Waitangi Policy',
      publisher: 'Green Party of Aotearoa New Zealand',
      authorisedBy: 'Miriam Ross, Level 5, 108 The Terrace, Wellington',
      url: 'https://www.greens.org.nz/te_tiriti_o_waitangi',
      retrieved: '2026-08-14',
      alsoFrom: [
        { documentTitle: 'Reviewed 2022', note: 'the version read is dated 9 June 2026' },
      ],
    },
  },

  {
    topics: ['treaty-maori-affairs'],
    party: 'green',
    slug: 'maori-manifesto',
    title: 'Māori Manifesto — kaupapa Māori and Te Tiriti commitments',
    // Scoped to two chapters of a document that spans about thirty policy
    // areas. Those two are where it names legislation and funds; the rest is a
    // paragraph and a few bullets per topic, which belongs in the position
    // summaries rather than here.
    //
    // Sits alongside the Te Tiriti policy deep dive on the same page and does
    // not repeat it: that one sets constitutional position, this one is the
    // operational layer — which Acts would change, and what would be funded.
    //
    // Macrons are stripped by extraction, so te reo is written out by hand and
    // no quote containing a macronised word is used.
    summary:
      'The Green Party’s Māori Manifesto covers around thirty policy areas. This covers its two Māori-specific ' +
      'chapters, which are where it names legislation: amending the Treaty of Waitangi Act so Te Tiriti is the ' +
      'authoritative text, giving the Waitangi Tribunal binding power to order land returned, removing “full and ' +
      'final” from Treaty settlements, amending the Public Works Act to protect Māori land, and a Marae Resilience ' +
      'Fund.',

    facts: [
      { label: 'Treaty of Waitangi Act', value: 'Te Tiriti as authoritative', note: 'Working alongside He Whakaputanga' },
      { label: 'Waitangi Tribunal', value: 'Binding recommendations', note: 'Including return of Crown and private land' },
      { label: 'Treaty settlements', value: '“Full and final” removed', note: 'And the large natural grouping approach ended' },
      { label: 'Public Works Act 1981', value: 'Amended', note: 'To prevent acquisition of Māori land' },
      { label: 'Marae', value: 'A Marae Resilience Fund', note: 'Including civil emergency provision' },
      { label: 'Te reo Māori', value: 'Expanded nationwide', note: 'In formal and informal settings' },
    ],

    coveredLabel: 'What the two chapters commit to',
    covered: [
      'Amending the Treaty of Waitangi Act to recognise Te Tiriti as the authoritative text, working in conjunction with He Whakaputanga',
      'Te Tiriti-based decision-making across government, with iwi and hapū resourced as partners rather than advisors',
      'Reforming Treaty settlements — removing “full and final” clauses, ending the large natural grouping approach, validating hapū rangatiratanga',
      'A better resourced Waitangi Tribunal with power to make binding recommendations for return of Crown and private land',
      'Returning whenua wrongfully alienated outside settlements, including exploring a right of first refusal at point of sale',
      'A Marae Resilience Fund, an end to perpetual leases on whenua Māori, and Public Works Act protections',
    ],

    mechanics: [
      {
        heading: 'Which Act would change, and how',
        body:
          'The manifesto proposes amending the Treaty of Waitangi Act so that Te Tiriti — the te reo Māori text — is ' +
          'recognised as the authoritative one, and that it works in conjunction with He Whakaputanga o te ' +
          'Rangatiratanga o Nu Tireni. That is a change to which text has legal standing, not only to how it is ' +
          'interpreted.',
      },
      {
        heading: 'A Waitangi Tribunal that can order land returned',
        body:
          'Beyond more resourcing, the manifesto would give the Tribunal power to make binding recommendations for the ' +
          'return of land to iwi, whānau and hapū — and states this covers private as well as Crown land. The document ' +
          'does not set out how that would work where land is privately held.',
      },
      {
        heading: 'Reopening settled settlements',
        body:
          'It would amend the settlement policy guide used by negotiators to enable what it calls fair negotiations and ' +
          'just reparations without cessation of sovereignty, remove clauses referring to “full and final” settlement, ' +
          'and end the large natural grouping approach in favour of validating hapū rangatiratanga.',
      },
      {
        heading: 'Returning land outside the settlement process',
        body:
          'Separately from settlements, it proposes facilitating return of whenua wrongfully alienated from tangata ' +
          'whenua, including exploring a right-of-first-refusal process that would let iwi, hapū and whānau acquire ' +
          'private land at the point it is sold.',
      },
      {
        heading: 'Protecting the land that remains',
        body:
          'Two specific protections: ending perpetual leases on whenua Māori, and amending the Public Works Act 1981 so ' +
          'the Crown cannot acquire Māori freehold land, Māori customary land, or land within reasonable proximity to ' +
          'marae, urupā and wāhi tapu.',
      },
      {
        heading: 'Marae, te reo, and devolved decision-making',
        body:
          'A Marae Resilience Fund would resource marae to lead initiatives for their people, wāhi tapu and whenua under ' +
          'their own tikanga, with ongoing funding recognising marae as community lifelines in civil emergencies. The ' +
          'manifesto also commits to devolving power and resources to tangata whenua, and to expanding the learning, ' +
          'speaking and promotion of te reo Māori in both formal and informal settings.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'We know that Te Tiriti and democracy are not contradictory, they are complementary.',
        context: 'Kaupapa Māori',
      },
      {
        text: 'When Te Tiriti breaches are ongoing, apologies for past harms are not enough.',
        context: 'Te Tiriti o Waitangi',
      },
      {
        text: 'The Green Party understands that He Whakaputanga and Te Tiriti are the foundation for an enduring constitutional partnership.',
        context: 'Te Tiriti o Waitangi',
      },
    ],

    openQuestions: [
      'No dates are given for any of the legislative changes.',
      'The manifesto carries no costings — not for the Marae Resilience Fund, nor for land return.',
      'It does not say how binding Tribunal recommendations would operate over privately owned land, which is the most consequential of the proposals.',
      'The right-of-first-refusal process is described as something to explore rather than a settled mechanism.',
    ],

    source: {
      documentTitle: 'Māori Manifesto 2026',
      publisher: 'Green Party of Aotearoa New Zealand',
      authorisedBy: 'Miriam Ross',
      retrieved: '2026-08-14',
      alsoFrom: [
        { documentTitle: 'Kaupapa Māori and Te Tiriti o Waitangi chapters', note: 'the two chapters this covers, of about thirty in the document' },
      ],
    },
  },

  // ── National ──────────────────────────────────────────────────────────────

  {
    topics: ['economy'],
    party: 'national',
    slug: 'compulsory-kiwisaver',
    title: 'Compulsory KiwiSaver, and three changes around it',
    summary:
      'National proposes making KiwiSaver contributions compulsory for all workers from 1 July 2028, at the default ' +
      'rate on a glidepath reaching 6 percent each from employee and employer by 2032. Alongside it: a $1,500 Baby ' +
      'Boost with automatic enrolment at birth, a government KiwiSaver contribution for people on paid parental ' +
      'leave whether or not they contribute themselves, and compulsory employer contributions for workers over 65 — ' +
      'all from 1 July 2027.',

    facts: [
      { label: 'Compulsory from', value: '1 July 2028', note: 'For all workers, at the prevailing default rate' },
      { label: 'Contribution glidepath', value: '6% each by 2032', note: 'Combined 12%, which the party says matches Australia' },
      { label: 'Baby Boost', value: '$1,500 at birth', note: 'With automatic KiwiSaver enrolment, from 1 July 2027' },
      { label: 'Parental leave', value: 'Government contributes', note: 'Even if the parent does not, from 1 July 2027' },
      { label: 'Workers over 65', value: 'Employer must contribute', note: 'From 1 July 2027' },
      { label: 'Cost', value: '$110m rising to $362m', note: '2027/28 to 2030/31; from future Budget allowances' },
    ],

    coveredLabel: 'Who it would apply to',
    exemptLabel: 'Who is excepted',

    covered: [
      'All workers, from 1 July 2028, at the prevailing default contribution rate',
      'Self-employed people, at the employee-equivalent rate — 4 percent rather than the combined 8',
      'Every child born in New Zealand, automatically enrolled with a $1,500 payment',
      'People on paid parental leave, who receive a government contribution regardless of their own',
      'Employees aged over 65, whose employers would have to contribute as for anyone else',
    ],

    exempt: [
      'Employees already saving through another employer-managed defined contribution scheme',
      'People receiving paid parental leave, for the period they are out of work',
      'Anyone suspending contributions — but only by meeting the existing hardship test',
    ],

    mechanics: [
      {
        heading: 'What compulsory means here',
        body:
          'Contributions would be made at whatever the default rate is at the time, following an already-legislated ' +
          'glidepath: 3.5 percent from 1 April 2026, rising 0.5 points in 2028 and each year after until employee and ' +
          'employer rates each reach 6 percent on 1 April 2032. The document says this is aimed at low-income, ' +
          'part-time and self-employed workers, whose contribution rates it describes as lower than average.',
      },
      {
        heading: 'The exceptions, and the hardship test',
        body:
          'Three carve-outs: another employer-managed scheme, the period someone is on paid parental leave, and ' +
          'suspension — which would require meeting the hardship test already used for early withdrawal. The ' +
          'self-employed would pay only the employee share, 4 percent rather than the combined 8.',
      },
      {
        heading: '$1,500 at birth, and what it grows to',
        body:
          'Every child born in New Zealand would be enrolled automatically and receive $1,500. The document works ' +
          'through the compounding: at an assumed long-run return of about 7 percent a year, that becomes roughly ' +
          '$5,000 by age 18 with no further contributions. Costing assumes about 60,000 births a year; it notes there ' +
          'were 57,700 live births last year.',
      },
      {
        heading: 'Paid parental leave contributions',
        body:
          'Today the government matches contributions made by someone on paid parental leave. The document says only ' +
          'about 1 in 5 eligible people kept contributing in the year to June 2025, so 4 in 5 got nothing. From 1 July ' +
          '2027 the contribution would be paid regardless, at the default rate applied to the parental leave payment.',
      },
      {
        heading: 'Workers over 65',
        body:
          'Employers are not currently required to contribute for employees aged 65 and over. National would require ' +
          'it from 1 July 2027, on the same basis as for other employees. The document notes around 1 in 4 New ' +
          'Zealanders over 65 are in paid work and says this implements a 2024 Retirement Commissioner recommendation.',
      },
    ],

    examples: [
      {
        title: 'Jess, on paid parental leave twice',
        fromDocument: true,
        setup: [
          'Jess is 30 when she has her first baby in 2028, and 33 for her second in 2031',
          'She receives the maximum paid parental leave entitlement, 26 weeks, after each birth',
        ],
        outcome: [
          'The first period adds $625 to her KiwiSaver, the second $952',
          'Assuming a 7 percent average annual return, that is about $15,000 more by the time she is 65',
        ],
      },
      {
        title: 'Jeff, working past 65',
        fromDocument: true,
        setup: [
          'Jeff is 65 in 2027, earning $70,000 a year',
          'He chooses to work three more years and retires at 68',
        ],
        outcome: [
          'His employer is now obliged to contribute to his KiwiSaver',
          'The document puts him about $6,300 better off by 2030',
        ],
      },
    ],

    revenue: {
      heading: 'What they expect it to cost',
      rows: [
        { period: '2027/28', amount: '$110.1m' },
        { period: '2028/29', amount: '$323.4m' },
        { period: '2029/30', amount: '$342.2m' },
        { period: '2030/31', amount: '$361.6m' },
      ],
      basis:
        'National’s own figures, covering the Baby Boost, the parental leave top-up, the wider government ' +
        'contribution and the Crown’s own cost as an employer. The document says the cost would be met from future ' +
        'Budget operating allowances, and that it has deliberately not offset the total with the additional employer ' +
        'superannuation contribution tax the changes would raise, to keep the estimate conservative.',
    },

    quotes: [
      {
        text: 'Contributions will be made at the prevailing default rate as part of the agreed glidepath, lifting combined default contributions to 12% by 2032, matching Australia.',
        context: 'Compulsory savings',
      },
      {
        text: 'The cost of this policy will be met from future Budget operating allowances.',
        context: 'Fiscal impact',
      },
      {
        text: 'This directly implements a recommendation of the Retirement Commissioner, who called for employer contributions to be required for those over 65 in the Commission’s 2024 review of KiwiSaver settings.',
        context: 'Employer contributions for workers over 65',
      },
    ],

    openQuestions: [
      'The document does not say what happens if a worker simply does not contribute — only that suspending requires meeting the hardship test.',
      'It does not say whether the self-employed rate stays at 4 percent or follows the glidepath up to 6.',
      'It does not say whether the $1,500 Baby Boost would be indexed.',
      'The cost is to come from future Budget operating allowances rather than from identified savings or revenue.',
    ],

    source: {
      documentTitle: 'Building the Future: Enhancing KiwiSaver for Everyone',
      publisher: 'New Zealand National Party',
      retrieved: '2026-08-14',
    },
  },

  {
    topics: ['foreign-policy'],
    party: 'national',
    slug: 'trade-agenda',
    title: 'New Zealand’s Next Billion Customers — the trade agenda',
    summary:
      'National proposes opening trade negotiations with seven new economies over five years, extending the ' +
      'essential-supplies agreement signed with Singapore to other partners, cutting border paperwork through ' +
      'paperless trade and digital customs, and giving New Zealand Trade and Enterprise a mandate to seek out ' +
      'opportunities rather than wait to be asked. It restates a target of doubling export value by 2034.',

    facts: [
      { label: 'New negotiations', value: 'Seven economies', note: 'To commence within five years' },
      { label: 'Those markets', value: '~700m people', note: 'And more than US$5 trillion of GDP combined' },
      { label: 'NZ exports there now', value: '$1.8bn', note: 'Which the document frames as the size of the opportunity' },
      { label: 'Export target', value: 'Doubled by 2034', note: 'Exports have risen from $94.4bn to $114.1bn' },
      { label: 'Non-tariff barriers', value: '$1bn to be removed', note: 'After $733m removed this term' },
      { label: 'Trade missions', value: 'At least 23 next term', note: 'More sector-specific, with commercial targets' },
    ],

    coveredLabel: 'What the agenda would do',
    covered: [
      'Commence trade negotiations with Brazil, Switzerland, Argentina, EFTA, Bangladesh, Nigeria and Uruguay',
      'Negotiate essential-supplies agreements with further partners, using the Singapore agreement as the template',
      'Expand paperless trade and digital customs through the Future of Investment and Trade Partnership',
      'Extend real-time digital certification to the UK and other close partners',
      'Give New Zealand Trade and Enterprise a mandate to lead companies to opportunities, not only respond to them',
      'Complete at least 23 trade missions over the term',
    ],

    mechanics: [
      {
        heading: 'The seven markets, and why these ones',
        body:
          'The document groups them into three categories and gives the figures for each: high-income European ' +
          'economies, large South American ones, and emerging Asian and African markets. Together it puts them at ' +
          'almost 700 million people and over US$5 trillion of GDP, against current New Zealand exports of $1.8 ' +
          'billion.',
        bullets: [
          'Brazil — 214m people, US$2.19tn GDP, $205.81m of New Zealand exports today',
          'Switzerland — 8.7m, US$936.56bn, $467.64m',
          'Argentina — 46m, US$638.37bn, $75.2m',
          'EFTA (Iceland, Liechtenstein, Norway) — 6m, US$525.09bn, $83.78m',
          'Bangladesh — 178m, US$450.12bn, $670.15m',
          'Nigeria — 242m, US$252.26bn, $224.99m',
          'Uruguay — 3.5m, US$80.96bn, $27.36m',
        ],
      },
      {
        heading: 'Essential supplies agreements',
        body:
          'New Zealand and Singapore signed an Agreement on Trade in Essential Supplies on 4 May 2026, which the ' +
          'document describes as guaranteeing that food, medicines, medical supplies and critical inputs keep moving ' +
          'between the two during a disruption, committing both to avoid export restrictions on each other, and ' +
          'creating a framework for information sharing when supply chains come under pressure. National would use it ' +
          'as a template with other partners.',
      },
      {
        heading: 'Paperless trade and digital customs',
        body:
          'The vehicle is the Future of Investment and Trade Partnership, a network of 16 economies New Zealand helped ' +
          'convene with Singapore, Switzerland and the UAE, which the document expects to pass 20 members. The aim is ' +
          'real-time digital trade documentation, fewer non-tariff barriers, and automated customs and origin systems ' +
          'so goods clear borders faster.',
      },
      {
        heading: 'A different job for NZTE',
        body:
          'NZTE works with around 1,000 companies. The document says it has largely responded to companies that ask ' +
          'for help, and proposes shifting it to what it calls a “lead and follow” model — identifying which exporters ' +
          'stand to gain when a new agreement opens a tariff window and approaching them, and building forward-looking ' +
          'sector opportunity maps.',
      },
      {
        heading: 'What the document counts as this term’s record',
        body:
          'It sets the agenda against results it attributes to the current term, which are the party’s own figures ' +
          'rather than independently sourced here.',
        bullets: [
          'A free trade agreement with India, cutting or removing tariffs on 95 percent of exports',
          'The NZ–EU agreement in force ahead of schedule, with exports up 37.9 percent since signing',
          'Concluded negotiations with the six-nation Gulf Cooperation Council',
          '23 trade missions to 18 countries, and $733 million of non-tariff barriers removed',
        ],
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'These seven markets combined represent almost 700 million people and a GDP of more than US$5 trillion, similar to the size of the German and Japanese economies today, and growing rapidly.',
        context: 'Prioritising new trade deals',
      },
      {
        text: 'A re-elected National Government will ask NZTE to do more: to actively lead companies to new opportunities and markets, not just follow where they point.',
        context: 'New Zealand Trade and Enterprise',
      },
    ],

    openQuestions: [
      'The document carries no costings — neither for the negotiations themselves nor for the extra NZTE resourcing it proposes.',
      'It commits to commencing negotiations with seven economies, not to concluding any of them, and gives no expected timeframe for a deal.',
      'The $1 billion of non-tariff barriers to be removed is a target; the document does not say which barriers or how they would be counted.',
      'The record it sets out for the current term is the party’s own account, without independent sourcing in the document.',
    ],

    source: {
      documentTitle: 'Building the Future: New Zealand’s Next Billion Customers',
      publisher: 'New Zealand National Party',
      documentDate: '2026',
      authorisedBy: 'J de Joux, 41 Pipitea St, Wellington',
      retrieved: '2026-08-14',
    },
  },

  {
    // On environment because that is where conservation, biodiversity and access
    // to public land sit in our topics. The summary opens by naming the subject
    // so nobody expects a freshwater or emissions policy from the heading.
    topics: ['environment'],
    party: 'national',
    slug: 'hunting-and-fishing',
    title: 'Hunting and fishing: game animals, access and Fish & Game',
    summary:
      'National proposes recognising valued introduced species in law so they are not treated as pests by default, ' +
      'building a coordinated wild animal management framework, and legislating to modernise Fish & Game. It would ' +
      'open suitable Crown land managed by LINZ to recreational hunting, add signatories to the Access Charter, seek ' +
      'more herds of special interest after wapiti and sika, and give the hunting and fishing sector a permanent ' +
      'seat on the Conservation Authority.',

    facts: [
      { label: 'Introduced species', value: 'Recognised in law', note: 'Not treated as pests by default' },
      { label: 'Wild animals', value: 'One coordinated framework', note: 'Replacing what it calls fragmented law' },
      { label: 'Fish & Game', value: 'Modernised by legislation', note: 'Administration, accountability, where money goes' },
      { label: 'Herds of special interest', value: 'More to be sought', note: 'After wapiti and sika this term' },
      { label: 'Crown land', value: 'Opened where suitable', note: 'LINZ-managed land, on public conservation land rules' },
      { label: 'Conservation Authority', value: 'A sector seat', note: 'Replacing an existing seat, not adding one' },
    ],

    coveredLabel: 'What it would change',
    covered: [
      'Formally recognise introduced species that have recreational, economic, environmental or cultural value',
      'Establish a coordinated wild animal management framework across the current mix of laws and agencies',
      'Pass legislation to modernise Fish & Game New Zealand',
      'Open suitable LINZ-managed Crown land to recreational hunting and fishing',
      'Add the Game Animal Council, Land Information New Zealand and the Overseas Investment Office to the Access Charter',
      'Replace an existing Conservation Authority and Conservation Board seat with a hunting and fishing representative',
    ],

    mechanics: [
      {
        heading: 'Introduced species, and what “not a pest by default” means',
        body:
          'The document describes wild animals as managed through a fragmented set of laws, agencies and plans, with ' +
          'responsibilities often unclear and valued species sometimes treated simply as pests. It would recognise in ' +
          'law species providing recreational, economic, environmental or cultural value — while saying action would ' +
          'still be taken where populations cause unacceptable environmental damage, managed to local conditions.',
      },
      {
        heading: 'Fish & Game and the Game Animal Council',
        body:
          'Legislation would simplify Fish & Game’s administration, strengthen its accountability to licence holders, ' +
          'and direct resources to the regions, habitats and fisheries the document says need them most. Fish and Game ' +
          'regions would also be told to review their boundaries to align with the Government’s Resource Management ' +
          'Act and local government reforms.',
      },
      {
        heading: 'More herds of special interest',
        body:
          'Two herds — wapiti and sika — were designated this term under the Game Animal Council (Herds of Special ' +
          'Interest) Amendment Act 2026. National would seek proposals for more on that model, saying selections would ' +
          'be evidence-based and require strong local and hunter support, and would replace the Tahr Control Plan 1993 ' +
          'with a plan developed alongside the tahr hunting community.',
      },
      {
        heading: 'Access to Crown land',
        body:
          'The current policy generally prevents recreational hunting on Crown land managed by Land Information New ' +
          'Zealand. National would change that, opening suitable land that would ordinarily be publicly accessible ' +
          'under rules similar to public conservation land. The document is explicit that Crown pastoral leases and ' +
          'other land not ordinarily publicly accessible would be unaffected.',
      },
      {
        heading: 'Jobs, exports and the rules around them',
        body:
          'It would promote New Zealand’s guided-hunting offer in overseas markets and simplify trophy-export permits, ' +
          'veterinary certification, taxidermy requirements and customs processes, alongside clearer rules ' +
          'distinguishing recreational, guided and aerial hunting from commercial wild animal recovery.',
      },
      {
        heading: 'The smaller measures',
        body:
          'A set of further commitments sits at the end of the document.',
        bullets: [
          'Investigate sustainable funding for national hunter training, with the Firearms Safety Authority',
          'Partner with DOC and community organisations on public conservation huts and facilities',
          'Feed Outdoor Access Commission maps into the new planning and environmental system',
          'Move shooting range consenting to a risk-based approach, with a right to operate where nobody could later complain',
          'Pilot a government-backed biodiversity credit recognising hunter-led conservation',
        ],
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'They will not be treated as pests by default simply because they were introduced.',
        context: 'Recognising valued introduced species',
      },
      {
        text: 'Existing arrangements for Crown pastoral leases and other land that is not ordinarily publicly accessible will remain unchanged.',
        context: 'Protect recreational access',
      },
    ],

    openQuestions: [
      'The document does not name which introduced species would be recognised in law.',
      'It does not define “suitable” Crown land, or say how much land would be opened to hunting.',
      'No costings are given for any part of the plan.',
      'The biodiversity credit is described as a pilot, with no scale, funding source or timeframe stated.',
    ],

    source: {
      documentTitle: 'Building the Future: Our Plan for Hunting and Fishing',
      publisher: 'New Zealand National Party',
      authorisedBy: 'J de Joux',
      retrieved: '2026-08-14',
      alsoFrom: [
        { documentTitle: 'Delivering on our 2023 Hunting and Fishing commitments', note: 'a record of the current term, used here only for what has already been legislated' },
      ],
    },
  },

  {
    // Filed under economy, which is the closest of the ten topics: it is a
    // workplace entitlement affecting household income, and it shares the
    // KiwiSaver page — the parental leave top-up appears in both documents and
    // is covered in the KiwiSaver deep dive rather than repeated here.
    topics: ['economy'],
    party: 'national',
    slug: 'paid-parental-leave',
    title: 'Paid parental leave: 26 weeks to 30',
    summary:
      'National proposes lifting paid parental leave from 26 weeks to 30 in three annual steps between 2027 and ' +
      '2029, and separately allowing both parents to take their leave at the same time rather than only one after ' +
      'the other. It would also keep in force the change letting annual leave accrue during parental leave so ' +
      'returning parents are paid in full. The stated longer-term aim is 40 weeks.',

    facts: [
      { label: 'Now', value: '26 weeks' },
      { label: 'By 1 July 2029', value: '30 weeks', note: 'In three steps: +1, +1, then +2' },
      { label: 'Longer-term aim', value: '40 weeks', note: 'No date; stated as subject to fiscal conditions' },
      { label: 'Shared leave', value: 'Both parents at once', note: 'In any combination they choose' },
      { label: 'Holiday pay', value: 'Paid in full on return', note: 'Annual leave keeps accruing during parental leave' },
      { label: 'Cost', value: '$327.4m over four years', note: 'From Budget operating allowances' },
    ],

    coveredLabel: 'What would change',
    exemptLabel: 'What would not',

    covered: [
      'Paid parental leave rises from 26 weeks to 30, in three steps',
      'Parents could take their leave at the same time, in any combination and order',
      'Annual leave continues to accrue during parental leave, and is paid in full on return',
    ],

    exempt: [
      'The maximum weekly payment rate, which the document says is unchanged',
      'Eligibility settings, also stated as unchanged',
      'The total entitlement per child — sharing divides the 30 weeks rather than adding to them',
    ],

    mechanics: [
      {
        heading: 'The three steps, and when each applies',
        body:
          'Each increase is funded from a specific Budget and takes effect the following July. An increase applies to ' +
          'parents whose entitlement commences on or after its effective date, so it is the start date of the leave ' +
          'that decides which entitlement applies rather than the date of birth alone.',
        bullets: [
          'Budget 2027 — from 1 July 2027 — 27 weeks',
          'Budget 2028 — from 1 July 2028 — 28 weeks',
          'Budget 2029 — from 1 July 2029 — 30 weeks',
        ],
      },
      {
        heading: 'Why it is staged',
        body:
          'The document says announcing the whole pathway up front gives families certainty and employers time to ' +
          'prepare, and that staging keeps each step affordable within tight operating allowances. It notes the ' +
          'largest increase, in 2029, is timed to coincide with the forecast return to surplus that year.',
      },
      {
        heading: 'Taking leave at the same time',
        body:
          'Parents can already split the entitlement, but not use it simultaneously. This would let them take all or ' +
          'part of it together, apart, then together again in whatever order suits — while the combined total stays ' +
          'the same.',
      },
      {
        heading: 'The legislation it would change',
        body:
          'Shared leave would come through amending the Parental Leave and Employment Protection Act 1987, along the ' +
          'lines of the Parental Leave and Employment Protection (Shared Leave) Amendment Bill currently before ' +
          'Parliament. The document says the change is not expected to cost the Crown significantly, with Inland ' +
          'Revenue absorbing administration within baselines.',
      },
      {
        heading: 'Holiday pay after parental leave',
        body:
          'Annual leave has been paid on average weekly earnings over the previous 12 months, so a parent taking a ' +
          'holiday soon after returning could be paid less because of time spent at home. Under the Employment Leave ' +
          'Act, which replaces the Holidays Act, leave keeps accruing during parental leave and is paid in full, from ' +
          '1 July 2027. National would keep those provisions in force as legislated.',
      },
    ],

    examples: [
      {
        title: 'Two ways parents could use 30 weeks together',
        fromDocument: true,
        setup: [
          'A couple has a combined entitlement of 30 weeks once the final increase applies',
          'Under current rules they could split it, but only take it one after the other',
        ],
        outcome: [
          'Both could take paid leave together for 15 weeks',
          'Or both take four weeks together, then one takes ten, then the other takes twelve',
          'The combined total stays 30 weeks either way',
        ],
      },
    ],

    revenue: {
      heading: 'What they expect it to cost',
      rows: [
        { period: '2027/28', amount: '$27.0m' },
        { period: '2028/29', amount: '$56.6m' },
        { period: '2029/30', amount: '$119.0m' },
        { period: '2030/31', amount: '$124.9m' },
      ],
      basis:
        'Totalling $327.4 million. National’s own figures, based on the gross cost forecast in BEFU 2026 and net of ' +
        'the additional PAYE the Crown collects on parental leave payments. Each step is to be met from the operating ' +
        'allowance in Budgets 2027, 2028 and 2029.',
    },

    quotes: [
      {
        text: 'Each increase applies to parents whose entitlement commences on or after the effective date. Policy on maximum weekly rates and eligibility settings will be unchanged.',
        context: 'Extending paid parental leave',
      },
      {
        text: 'The largest extension of paid parental leave, scheduled for 1 July 2029, is timed to coincide with the forecast return to surplus that financial year.',
        context: 'Fiscal impact',
      },
      {
        text: 'This additional flexibility is not expected to generate any significant costs for the Crown, because by itself this policy does not increase paid parental leave entitlements for each child born.',
        context: 'Shared parental leave',
      },
    ],

    openQuestions: [
      'The 40-week aim carries no date and is stated as subject to fiscal conditions.',
      'The schedule depends on Budget operating allowances, and the largest step is timed to a forecast surplus — the document does not say what happens to it if that forecast changes.',
      'Sharing divides the entitlement rather than adding to it, and the document does not say how the weeks would be apportioned if parents could not agree.',
      'It does not say whether the maximum weekly payment would move over the period, only that the rate policy is unchanged.',
    ],

    source: {
      documentTitle: 'Building the Future: Modernising Paid Parental Leave',
      publisher: 'New Zealand National Party',
      authorisedBy: 'J de Joux',
      retrieved: '2026-08-14',
    },
  },

  // ── The Opportunities Party ───────────────────────────────────────────────

  {
    // Both topics: the Land Value Tax is the party's housing policy as much as
    // its revenue one, and their recorded housing position leads with it.
    topics: ['economy', 'housing'],
    party: 'top',
    slug: 'tax-reset',
    title: 'The Tax Reset: Citizen’s Income, Land Value Tax and KiwiSaver 2.0',
    summary:
      'TOP proposes three linked reforms. Every adult would receive a tax-free Citizen’s Income of $19,400 a year, ' +
      'replacing most main benefits. Land would be taxed annually at 1.75 percent of its unimproved urban value and ' +
      '0.5 percent rural, raising roughly $24 billion. And a new compulsory KiwiSaver 2.0 would build to 12 percent ' +
      'of earnings. Income tax would be reset to three brackets. The party puts the package about $4 billion a year ' +
      'in the black.',

    facts: [
      { label: 'Citizen’s Income', value: '$19,400 a year', note: 'Tax-free, every citizen and resident aged 18+' },
      { label: 'Land Value Tax', value: '1.75% urban, 0.5% rural', note: 'On unimproved land value, not buildings' },
      { label: 'Income tax', value: 'Three brackets', note: '28% to $50k, 34% to $200k, 39% above' },
      { label: 'KiwiSaver 2.0', value: '12% compulsory', note: '6% employee and 6% employer, phased in' },
      { label: 'LVT revenue', value: '~$24bn a year', note: 'From a national land value of about $1.7 trillion' },
      { label: 'Net position', value: '+$4bn a year', note: 'The party’s own costing, on 2024 numbers' },
    ],

    coveredLabel: 'What it would replace',
    exemptLabel: 'Land exempt from the tax',

    covered: [
      'Jobseeker Support, Sole Parent Support, Student Allowance and Supported Living Allowance',
      'Working for Families — both the family tax credit and the in-work tax credit',
      'Paid Parental Leave payments and Best Start',
      'NZ Superannuation, replaced by the Citizen’s Income plus a top-up to current Super rates',
    ],

    exempt: [
      'Communally-owned Māori land',
      'Conservation land, public and private',
      'Land owned by clubs, societies and non-commercial religious organisations',
      'Local and central government land',
      'Treaty settlement land, subject to consultation with iwi',
      'Social housing',
    ],

    mechanics: [
      {
        heading: 'The Citizen’s Income',
        body:
          'A tax-free payment set at the current Jobseeker rate, $19,400 a year, paid fortnightly to every citizen and ' +
          'resident aged 18 and over. The document is explicit that it comes with no forms, no Work and Income ' +
          'appointments and no relationship status checks, and that at that level it is not enough to live on by ' +
          'itself.',
      },
      {
        heading: 'Income tax reset to three brackets',
        body:
          '28 percent up to $50,000, 34 percent from $50,001 to $200,000, and 39 percent above that. The document says ' +
          'anyone earning under $60,000 would pay less income tax than the Citizen’s Income they receive.',
      },
      {
        heading: 'Supplementary payments, paid automatically',
        body:
          'Rather than means-tested benefits, a set of universal supports applied for through My IRD or MyMSD and ' +
          'approved automatically if the criteria are met. Each abates by 10 cents in the dollar once household income ' +
          'passes somewhere between $50,000 and $75,000.',
        bullets: [
          'Child Support Income, highest in a child’s first year — $18,250 for a first child, $17,250 for each subsequent — falling to $7,750 and $6,750 for years 4 to 18',
          'An extra $9,500 a year for sole parents',
          'A disability allowance of $6,000',
          'Superannuitant top-ups of $10,000 for a single person, or $5,250 in total for a couple',
          'Housing Support Income set regionally, averaging $10,500 for families and $6,500 for couples and singles',
        ],
      },
      {
        heading: 'The Land Value Tax',
        body:
          'An annual charge on the unimproved value of land — explicitly not the buildings or other improvements on ' +
          'it. The stated intent is to make land banking expensive and dense development comparatively cheaper, since ' +
          'the bill does not rise when you build. Urban land values are already assessed in council rating valuations; ' +
          'the document says rural land is harder to value, which is why its rate is lower.',
      },
      {
        heading: 'Deferrals for superannuitants and farmers',
        body:
          'Superannuitants could defer the whole of the tax until the property is sold. Farmers would get a more ' +
          'limited deferral, on the grounds that farm income is exposed to global prices and weather.',
      },
      {
        heading: 'KiwiSaver 2.0',
        body:
          'A new compulsory scheme, entirely separate from the existing voluntary KiwiSaver, which would remain as a ' +
          'supplementary option. Contributions build to 12 percent of gross earnings, split evenly between employee ' +
          'and employer.',
        bullets: [
          'Balances could not be withdrawn for hardship or a first-home deposit, unlike current KiwiSaver',
          'Instead, bank lending against the balance would be enabled for first home buyers',
          'Existing KiwiSaver holders could move funds across if they chose',
          'Once fully phased in, the whole 12 percent would be exempt from income tax, and fund income tax-exempt after twenty years',
        ],
      },
      {
        heading: 'What happens to NZ Superannuation',
        body:
          'It would be replaced by the Citizen’s Income plus a top-up bringing the total to current Super rates, and ' +
          'the document states no one relying on it would receive less than now. Longer term, as KiwiSaver 2.0 ' +
          'balances grow, it says that top-up could be reduced for wealthier superannuitants.',
      },
      {
        heading: 'A ten-year transition',
        body:
          'The addendum sets out a decade-long pathway rather than a single switch: two years of planning first, then ' +
          'the Citizen’s Income extended to roughly a quarter of the population at a time, beginning with 18 to ' +
          '29-year-olds, and the Land Value Tax starting at 0.5 percent on urban land only before rising. The party ' +
          'expects land values to fall across the period, with the largest effect before implementation as the market ' +
          'prices the change in.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they expect it to raise and cost',
      rows: [
        { period: 'Land Value Tax', amount: '$24.3bn' },
        { period: 'Administration savings', amount: '$1.7bn' },
        { period: 'Citizen’s Income, net', amount: '−$13.6bn' },
        { period: 'Supplementary support, net', amount: '−$8.3bn' },
        { period: 'Net position', amount: '+$4.1bn' },
      ],
      basis:
        'TOP’s own costing on 2024 numbers: $25,997 million of revenue against $21,916 million of cost. The Citizen’s ' +
        'Income figure is net — a headline $69.6 billion, less $23.4 billion clawed back through income tax and $32.6 ' +
        'billion of replaced benefits. Administration savings are attributed mostly to MSD and Inland Revenue. The ' +
        'document notes this table was corrected on 7 August 2026 after earlier versions used incorrect data.',
    },

    quotes: [
      {
        text: 'Every New Zealand Citizen and resident aged 18 and over receives an annual amount equivalent to the Jobseeker benefit; currently $19,400 annually, paid fortnightly into their bank account.',
        context: 'The Citizen’s Income',
      },
      {
        text: 'An annual tax on the unimproved value of all urban land set at 1.75%. Critically, this does not include the value of buildings or other improvements.',
        context: 'Make housing affordable through a Land Value Tax',
      },
      {
        text: 'Unlike current Kiwisaver balances, Kiwisaver 2.0 will not be able to be withdrawn for hardship or first-home deposits.',
        context: 'Compulsory and universal KiwiSaver 2.0',
      },
    ],

    openQuestions: [
      'The two documents describe the KiwiSaver 2.0 phase-in differently: the overview says 0.5 percentage points a year reaching full rates after eight years, while the addendum says 1 percent a year over six — and its own table does not reach 6 percent each until year nine.',
      'Rural land is described as harder to value than urban land, but neither document says how it would be valued.',
      'The farmer deferral is described only as “more limited” than the superannuitant one, without saying what the limit would be.',
      'The costings are built on 2024 numbers, and the document records that the table was corrected in August 2026 after earlier versions used incorrect data.',
    ],

    source: {
      documentTitle: 'Tax Reset Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'May 2026',
      retrieved: '2026-08-14',
      alsoFrom: [
        { documentTitle: 'Tax Reset Policy Addendum', note: 'which sets out the ten-year implementation pathway' },
      ],
    },
  },

  {
    topics: ['environment'],
    party: 'top',
    slug: 'healthy-oceans',
    title: 'Healthy Oceans: fisheries reform, marine protection and a blue economy',
    summary:
      'TOP would move fisheries away from the Quota Management System’s single-species quotas toward ecosystem-based ' +
      'management, lift the biomass level at which a stock counts as sustainable, put cameras on every commercial ' +
      'vessel over 8 metres, and phase out bottom trawling in stages. Marine protection would expand from under 0.5 ' +
      'percent of the EEZ to 30 percent by 2035, using a new statute to replace the Marine Reserves Act 1971. Seabed ' +
      'mining would be banned permanently. The party puts the short-term cost at no more than $100 million a year.',

    facts: [
      { label: 'Our ocean territory', value: 'Over 4m km²', note: 'Fifth-largest EEZ in the world, 15 times our land mass' },
      { label: 'Protected today', value: 'Under 0.5%', note: '44 marine reserves, just over 17,000 km²' },
      { label: 'Protection target', value: '20% by 2030, 30% by 2035', note: 'Through marine spatial planning' },
      { label: 'Sustainability target', value: '40% → 50%', note: 'Of virgin biomass; soft limit 20→40%, hard limit 10→20%' },
      { label: 'Cameras on boats', value: 'All vessels over 8m', note: 'Including deep-sea trawlers and scampi boats' },
      { label: 'Cost to government', value: 'Up to $100m a year', note: 'The party’s own short-term estimate' },
    ],

    coveredLabel: 'The new marine protection toolkit',
    exemptLabel: 'Species targeted for recovery programmes',

    // Not a covered/exempt pairing in the tax sense — two lists from the
    // document that are most usefully read side by side. The panel labels
    // carry the meaning.
    covered: [
      'High-protection marine reserves, where no extractive activity is allowed',
      'Multiple-use marine protected areas, allowing regeneration alongside some fishing',
      'Species management areas protecting specific threatened species',
      'Seafloor protection zones prohibiting bottom-impact fishing but allowing other activity',
      'Emergency closure areas responding temporarily to ecosystem stress',
      'Sustainable-use zones managed for long-term health with continued harvest',
      'Statutory recognition of customary tools such as rāhui',
    ],

    exempt: [
      'Seabirds — albatross, petrels and penguins',
      'Marine mammals — New Zealand sea lions and southern right whales',
      'Māui and Hector’s dolphins',
      'Threatened fish including mako sharks and Antarctic toothfish',
    ],

    mechanics: [
      {
        heading: 'Ecosystem-based management instead of single-species quotas',
        body:
          'The document’s core argument is that the Quota Management System manages one species at a time and misses ' +
          'the relationships between them. TOP would review fisheries management to allow ecosystem-based approaches, ' +
          'drawing on the Rescue Fish / Ika Rauora pathway developed by LegaSea and NZ Sport Fishing. Secure catch ' +
          'entitlements would stay, with ecosystem health requirements, bycatch limits and habitat protection added ' +
          'around them. Inshore and offshore fisheries would be managed differently.',
      },
      {
        heading: 'Raising the bar for what counts as sustainable',
        body:
          'Three thresholds move at once, so that stocks are “genuinely abundant rather than merely not collapsed”. ' +
          'The document notes the government reports 87 percent of stocks in good shape while recreational fishers ' +
          'report declining catch, and attributes the gap to these baselines being set too low.',
        bullets: [
          'Management targets rise from 40 to 50 percent of virgin biomass',
          'Soft limits, below which a stock is considered depleted, rise from 20 to 40 percent',
          'Hard limits, which trigger immediate action, rise from 10 to 20 percent',
        ],
      },
      {
        heading: 'Cameras on every vessel over 8 metres',
        body:
          'Cameras would be rolled out to all commercial vessels over 8 metres, including deep-sea trawlers and ' +
          'scampi boats currently exempt under the present programme. Footage would be independently reviewed to ' +
          'verify catch reporting, monitor protected-species bycatch and feed stock assessments. Independent observer ' +
          'programmes would be kept alongside the cameras rather than replaced by them.',
      },
      {
        heading: 'A staged phase-out of bottom trawling',
        body:
          'Bottom-contact methods — trawling, dredging and Danish seining — would be phased out on a timetable rather ' +
          'than banned at once, with transition assistance for affected operators to retrain, retool for other methods, ' +
          'or exit the industry.',
        bullets: [
          'Immediate closures in the Hauraki Gulf and other inshore areas facing critical ecosystem decline',
          'A three-year phase-out on all seamounts, where the document says New Zealand is the only South Pacific nation still permitting the practice',
          'A five-year phase-out on other deep-sea features, including cold-water coral habitats',
        ],
      },
      {
        heading: 'Industry paying more of the restoration bill',
        body:
          'Commercial fishers already pay fisheries management costs under the Fisheries (Cost Recovery) Rules 2001, ' +
          'but the document says industry levies cover less than half of what monitoring, enforcement and ' +
          'administration actually cost. TOP would move to a beneficiary-pays system of resource rentals funding ' +
          'protected-area management, threatened species recovery, habitat restoration and research — set, it says, ' +
          'at a level that keeps the industry viable.',
      },
      {
        heading: 'Expanding protection from 0.5 percent to 30 percent',
        body:
          'The expansion would be planned across Parliament rather than in one term, and designed using systematic ' +
          'conservation planning rather than drawn on a map. The Marine Reserves Act 1971 would be replaced, on the ' +
          'grounds that it offers only one tool — the full no-take reserve — through an adversarial process. Planning ' +
          'would be run in resourced partnership with iwi and hapū, commercial and recreational fishers, tourism ' +
          'operators, conservation groups, scientists and councils.',
      },
      {
        heading: 'Beyond our own waters',
        body:
          'New Zealand would support regional blue corridors — linked protected areas across several nations’ waters ' +
          'following migratory whales, tuna, seabirds and turtles — and legislate to ratify the High Seas Treaty, the ' +
          'first legal framework for protecting international waters. All seabed mining applications in the ' +
          'territorial sea and EEZ would be opposed.',
      },
      {
        heading: 'Growing the blue economy',
        body:
          'The economic case rests on the claim that between 60 and 90 percent of the commercial catch is exported ' +
          'with little processing. TOP would implement the nine concluding recommendations of the Sustainable Seas ' +
          'National Science Challenge and use the existing Sustainable Food and Fibre Futures fund to back ' +
          'value-added processing, premium branding and direct-to-consumer distribution.',
        bullets: [
          'Seaweed farming, which sequesters carbon and absorbs excess nutrients',
          'Shellfish aquaculture, which filters water and creates habitat',
          'Land-based recirculating systems for finfish, avoiding biosecurity risk and marine pollution',
          'Integrated multi-trophic aquaculture combining species as natural ecosystems do',
        ],
      },
      {
        heading: 'Coastal restoration as climate policy',
        body:
          'Wetlands, mangroves, seagrass meadows and salt marshes are treated as carbon sinks as well as fish ' +
          'nurseries, sequestering carbon at rates the document says far exceed terrestrial forests while buffering ' +
          'storm surge and sea-level rise. Investment covers wetland restoration, seagrass rebuilding and riparian ' +
          'planting to cut sediment and nutrient runoff before it reaches the sea, with a target of more than 10,000 ' +
          'hectares restored.',
      },
      {
        heading: 'Iwi and hapū-led marine management',
        body:
          'The policy would resource iwi and hapū to develop and implement marine management plans in their rohe ' +
          'moana, on the basis that many are already doing this work and filling gaps left by central government. It ' +
          'also commits to repealing the Marine and Coastal Area (Takutai Moana) (Customary Marine Title) Amendment ' +
          'Act 2025.',
      },
      {
        heading: 'One body responsible for the ocean',
        body:
          'Four agencies currently operate under different statutes with none accountable for the ocean as a whole. ' +
          'TOP would reinstate an Ocean Secretariat with statutory authority to give cross-agency advice, explicitly ' +
          'mandated to prioritise the interests of future generations, coordinating MPI, DOC, the EPA and regional ' +
          'councils. Alongside it: a national open-access ocean data platform pooling research, citizen science, ' +
          'commercial fishing data and monitoring, and 20-year regional ocean plans for the Hauraki Gulf, ' +
          'Tasman/Golden Bays, the Marlborough Sounds, Fiordland and the Subantarctic.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they say it would cost',
      rows: [
        { period: 'Annual cost to government', amount: 'Up to $100m' },
        { period: 'Blue economy growth targeted', amount: '$500m+ a year' },
      ],
      basis:
        'The document describes the package as “largely cost-neutral or positive to the Crown in the long term”, with ' +
        'some costs recovered from the commercial fishing industry. It names coastal ecosystem restoration, marine ' +
        'research and blue economy development as the larger items within the $100 million, but does not itemise them ' +
        'further. The $500 million blue economy figure is a stated goal rather than a forecast, and no date is given ' +
        'for reaching it.',
    },

    quotes: [
      {
        text: 'Yet we protect less than 0.5% of our waters as marine reserves, allow destructive fishing practices that harm critical ecosystems, and manage our fisheries with outdated approaches that prioritise short-term extraction over long-term abundance.',
        context: 'Opening statement of the problem',
      },
      {
        text: 'We will urgently roll out cameras to commercial fishing vessels over 8m in length, including deep-sea trawlers and scampi boats currently exempt under the present government’s programme.',
        context: 'Install cameras and maintain observers on all commercial fishing vessels',
      },
      {
        text: 'Research shows we can protect 86% of threatened species while maintaining 86% of current fishing catch',
        context: 'Develop a Marine Protected Area expansion plan',
      },
      {
        text: 'The ecological risks of seabed mining are profound, the potential benefits are speculative, and once ecosystems are destroyed, restoration may be impossible.',
        context: 'Oppose seabed mining in New Zealand waters',
      },
    ],

    openQuestions: [
      'The summary of reforms promises bottom trawling phased out “in all inshore areas by 2030”, but the detailed section gives only immediate closures in the Hauraki Gulf and other areas in critical decline, with no inshore end date.',
      'The same document puts commercial catch exported without value-added processing at “between 60% and 90%” in one section and “over 90%” in another.',
      'Marine protection is stated as reaching 30 percent in the summary and 30 percent by 2035 in the detail, with 20 percent by 2030 as an intermediate step — the summary does not carry the dates.',
      'The 86 percent protection alongside 86 percent of catch figure is attributed to research that is not named or cited.',
      'What the increased resource rentals would actually be set at is not stated, only that they would keep the industry viable.',
      'No cost is attached to the marine protected area expansion, the Ocean Secretariat or the transition assistance for trawl operators separately from the $100 million total.',
    ],

    source: {
      documentTitle: 'Healthy Oceans Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'February 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['climate'],
    party: 'top',
    slug: 'abundant-energy',
    title: 'Abundant Energy: tripling renewable generation by 2050',
    summary:
      'TOP would set a 30 GW renewable capacity target for 2050 — roughly triple today’s — locked in through a ' +
      '25-year cross-party Energy Strategy. New generation would be underwritten by a Capacity Investment Scheme ' +
      'modelled on Australia’s. Four energy regulators would merge into one, and 29 distribution companies into six ' +
      'to eight. The Crown’s dividends from its gentailer shareholdings, about $500 million a year, would be ' +
      'ringfenced to pay for household and community electrification.',

    facts: [
      { label: 'Capacity target', value: '30 GW by 2050', note: '19.2 GW of new build, 1.6 GW of coal and gas retired' },
      { label: 'Spent offshore now', value: '$20bn+ a year', note: 'Buying imported fossil fuels' },
      { label: 'Household saving', value: '$600 a year', note: 'From power alone; $2,700+ more from EVs, solar and appliances' },
      { label: 'Jobs', value: '5,000', note: 'Sustained across a 30-year build-out' },
      { label: 'Distributors', value: '29 → 6–8', note: 'Consolidating electricity distribution businesses' },
      { label: 'Funding source', value: '~$500m a year', note: 'Ringfenced Crown gentailer dividends' },
    ],

    coveredLabel: 'What the ringfenced $500m would fund',
    exemptLabel: 'What would merge into one regulator',

    // Again not a covered/exempt pairing — two lists the document gives
    // explicitly, and the most useful things to put side by side here.
    covered: [
      'Administering council lending for the electrification loan scheme — about $6m a year',
      'Administering the Capacity Investment Scheme — about $5m a year',
      'Helping communities and distributors enable distributed generation — about $10m a year',
      'Co-funding small-scale community generation in isolated communities — up to $100m a year, supporting up to $2bn of capital spending',
      'Expanding Warmer Kiwi Homes — about $80m a year',
      'Electrifying council bus fleets — up to $125m a year, supporting up to $2.5bn of capital spending',
    ],

    exempt: [
      'The Electricity Authority',
      'The Commerce Commission’s energy-related functions',
      'MBIE’s energy policy work',
      'The Energy Efficiency and Conservation Authority (EECA)',
      'Relevant transport-electrification functions',
    ],

    mechanics: [
      {
        heading: 'A 25-year strategy agreed across Parliament',
        body:
          'Transpower’s “Accelerated Electrification” scenario gets to roughly 22 GW by 2050, which the document says ' +
          'is enough to muddle through decarbonisation but not to deliver abundance. Reaching 30 GW means building ' +
          'slightly more each year than the 556 MW added in 2024, sustained for decades. Because that depends on ' +
          'private investment over a very long horizon, TOP would seek a cross-party 25-year Energy Strategy — the ' +
          'stated point being to end “on-again off-again” pumped hydro and LNG announcements.',
      },
      {
        heading: 'A Capacity Investment Scheme',
        body:
          'Modelled on Australia’s, which the document says has already supported more than 18 GW and will unlock over ' +
          '$70 billion of investment. Competitive tenders would award long-term government contracts guaranteeing new ' +
          'renewables and storage a minimum revenue, with excess revenue above a ceiling price shared back with the ' +
          'government. Two deliberate limits: the guarantee applies only to a project’s second decade of operation so ' +
          'market price signals survive, and initial tender rounds are restricted to new entrants to build competition ' +
          'against the incumbent gentailers.',
      },
      {
        heading: 'The same deal, offered to industry',
        body:
          'A mirror-image scheme for large industrial energy users: long-term government guarantees, won through ' +
          'competitive tender, that their electricity price will not exceed a set amount if they switch off fossil ' +
          'fuels. The stated purpose is timing — creating baseline demand that arrives alongside the new generation ' +
          'the capacity scheme brings on.',
      },
      {
        heading: 'Ringfencing the Crown’s own dividends',
        body:
          'The document’s sharpest claim about the status quo is that the biggest single beneficiary of high power ' +
          'prices is the government itself, through its majority stakes in three of the four big gentailers — which ' +
          'leaves successive governments with no incentive to change the rules producing those profits. Ringfencing ' +
          'that revenue is meant to break the conflict and pay for everything else in the policy.',
      },
      {
        heading: 'One regulator, one ministry, one national policy statement',
        body:
          'Four bodies currently oversee energy with overlapping mandates. Their key functions would merge into a ' +
          'single modern energy regulator and a single Ministry of Energy. A national policy statement on generation ' +
          'and distribution would make consenting easier and less litigated, covering grid-scale generation and ' +
          'storage, generation for direct commercial use, and small distributed infrastructure in homes.',
      },
      {
        heading: 'Consolidating the lines companies',
        body:
          'New Zealand has 29 electricity distribution businesses, ranging from Vector with over 600,000 customers to ' +
          'Buller Electricity with under 5,000. The document argues they lack the scale to fund decarbonisation, and ' +
          'that the Commerce Commission’s light-handed regulation has held allowable capital investment down. It would ' +
          'consolidate them into six to eight firms and rewrite the revenue rules for them and Transpower to permit ' +
          'anticipatory investment — building capacity before it is needed rather than in response to demand.',
      },
      {
        heading: 'Low-interest loans through your rates bill',
        body:
          'Rewiring Aotearoa’s electrification loans would be adopted as a national Ratepayer Assistance Scheme run by ' +
          'councils, borrowing through the Local Government Funding Agency. The document is specific that because the ' +
          'loan attaches to the rateable property and no shareholder holds more than 20 percent, the debt sits on ' +
          'neither council nor central government books.',
      },
      {
        heading: 'Community-owned energy',
        body:
          'Two funds: one supporting communities and electricity distributors to work together so local schemes are ' +
          'accommodated on the wider grid, and direct government co-investment in community-owned generation and ' +
          'storage up to 15 MW. The argument made for it is resilience and efficiency of the whole system, not just ' +
          'local benefit.',
      },
      {
        heading: 'Warmer Kiwi Homes, doubled and widened',
        body:
          'EECA’s existing insulation and heating programme would have its funding doubled and its scope extended to ' +
          'appliance electrification and rooftop solar for low-income households — the households the document says ' +
          'are least able to capture those benefits on their own.',
      },
      {
        heading: 'Electric buses by 2030',
        body:
          'A mandate on councils to electrify urban bus fleets by 2030, fully centrally funded, covering both vehicles ' +
          'and charging infrastructure. The document expects spillover benefits: the charging capacity built for buses ' +
          'makes electrifying heavy freight easier later.',
      },
      {
        heading: 'How the lights stay on',
        body:
          'Grid stability comes primarily from overbuilding — having more renewable capacity than the grid needs, so ' +
          'wind and solar run ahead of hydro and water is left in the dams as a fast-response reserve, topped up by ' +
          'new geothermal and hydro. Household and community storage is described as building resilience and shifting ' +
          'peaks rather than solving dry years; grid-scale storage helps with peaks too. Huntly stays available as a ' +
          'true-emergency backup rather than a routine part of the mix.',
      },
      {
        heading: 'What they rule out, and why',
        body:
          'The document explicitly rejects three things. The LNG import terminal, on the grounds it locks in imported ' +
          'fuel and exposure to volatile international prices. Structural separation of the gentailers, as lengthy and ' +
          'costly without addressing what they see as the real problem — the incentive to underinvest. And counting ' +
          'deep core geothermal or fusion in the planned generation mix, as unproven at grid scale, while supporting ' +
          'research and noting the capacity scheme is technology-neutral if a breakthrough comes.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they say it would cost',
      rows: [
        { period: 'Ringfenced dividends', amount: '~$500m/yr' },
        { period: 'Bus electrification', amount: 'Up to $125m/yr' },
        { period: 'Community generation', amount: 'Up to $100m/yr' },
        { period: 'Warmer Kiwi Homes', amount: '~$80m/yr' },
        { period: 'Administration', amount: '~$21m/yr' },
      ],
      basis:
        'Every operating cost is drawn from the ringfenced dividends rather than new revenue — but the document is ' +
        'explicit that taking that money out of core Crown revenue is itself a cost needing another source, and names ' +
        'the land value tax. The Capacity Investment Scheme sits separately as a contingent liability on the balance ' +
        'sheet with a stated expected value of $0, since it is designed never to pay out. TOP also publishes the ' +
        'assumptions behind its jobs, GDP and savings claims, citing MBIE and Sense Partners, BERL, Treasury, ' +
        'Powerswitch, Rewiring Aotearoa and BBVA Research.',
    },

    quotes: [
      {
        text: 'New Zealand is an energy-rich country that behaves as though we are energy-poor.',
        context: 'Opening line',
      },
      {
        text: 'This will take this funding away from core crown revenue, so represents a direct cost that will need to be funded through other revenue sources; like the land value tax.',
        context: 'Frequently asked questions — how much will all this cost?',
      },
      {
        text: 'No. This locks us in to long-term reliance on imported LNG.',
        context: 'Asked whether they support the Government’s LNG import terminal',
      },
      {
        text: 'Modelling the impact of large-scale policies like these is necessarily difficult and uncertain. We have taken a conservative approach to the claims we make and based these on similar modelling by reputable bodies.',
        context: 'Justifying the jobs, GDP and household savings claims',
      },
    ],

    openQuestions: [
      'The summary promises direct household savings of “$500+” a year, while the assumptions table behind it works to $600.',
      'The whole plan is paid for by ringfencing dividends the Crown already collects, which the document says must then be replaced from elsewhere — it names the land value tax, so this policy leans on the tax policy passing too.',
      'The Capacity Investment Scheme is carried as a contingent liability with an expected value of $0, and the document acknowledges risk if power prices fall sharply without quantifying it.',
      'Consolidating 29 distributors into six to eight is stated as the outcome, but not whether it would happen by merger, regulation or compulsion.',
      'The GDP claim rests on about $45 billion of capital spending — half of an estimated $30 billion grid and $60 billion generation total, assumed to be genuinely new rather than already planned. That assumption is stated but not tested.',
      'Bus electrification is a mandate on councils that the document says will be fully centrally funded, but it does not say who ends up owning the vehicles and charging assets.',
    ],

    source: {
      documentTitle: 'Abundant Energy Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'February 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    // Economy only. The document's housing content — the Crown Build Guarantee
    // and the GST return on new builds — defers to a Housing Policy we don't
    // have, so there is nothing here to put on the housing page.
    topics: ['economy'],
    party: 'top',
    slug: 'intergenerational-infrastructure',
    title: 'Intergenerational Infrastructure: borrowing $60bn and taking the politics out',
    summary:
      'TOP would legislate Te Waihanga’s 30-year National Infrastructure Plan so a single government cannot dismantle ' +
      'it, and borrow up to $60 billion — about 15 percent of GDP — over five to ten years to fund it through six ' +
      'named funds. Sixty percent of infrastructure spending would be mandated to maintaining what already exists. ' +
      'Te Waihanga would grow into a National Infrastructure Agency with backstop powers over councils and agencies ' +
      'that let their assets run down.',

    facts: [
      { label: 'Spent now', value: '$20bn+ a year', note: 'Roughly 5% of GDP' },
      { label: 'Proposed borrowing', value: '$60bn', note: 'Up to 15% of GDP extra, built up over 5–10 years' },
      { label: 'Interest cost', value: '$2.5–3.5bn a year', note: 'Under 1% of GDP' },
      { label: 'Maintenance mandate', value: '60% of spend', note: 'Directed to the assets we already own' },
      { label: 'Public debt today', value: '51% of GDP', note: 'Against an OECD average around 112%' },
      { label: 'Operating cost', value: '~$167m a year', note: 'Separate from the capital borrowing' },
    ],

    coveredLabel: 'Where the $60 billion would go',
    exemptLabel: 'New funding tools for councils',

    covered: [
      'New Zealand Infrastructure Fund — $32bn, subsuming the Local Government Funding Agency and NIFFCo',
      'Local Government Regeneration Fund — $15bn for the council maintenance backlog',
      'The full Ratepayer Assistance Scheme — $5.3bn across solar, rates deferral and developer credit',
      'Climate Resilience Fund — $5bn for nature-based solutions',
      'National Land Transport Fund — $3bn ringfenced for rail, active and public transport',
      'Crown Build Guarantee and Housing Fund — $0.5bn',
    ],

    exempt: [
      'Congestion charging and tolling',
      'Value capture levies and accommodation levies',
      'User charges for services',
      'Repeal of the 30 percent cap on the Uniform Annual General Charge',
      'GST returned on high-performance new builds',
      'An end to unfunded mandates from central government',
    ],

    mechanics: [
      {
        heading: 'Putting the 30-year plan into law',
        body:
          'Te Waihanga published New Zealand’s first 30-year National Infrastructure Plan in February 2026 and the ' +
          'Government accepted all 16 recommendations, with Labour and Green support. TOP’s argument is that ' +
          'acceptance is not implementation. The Plan and its Pipeline would be given a legislative basis agreed ' +
          'across party lines, with reviews limited to a three-yearly cycle timed to fall in the middle of a ' +
          'parliamentary term rather than at the start of a new government.',
      },
      {
        heading: 'Making cancellation cost something',
        body:
          'Major projects a new government wants to cancel would need an enabling Bill and a full select committee ' +
          'process — the same route by which the commitment was made. The document is careful that this is not a veto: ' +
          'the point is a visible parliamentary process and a public record instead of a Budget footnote. Alongside it, ' +
          'a public progress scorecard published at 100 days, 12 months and three years against the pipeline.',
      },
      {
        heading: 'Readiness reviews tied to the money',
        body:
          'All major government-funded investment proposals would face an independent readiness review by Te Waihanga ' +
          'before approval. The Government has already accepted this; TOP’s addition is enforcement — Treasury capital ' +
          'allocations would be conditional on passing it. Projects that fail the review, CBAx cost-benefit analysis or ' +
          'the maintenance threshold do not proceed.',
      },
      {
        heading: 'Maintenance before new builds',
        body:
          'The Plan proposes 60 percent of future infrastructure spending go to maintenance, and TOP would mandate and ' +
          'fund it, with Te Waihanga setting the standards that central and local entities are measured against. The ' +
          'document’s evidence for the problem is blunt: in 2025, 12 of 31 central government agencies — including ' +
          'Police and Defence — had no asset register at all. Every asset-owning public entity would have to name an ' +
          'executive legally and professionally accountable for asset stewardship.',
      },
      {
        heading: 'Backstop powers',
        body:
          'Where poor planning or deferred maintenance is found, Te Waihanga could ask the Audit Office to open a ' +
          'formal review, publicly reprimand the chief executive and the mayor or chair, and in extreme cases send ' +
          'experts in directly. The document compares this to the Auditor-General — an independent officer who can ' +
          'make adverse findings about elected bodies without replacing them — and reserves direct intervention for ' +
          'extreme cases.',
      },
      {
        heading: 'The skills gap, and using what exists first',
        body:
          'The OECD ranks New Zealand last of 33 countries for professionalisation and accountability in asset ' +
          'management. Public entities managing assets above a threshold would have to staff their leadership with ' +
          'certified asset management practitioners. Separately, every infrastructure body would have to formally ' +
          'consider demand management — load-spreading, time-of-use charging, better use of what exists — before ' +
          'committing to new capital.',
      },
      {
        heading: 'The case for borrowing $60 billion',
        body:
          'Gross public debt is around 51 percent of GDP against an OECD average near 112 percent, with an AA to AAA ' +
          'credit rating. On that basis the document argues an extra 15 percent of GDP in special infrastructure debt ' +
          'is safe, costing $2.5 to $3.5 billion a year in interest and lifting infrastructure spending from 5–6 ' +
          'percent of GDP to 6–7 percent. Its counter-argument is that deferring maintenance is also borrowing — just ' +
          'invisibly, from future generations, as degraded assets.',
      },
      {
        heading: 'A New Zealand Infrastructure Fund',
        body:
          'The largest of the six funds at $32 billion. It would absorb and extend the Local Government Funding ' +
          'Agency, whose lending book is approaching $30 billion, and NIFFCo. It could issue special purpose bonds ' +
          'against user-pays revenue for water, energy and tolled roads, borrow generally where costs cannot be ' +
          'recovered, and keep lending to councils and council-controlled organisations.',
      },
      {
        heading: 'Rebuilding local government funding',
        body:
          'The document’s position is that central government has captured the tax windfall from regional growth while ' +
          'passing councils unfunded mandates, leaving them dependent on rates. It calls centrally imposed rate caps a ' +
          'blunt instrument that misses the real problem. Alongside the new revenue tools: benchmarking and ' +
          'value-for-money audits, regional pooling of back-office functions and procurement, and technical support ' +
          'for smaller and rural councils on complex financing.',
      },
      {
        heading: 'Why not public-private partnerships',
        body:
          'The objection is specifically to the financing model, not private delivery. The document cites a 2023 ' +
          'Treasury review finding higher financing costs than direct Crown borrowing in most New Zealand PPPs, with ' +
          'risk transfer proving illusory in several contracts, and argues PPPs end up on the Crown balance sheet ' +
          'either formally or in practice. Design-and-build contracts, operations and maintenance concessions and ' +
          'service contracts are all supported.',
      },
      {
        heading: 'Avoiding a Christchurch-style cost spike',
        body:
          'The document names construction cost inflation as “the most legitimate technical risk in the policy”. Its ' +
          'answer is that Christchurch was a sudden unplanned demand spike in one region, where this is a paced, ' +
          'nationally coordinated build-up with Te Waihanga levelling workloads in dialogue with industry — and that ' +
          'the 60 percent maintenance share means much of the money goes to repair and renewal, which is less ' +
          'inflation-prone than greenfield building.',
      },
      {
        heading: 'Where KiwiSaver 2.0 comes in',
        body:
          'The link to TOP’s tax policy is explicit: as compulsory KiwiSaver 2.0 balances grow they will need ' +
          'securities to invest in, and infrastructure bonds owned by New Zealanders keep the cashflows domestic, ' +
          'reduce reliance on offshore debt markets and give citizens a direct stake in the assets.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they say it would cost',
      rows: [
        { period: 'Additional borrowing', amount: '$60bn' },
        { period: 'Annual interest', amount: '$2.5–3.5bn' },
        { period: 'Total operating', amount: '~$167m/yr' },
        { period: 'Free public transport', amount: '$150m/yr' },
        { period: 'Enhanced Te Waihanga', amount: '$27m/yr' },
      ],
      basis:
        'The $60 billion is capital borrowed over about ten years, not annual spending. Operating costs are small ' +
        'beside it: an enlarged Te Waihanga is benchmarked at $80 million against the UK’s new combined ' +
        'infrastructure agency, of which about $53 million already exists across Te Waihanga, NIFFCo and Crown ' +
        'Infrastructure Delivery, leaving $27 million new. Free public transport is costed net — roughly $300 million ' +
        'of fare revenue forgone, less savings the document puts at $80–90 million on the planned national ticketing ' +
        'system, $30–40 million on cash handling and back office, and $30–40 million from 20 percent faster boarding.',
    },

    quotes: [
      {
        text: 'The problem is not money alone. It is politics.',
        context: 'Opening statement of the problem',
      },
      {
        text: 'In 2025, 12 of 31 central government agencies; including Police, Defence and several Ministries failed to meet the basic requirement of having an asset register.',
        context: 'Use and maintain what we have before building new',
      },
      {
        text: 'The enhanced Te Waihanga’s first job is ruthless prioritisation: hospitals before roads, maintenance before new builds, evidence before politics.',
        context: 'Asked whether this adds to an already unaffordable pipeline',
      },
      {
        text: 'politicians find it far easier to cut a ribbon on a new building than to fund a pipe replacement programme that no one photographs.',
        context: 'Asked how the 60 percent maintenance mandate handles genuinely new needs',
      },
    ],

    openQuestions: [
      'Free public transport is costed at $150 million a year in the FAQ but appears nowhere in the policy itself — there is no description of what it covers, who is eligible, or when it would start.',
      'The enabling Bill requirement applies to projects “over a certain threshold” in the policy and over $250 million in the FAQ.',
      'The Regeneration Fund is described in the FAQ as “$6,000-per-head”, but $15 billion across New Zealand’s population is closer to $2,800 each, and the document does not say what the figure is per.',
      'The $275 billion existing pipeline is called explicitly unaffordable and Te Waihanga is to prioritise ruthlessly, but nothing in the document names what would be dropped.',
      'The 60 percent maintenance mandate is said to apply to the portfolio rather than any individual agency, and Te Waihanga would assess each entity against its own asset base — so what the 60 percent actually binds is left open.',
      'Certified asset management staffing is required of entities holding assets “over a certain threshold”, which is not specified.',
    ],

    source: {
      documentTitle: 'Intergenerational Infrastructure Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'August 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    // Economy only, though it carries real education content (polytechnic
    // funding, student loans) and an immigration section. Filing it on those
    // pages too would surface mostly-irrelevant material to a reader who came
    // for schools or migration.
    topics: ['economy'],
    party: 'top',
    slug: 'breakthrough-economy',
    title: 'Breakthrough Economy: research, competition law and small business',
    summary:
      'TOP would lift research and development spending from 1.5 percent of GDP to 2 percent within a decade and 3 ' +
      'percent by 2050, add a tax credit covering up to a quarter of the cost of adopting new technology, and give ' +
      'the Commerce Commission power to ask the High Court to break up dominant companies. Smaller measures cover ' +
      'polytechnics, start-ups, student loan interest for returning graduates and a new Impact Company structure. ' +
      'The whole package is costed at $1.33 billion a year.',

    facts: [
      { label: 'R&D spending now', value: '1.5% of GDP', note: 'OECD average is 2.7%; frontier economies over 3%' },
      { label: 'R&D target', value: '2% within 10 years', note: 'At least 0.6% public science, rising to 3% by 2050' },
      { label: 'Technology credit', value: 'Up to 25%', note: 'Of the cost of AI, plant, machinery and autonomous equipment' },
      { label: 'Cost', value: '$1.33bn a year', note: 'Additional operating funding, itemised across 13 lines' },
      { label: 'Concentration cost', value: '$30 a week', note: 'Claimed cost to the average household' },
      { label: 'The gap with Australia', value: '35%', note: 'In per-capita GDP' },
    ],

    coveredLabel: 'New powers for the Commerce Commission',
    exemptLabel: 'Support aimed at small business',

    covered: [
      'Ask the High Court to order dominant companies to sell assets or separate operations where competition has clearly failed',
      'Require access to key infrastructure when market power is too concentrated',
      'Impose industry-wide remedies after a market study, or where there is tacit collusion',
      'Take binding commitments as part of market dominance investigations',
      'Launch investigations and market studies proactively, without waiting for a complaint',
      'A Consumer Advocacy Fund so consumers are represented in reviews as effectively as corporates',
    ],

    exempt: [
      'FinCap funded to give small businesses simple financial and accounting advice',
      'A review of ACC levies toward risk-weighting for people doing several kinds of work',
      'Reversing the ban on merchant surcharges, if it passes',
      'A simplified R&D tax credit track for spending under $250,000, with processing time requirements',
      'Innovation access programmes letting small firms join R&D consortia with universities and polytechnics',
      'A new Impact Company structure, with investment deductible like a charitable donation up to $100,000 a year',
    ],

    mechanics: [
      {
        heading: 'Getting research spending up',
        body:
          'The document’s framing figure is that New Zealand spends 1.5 percent of GDP on R&D, which it compares to ' +
          'Poland and Turkey, against an OECD average of 2.7 percent. It would recommit to a 2 percent target within ' +
          'ten years with at least 0.6 percent public science, and set 3 percent by 2050. In the near term that means ' +
          'restoring the 2024 science reorganisation cuts — which the Save Science Coalition puts at $90 million a ' +
          'year and 550 jobs, and the Royal Society Fellows at $300 million in total — and lifting funding back to ' +
          'inflation-adjusted 2018 levels, with a new fund for early and mid-career researchers and the humanities and ' +
          'social sciences brought into contestable rounds.',
      },
      {
        heading: 'A credit for adopting technology, not just inventing it',
        body:
          'The existing R&D tax credit is described as delivering good returns but stopping short of the large ' +
          'investments needed to actually roll technology out. A new credit would let firms claim back up to 25 ' +
          'percent of the cost of deploying AI and digital platforms, new plant and machinery, and networked or ' +
          'autonomous equipment. At $600 million it is by far the largest line in the policy.',
      },
      {
        heading: 'Polytechnics as regional productivity engines',
        body:
          'Baseline funding cut by the current government would be restored and pointed at practical business skills — ' +
          'market development, export access, cashflow, finance. Polytechnics and public research organisations would ' +
          'be bulk-funded up to $10,000 per business enquiry to work on real problems, and given an explicit mandate ' +
          'to lead regional productivity growth as hubs for sector initiatives.',
      },
      {
        heading: 'Doubling the start-up ecosystem',
        body:
          'Government funding for incubators, accelerators, deep tech and young enterprise programmes would double. ' +
          'The document is unusually frank here: it says these programmes appear to have crowded in private investment ' +
          'and improved start-up survival, but that monitoring and evaluation has been weak, and commits to a ' +
          'systematic review before any further expansion.',
      },
      {
        heading: 'Forgiving loan interest to bring graduates home',
        body:
          'Student loan interest accrued over up to three years spent overseas would be rolled back, for both new ' +
          'graduates and those already abroad. The relief applies at the end of loan repayment and is conditional on ' +
          'being resident in New Zealand when the loan is repaid — the stated intent being to encourage people to go ' +
          'and get experience, then come back with it.',
      },
      {
        heading: 'A population policy instead of ad hoc migration',
        body:
          'Rather than a target, the policy is a process: a long-term population strategy setting out desired ' +
          'population outcomes with average net migration to match, shaped by input from business, unions, NGOs and ' +
          'the public. The document’s own position within that is “moderate sustained positive migration”, and it ' +
          'argues migration has not been matched by investment in infrastructure and services for decades.',
      },
      {
        heading: 'Rewriting competition law',
        body:
          'The central claim is that New Zealand has one of the weakest competition regimes in the world, that it is ' +
          'modelled on Australia’s, and that the two are near-unique among developed nations in lacking the power to ' +
          'break up monopolies, impose industry-wide conduct obligations or address tacit collusion. The proposal is ' +
          'modelled on recent EU and UK provisions, and is aimed at banking, supermarkets, insurance, building ' +
          'supplies, aviation and utilities. The document calls this a shakeup rather than tinkering, and names the ' +
          'Commerce Act Amendment Bill currently before Parliament as the tinkering.',
      },
      {
        heading: 'Why not simply break up the banks and supermarkets',
        body:
          'TOP says it is open to structural separation in banking, supermarkets and electricity generation, but ' +
          'treats it as a blunt instrument that always imposes cost and disruption, so it should follow expert ' +
          'analysis and be supervised by the courts. The argument for the power rather than the act: the threat of it ' +
          'improves behaviour across the board, and a court route lets the Commission reach concentrated sectors that ' +
          'attract no political or media attention.',
      },
      {
        heading: 'The Impact Company',
        body:
          'A new structure in the Companies Act for businesses that want both growth and a social or environmental ' +
          'purpose, modelled on structures in the UK, Canada, the United States and Italy. Qualifying means stating ' +
          'the purpose in the constitution and publishing annual Impact Reports on social and environmental outcomes. ' +
          'Investors could deduct up to $100,000 a year as they would a charitable donation.',
      },
    ],

    examples: [],

    revenue: {
      heading: 'What they say it would cost',
      rows: [
        { period: 'Technology adoption credit', amount: '$600m' },
        { period: 'Science funding', amount: '$400m' },
        { period: 'Polytechnics', amount: '$100m' },
        { period: 'Student loan interest', amount: '$95m' },
        { period: 'Everything else', amount: '$135.5m' },
        { period: 'Total', amount: '$1.33bn' },
      ],
      basis:
        'The document itemises all 13 components with an assumption stated against each, and the lines add to $1,330.5 ' +
        'million — exactly the $1.33 billion total it claims. Science funding here combines restoring recent cuts ' +
        '($125m), early and mid-career researchers ($100m) and the major contestable funds ($175m). Polytechnics ' +
        'combines restored baseline funding ($80m) with bulk funding for business enquiries ($20m). The party labels ' +
        'two of its own estimates arbitrary — the Commerce Commission uplift and the widened R&D credit — and says ' +
        'remaining measures are legislative changes absorbable within departmental baselines.',
    },

    quotes: [
      {
        text: 'New Zealand’s economy is stuck in low gear. But we have the talent, resources, and opportunity to shift up.',
        context: 'Opening line',
      },
      {
        text: 'Mining the conservation estate and trawling our ocean-floors are short term solutions, and the economic, social and environmental bills are coming due.',
        context: 'On good and bad ways to grow the economy',
      },
      {
        text: 'New Zealand has one of the weakest competition regimes in the world.',
        context: 'Strengthen competition law and enforcement',
      },
      {
        text: 'Yes. We think the current state of competition in many business sectors warrants a shakeup, rather than continued tinkering like the current Commerce Act Amendment Bill before Parliament.',
        context: 'Asked whether this is a dramatic shakeup of competition law',
      },
    ],

    openQuestions: [
      'The document is titled Breakthrough Economy but refers to itself twice as “Productivity Unleashed” in its own FAQ, without reconciling the two names.',
      'The claim that market concentration in banking, supermarkets and building materials costs the average household $30 a week is stated without a source.',
      'Two costings are described by the party itself as arbitrary — a 20 percent uplift to the Commerce Commission’s budget and a 5 percent expansion of the R&D credit.',
      'The claim of up to 2 percent additional long-term GDP growth is supported by comparison to Singapore and Estonia and a list of multipliers from other jurisdictions, but is not modelled for New Zealand.',
      'Student loan interest forgiveness is costed at half the $170–215 million annual accrual, and the document notes much of that is paper accrual on defaulted loans and that borrower behaviour could change — but does not test what happens if it does.',
      'The population policy sets no migration number, deferring it to a consultation; “moderate sustained positive migration” is the only stated direction.',
      'AI regulation is central to the productivity case but deferred entirely to a separate AI policy not included in this document.',
    ],

    source: {
      documentTitle: 'Breakthrough Economy Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'July 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['democracy-government'],
    party: 'top',
    slug: 'citizens-voice',
    title: 'Citizens’ assemblies and a Commissioner for Citizens’ Voice',
    summary:
      'TOP would create citizens’ assemblies — randomly selected groups of New Zealanders, the same number as there ' +
      'are MPs, working for up to a year on one long-term problem — overseen by a new Parliamentary Commissioner for ' +
      'Citizens’ Voice. Parliament would have to formally debate and respond to each set of recommendations, and the ' +
      'Commissioner would report publicly on what happened next.',

    facts: [
      { label: 'Assembly size', value: 'One per MP', note: 'The same number of citizens as there are MPs in the current Parliament' },
      { label: 'Who takes part', value: 'Randomly selected', note: 'Chosen to be representative, not elected or appointed' },
      { label: 'How long', value: 'Up to a year', note: 'Depending on the complexity of the issue' },
      { label: 'New office', value: 'Commissioner', note: 'A Parliamentary Commissioner for Citizens’ Voice, appointed by Parliament' },
      { label: 'Parliament must', value: 'Debate and respond', note: 'Formally, to each set of recommendations' },
      { label: 'Petition example', value: '150,000 signatures', note: 'Given as an example of a public trigger, not a fixed rule' },
    ],

    mechanics: [
      {
        heading: 'What a citizens’ assembly is',
        body:
          'A group of New Zealanders — the same number as there are MPs — selected at random so the group is broadly ' +
          'representative of the country. They are given one issue, access to evidence and expert briefings, and up to ' +
          'a year to work through it, ending in a set of recommendations. The document’s central claim is about who ' +
          'those recommendations come from: the participants themselves, rather than politicians, officials, experts ' +
          'or groups with an interest in the outcome.',
      },
      {
        heading: 'The Commissioner',
        body:
          'A Parliamentary Commissioner for Citizens’ Voice would run the process. The document draws the comparison ' +
          'to the Ombudsman: appointed by Parliament, but independent of both Parliament and the government of the ' +
          'day. The Commissioner would convene assemblies, choose which issues go to them, and report on what ' +
          'Parliament did with the results.',
      },
      {
        heading: 'How an issue gets picked',
        body:
          'Four routes are described. Parliament can ask the Commissioner to take up a question. The public can ' +
          'petition — the document uses 150,000 signatories as its example of the kind of threshold involved. The ' +
          'Commissioner can initiate an assembly independently, drawing on research or public debate. And iwi, ' +
          'community organisations or experts can raise an issue directly.',
      },
      {
        heading: 'What Parliament has to do with the result',
        body:
          'Recommendations are not binding. What is proposed instead is a duty to engage: Parliament would be ' +
          'required to formally debate them and respond. The Commissioner would then publish annual reports tracking ' +
          'those responses, with assembly documents and proceedings public so the reasoning behind a set of ' +
          'recommendations can be read alongside the government’s answer to it.',
      },
      {
        heading: 'The problem it is aimed at',
        body:
          'The case made is about time horizons. Some questions — the document’s framing is long-term challenges ' +
          'needing public buy-in — sit badly with a three-year electoral cycle, and others have become too ' +
          'politically charged for Parliament to handle. An assembly is offered as a way to get a considered public ' +
          'answer on exactly those.',
      },
      {
        heading: 'The example it uses',
        body:
          'The document points to the Treaty Principles Bill as its illustration: a constitutional question it argues ' +
          'should have been worked through as a national conversation involving both Treaty partners, rather than ' +
          'settled by the politics of one term. The characterisation is TOP’s own — the point being made is about ' +
          'process, not about the Bill’s contents.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'What if there were a way to ensure that New Zealanders had a direct voice in the big, long-term decisions that will affect their lives most?',
        context: 'The question the policy opens with',
      },
      {
        text: 'The critical difference here is that recommendations will come directly from the people involved in these processes, not from politicians, officials or experts, or groups with vested interests.',
        context: 'On what makes an assembly different',
      },
      {
        text: 'Citizens assemblies can consider issues that politicians are too scared to touch, or that have become too politicised for reasonable debate, finding a way through the mire.',
        context: 'On the kind of issue it is for',
      },
      {
        text: 'It has the potential to shape how we define ourselves as a nation for generations to come - far too important an issue to leave to the politicians.',
        context: 'On the Treaty Principles Bill, given as the worked example',
      },
    ],

    openQuestions: [
      'No cost is given — not for the Commissioner’s office, not for running an assembly, and not for supporting participants for up to a year.',
      'The 150,000-signature figure is offered as an example rather than a commitment, so the actual petition threshold is undecided.',
      'Members are described as randomly selected and representative, but how they are recruited, paid, or released from work for a year is not set out.',
      'Parliament must debate and respond, but nothing follows from a rejection — the accountability described is publicity through annual reports, not consequence.',
      'The Commissioner would choose between competing topics using transparent criteria, which are named but never defined.',
      'This document is dated June 2025, a year older than the rest of TOP’s published policy set, so it may not reflect the party’s current 2026 position.',
    ],

    source: {
      documentTitle: 'Citizen’s Voice Policy Overview',
      publisher: 'The Opportunities Party',
      documentDate: 'June 2025',
      retrieved: '2026-08-16',
    },
  },

  // ── ACT ───────────────────────────────────────────────────────────────────

  {
    // First deep dive on immigration for any party.
    topics: ['immigration'],
    party: 'act',
    slug: 'making-immigration-work',
    title: 'Making immigration work: deportation, visas and a welfare stand-down',
    summary:
      'ACT would let resident visa holders convicted of offences carrying 10-year sentences be deported however long ' +
      'they have lived here, make skilled work visa categories expire every year unless demand is proved again, bar ' +
      'new residents from income-tested benefits for five years, and add a $6-a-day infrastructure surcharge to ' +
      'temporary work visas. English requirements would extend to all work visa levels, and a dedicated overstayer ' +
      'enforcement unit would be set up inside Immigration New Zealand.',

    facts: [
      { label: 'Deportation threshold', value: '10-year sentences', note: 'Liability however long someone has been resident' },
      { label: 'Welfare stand-down', value: 'Five years', note: 'No jobseeker, accommodation supplement or income-tested benefits' },
      { label: 'Infrastructure surcharge', value: '$6 a day', note: 'On temporary work visas, expected to raise about $80m a year' },
      { label: 'Visa categories', value: 'Expire yearly', note: 'Reopened only on up-to-date evidence of demand' },
      { label: 'Known overstayers', value: '20,980', note: 'The figure the policy cites' },
      { label: 'English requirements', value: 'All AEWV types', note: 'Currently absent from three of the five levels' },
    ],

    // The document's own evidence for its visa argument, set out as it sets it
    // out. The counts are raw approvals; what they are missing is in the open
    // questions rather than editorialised here.
    coveredLabel: 'Approvals the policy points to',
    exemptLabel: 'The skilled roles it compares them with',

    covered: [
      'Fast food workers — 2,480 approved',
      'Beauty therapists — 2,119 approved',
      'Newspaper deliverers — 35 approved',
    ],

    exempt: [
      'Software engineers — 1,052 approved',
      'Biomedical engineers — 30 approved',
    ],

    mechanics: [
      {
        heading: 'Deporting serious offenders',
        body:
          'Resident visa holders convicted of offences carrying sentences of 10 years or more could be deported no ' +
          'matter how long they had been in New Zealand. The document frames residency as a privilege and argues ' +
          'that because victims face no time limit on their suffering there should be none on accountability. It ' +
          'notes this goes further than the current Government proposal, which extends liability to 20 years.',
      },
      {
        heading: 'Making visa categories expire',
        body:
          'Accredited Employer Work Visa skill categories would automatically expire each year, and could only stay ' +
          'open on up-to-date evidence of demand. The argument is that the categories are meant to fill crucial skills ' +
          'gaps but stay wide open after the gaps close.',
      },
      {
        heading: 'A five-year welfare stand-down',
        body:
          'All residence class visa holders would be barred from jobseeker support, the accommodation supplement and ' +
          'income-tested benefits for their first five years. The stated principle: coming to New Zealand should be a ' +
          'path to opportunity rather than to welfare.',
      },
      {
        heading: 'A surcharge for infrastructure',
        body:
          'A $6-a-day infrastructure surcharge on temporary work visas, on top of existing charges, so that migrants ' +
          'contribute from day one and before they start paying tax. The document puts the revenue at around $80 ' +
          'million a year and says the charge would remain more affordable than comparable visas in Australia and the ' +
          'United Kingdom.',
      },
      {
        heading: 'English language requirements',
        body:
          'Basic English requirements would extend to all Accredited Employer Work Visa types, which the document says ' +
          'currently have none at three of five levels, with higher standards for student and resident visa holders ' +
          'and lower standards permitted for seasonal workers.',
      },
      {
        heading: 'Enforcement against overstaying',
        body:
          'A dedicated overstayer enforcement unit would be established within Immigration New Zealand. Platform ' +
          'employers such as Uber and DoorDash would have to verify and report work rights, and employers who ' +
          'facilitate overstaying would lose their accreditation.',
      },
    ],

    examples: [],

    quotes: [
      { text: 'Residency is a privilege.', context: 'Deport serious offenders' },
      {
        text: 'Coming to New Zealand should be a path to opportunity - not a path to welfare.',
        context: 'Opportunity, not dependency',
      },
      {
        text: 'ACT will extend basic English language requirements to all AEWV types, with higher standards for student and resident visa holders.',
        context: 'Stronger English language requirements',
      },
      {
        text: 'Platform employers such as Uber and DoorDash will be required to verify and report work rights.',
        context: 'Enforce the rules',
      },
    ],

    openQuestions: [
      'The deportation threshold is written as offences “carrying sentences of 10 years or more”, which does not say whether it means the maximum penalty available for the offence or the sentence actually imposed — a distinction that decides how many people it reaches.',
      'The visa approval figures are raw counts. “Since July 2022” is attached to the first comparison only, no period is given for the second, and none of them say how many people applied.',
      'What counts as “basic” English, and what the higher standards for students and residents would be, is not specified.',
      'The five-year stand-down is stated for all residence class visa holders without saying whether it reaches refugees and protected persons, or people who already hold residence.',
      'How the $6-a-day surcharge would be charged — upfront for the visa term, or as an ongoing levy — is not described beyond the $80 million estimate.',
      'The size, cost and powers of the overstayer enforcement unit are not stated.',
    ],

    source: {
      documentTitle: 'Making immigration work for New Zealand',
      publisher: 'ACT New Zealand',
      documentDate: '3 May 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    // First deep dive on education for any party.
    topics: ['education'],
    party: 'act',
    slug: 'class-disruption',
    title: 'Teacher authority and classroom disruption',
    summary:
      'ACT would give teachers an explicit legal power to order a disruptive student out of the classroom, with ' +
      'reasonable force available if the student refuses twice. Staff acting in good faith would get clear legal ' +
      'protection, an assault on anyone at school would automatically trigger removal and a stand-down or suspension, ' +
      'and parent meetings would become mandatory for serious or repeated behaviour — enforced with fines of up to ' +
      '$3,000 and liability for deliberate property damage.',

    facts: [
      { label: 'Teachers affected', value: 'About half', note: 'Deal with disruption in every lesson, per ERO' },
      { label: 'Time lost', value: '40–50 min a day', note: '47% of teachers say they lose this much or more' },
      { label: 'PISA ranking', value: 'Lowest in the OECD', note: 'For disciplinary climate in maths classes' },
      { label: 'Parent fines', value: 'Up to $300', note: 'First offence; up to $3,000 for subsequent ones' },
      { label: 'The removal power', value: 'Held by the teacher', note: 'Sitting below stand-down and suspension' },
      { label: 'Law changed', value: 'Education and Training Act 2020', note: 'Including section 80 on stand-downs' },
    ],

    coveredLabel: 'When a parent meeting is mandatory',
    exemptLabel: 'What the policy rules out',

    covered: [
      'Violence, threats, intimidation or destruction of property — on the first occurrence',
      'Refusing to leave the classroom after being lawfully directed — on the first occurrence',
      'Repeated low-level disruption, but only where the parent has not already engaged with the school in good faith',
      'Non-engagement itself escalates, to the Ministry of Education or the Oranga Tamariki and Police Youth Aid pathway',
    ],

    exempt: [
      'Any return to physical discipline',
      'Seclusion rooms, banned in 2017 after the Miramar case',
      'Empty or lockable rooms as a destination for removed students',
      'Leaving a refusal with the classroom teacher rather than escalating it',
    ],

    mechanics: [
      {
        heading: 'The power to remove a student',
        body:
          'An explicit legal power for classroom teachers to direct a student to leave the room for serious or ' +
          'persistent disruption. The document compares its operation to the school cell phone ban: a fast frontline ' +
          'tool held by the teacher, sitting below the formal stand-down and suspension processes rather than ' +
          'replacing them. Under the new law, defiant students must leave.',
      },
      {
        heading: 'Where a removed student goes',
        body:
          'To a supervised, staffed space in the school — an existing pastoral office, deans’ room or learning support ' +
          'room. The document draws an explicit line here: not an empty or lockable room, which is what separates this ' +
          'from the seclusion rooms banned in 2017 after the Miramar case, where children were locked in confinement ' +
          'as punishment.',
      },
      {
        heading: 'If a student refuses to go',
        body:
          'A refusal escalates to a dean or senior leader rather than being left with the teacher, and continued ' +
          'refusal triggers a mandatory parent meeting on the first occurrence. Where a student refuses after being ' +
          'lawfully directed and refuses again after escalation, staff may use reasonable force to remove them from ' +
          'the classroom.',
      },
      {
        heading: 'Protection for staff who intervene',
        body:
          'Clear legal protection for staff using reasonable and proportionate intervention to prevent harm, including ' +
          'reasonable physical restraint, consistent with the existing boundaries in section 99 of the Education and ' +
          'Training Act 2020. The protection would extend to restraint used to prevent destruction of property. ACT ' +
          'says it would clarify those existing boundaries so teachers know what is permitted, without adding ' +
          'paperwork.',
      },
      {
        heading: 'Automatic consequences for assault',
        body:
          'Any assault on a teacher, student or staff member would trigger immediate removal followed by a mandatory ' +
          'stand-down or suspension, which the document says ends the current school-by-school inconsistency. Where an ' +
          'assault crosses the criminal threshold, the first occurrence goes to Police Youth Aid under the existing ' +
          'Oranga Tamariki Act, without waiting for it to happen again.',
      },
      {
        heading: 'Parents share responsibility',
        body:
          'Meetings become mandatory when behaviour repeats or turns serious, targeted at disengaged parents rather ' +
          'than those already working with the school. A parent who misses a mandatory meeting without reasonable ' +
          'excuse can be fined up to $300 for a first offence and up to $3,000 after that, on a regime the document ' +
          'compares to school attendance. Parents may also be held liable for the cost of deliberate property damage ' +
          'caused by their child, recoverable as a debt.',
      },
      {
        heading: 'What changes in law',
        body:
          'The Education and Training Act 2020 would be amended to create the removal power, clarify good-faith ' +
          'intervention, mandate the automatic response to assaults, require parent meetings, escalate parental ' +
          'non-engagement and make parents liable for deliberate damage. Section 80 would be updated to reflect that ' +
          'stand-downs and suspensions become mandatory.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'ACT will give classroom teachers an explicit legal power to direct a student to leave the room for serious or persistent disruption, backed in law, very much like the operation of the school cell phone ban.',
        context: 'Power to remove disruptive students',
      },
      {
        text: 'Where a student refuses to leave after being lawfully directed to do so, and refuses again after escalation, staff may use reasonable force to remove the student from the classroom.',
        context: 'Power to remove disruptive students',
      },
      {
        text: 'This is not an empty or lockable room, a distinction that separates it from the seclusion rooms banned in 2017 following the Miramar case, where children were locked in confinement as punishment.',
        context: 'Where removed students go',
      },
      {
        text: 'back the right of the majority to learn - without any return to physical discipline.',
        context: 'Opening summary of the policy',
      },
    ],

    openQuestions: [
      '“Reasonable force” is not defined. The document points to the existing boundaries in section 99 and says it would clarify them, but the clarification itself is not set out.',
      'Removed students go to a staffed pastoral, deans’ or learning support room, and the document does not say what happens in schools without one available.',
      'No cost is given for the supervised spaces or the staff needed to run them.',
      'Whether the removal power applies to primary schools as well as secondary is not stated.',
      'Who decides whether a parent’s excuse for missing a meeting is reasonable, and how a fine would be issued and appealed, is not described.',
      'The document does not say whether removals would be recorded, reported or published.',
      'The learning support room is named as a destination, but the effect on students with disabilities or learning support needs is not discussed.',
    ],

    source: {
      documentTitle: 'Strengthening teacher authority and stopping class disruption',
      publisher: 'ACT New Zealand',
      documentDate: '2 August 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['environment'],
    party: 'act',
    slug: 'backing-hunters',
    title: 'Backing Hunters: game animals, access and the Game Animal Council',
    summary:
      'ACT would move responsibility for managing game animals on conservation land from DOC to the Game Animal ' +
      'Council, so hunters set the targets rather than being consulted on them, and recognise game species as valued ' +
      'natural resources instead of pests. Community groups would get first right of funding for hut and track ' +
      'maintenance, hunting groups could earn biodiversity credits, rules on venison recovery and backcountry landing ' +
      'would loosen, and two new infringement offences would cover interference with lawful hunting.',

    facts: [
      { label: 'Management transfer', value: 'DOC → Game Animal Council', note: 'For game animals on conservation land' },
      { label: 'The DOC estate', value: '950+ huts, 15,000km of tracks', note: 'Against a 30% maintenance shortfall' },
      { label: 'Closure alerts', value: '2,300+', note: 'Issued since 2021' },
      { label: 'First special herd', value: 'Stewart Island whitetail', note: 'Designated a Herd of Special Interest' },
      { label: 'Community groups', value: 'First right of funding', note: 'On multi-year contracts, where competitive' },
      { label: 'New offences', value: 'Two', note: 'Standing in the line of fire; drone or helicopter harassment' },
    ],

    coveredLabel: 'What moves to the Game Animal Council',
    exemptLabel: 'What DOC would stop doing',

    covered: [
      'Setting game animal management targets on conservation land, with full funding for the duties',
      'Restricting commercial take by animal gender where necessary',
      'Designating accessible backcountry landing sites',
      'Formal representation in predator removal decisions, alongside the NZ Deerstalkers Association',
    ],

    exempt: [
      'Managing game animals on conservation land',
      'Dictating which helicopters venison recovery operators may use — safety returns to the Civil Aviation Authority',
      'Deciding hut and track funding without offering community groups first refusal',
    ],

    mechanics: [
      {
        heading: 'Hunters setting the targets',
        body:
          'The document’s framing is that game animals on conservation land are managed by the one agency whose ' +
          'default is to control or exterminate them, and that the Game Animal Council was given a seat at the table ' +
          'rather than a hand on the levers. Transferring management to the Council is meant to change that, with full ' +
          'funding for its current and proposed duties.',
      },
      {
        heading: 'Recognising valued herds',
        body:
          'Game animal and gamebird species would be recognised in legislation as valued natural resources to be ' +
          'sustainably managed, rather than pests to be exterminated “as far as possible”. New Zealand’s most valued ' +
          'herds would be designated Herds of Special Interest, starting with Stewart Island whitetail deer. The ' +
          'document notes the current Government is already doing this for Wapiti and Sika and says the work should ' +
          'continue.',
      },
      {
        heading: 'Funding the volunteers already doing the work',
        body:
          'DOC manages more than 950 huts and 15,000km of tracks with a 30 percent maintenance shortfall and has ' +
          'issued over 2,300 closure alerts since 2021. Hunting, tramping and conservation groups already restore huts ' +
          'and maintain tracks with volunteers, but live on annual discretionary grants. DOC would be required to give ' +
          'community groups first right of funding where they can offer a competitive option, enabling multi-year ' +
          'contracts.',
      },
      {
        heading: 'Credit for pest control',
        body:
          'The Voluntary Nature Credits Market would open to accredited hunting groups so they can earn biodiversity ' +
          'credits for verified results, and the NZ Deerstalkers Association and Game Animal Council would be formally ' +
          'represented in predator removal decision-making.',
      },
      {
        heading: 'Venison recovery',
        body:
          'DOC would stop dictating which helicopters commercial venison recovery operators use, with aircraft safety ' +
          'left to the Civil Aviation Authority. In exchange, the Game Animal Council could restrict commercial take ' +
          'by animal gender where necessary — the document’s concern being that current permits let operators strip ' +
          'out the trophy stags recreational hunters value most.',
      },
      {
        heading: 'Getting into the backcountry',
        body:
          'The Game Animal Council would designate accessible landing sites, and DOC would have to adopt clear, public ' +
          'and uniform testing processes for assessing them. The document argues large areas of rugged country like ' +
          'Fiordland are closed by no-fly and no-landing zones drawn as legacy lines on a map without clear ' +
          'conservation or safety reasoning. Separately, the Outdoor Access Commission would be directed to prioritise ' +
          'hunting access in its work programme.',
      },
      {
        heading: 'Two new infringement offences',
        body:
          'One for deliberately standing in the line of fire of a lawful hunter, which the document describes as ' +
          'dangerous sabotage. One for harassing game bird shooters with drones or helicopters used to scatter or ' +
          'flush birds. The document says no specific offence currently addresses either.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand’s laws still treat game animals as pests to be controlled, and in national parks, exterminated as far as possible.',
        context: 'Opening statement of the problem',
      },
      {
        text: 'ACT will transfer responsibility for managing game animals on conservation land from DOC to the Game Animal Council, meaning hunters will set the targets rather than just being consulted.',
        context: 'Empowering hunter led management',
      },
      {
        text: 'Aircraft safety should be the Civil Aviation Authority’s job, not DOC’s.',
        context: 'Fairer venison recovery',
      },
      {
        text: 'ACT will create an infringement offence for deliberately standing in the line of fire of a lawful hunter, deterring dangerous sabotage and keeping the backcountry safe for everyone.',
        context: 'Stopping dangerous interference with hunting',
      },
    ],

    openQuestions: [
      'The introduction says game animals would be managed “within firm conservation limits”, but the limits are never defined and the document does not say who would set them once target-setting moves from DOC to the Council.',
      'The Game Animal Council would both represent hunters and set the management targets; how those two roles would sit together is not addressed.',
      'No cost is given for fully funding the Council’s current and proposed duties.',
      'Neither new infringement offence carries a stated penalty.',
      'What makes a community group’s bid “competitive” against DOC delivery, and who judges it, is not defined.',
      'Himalayan tahr are named as a treasured herd with no plan recognising their value, but the document does not say whether tahr would be designated a Herd of Special Interest.',
    ],

    source: {
      documentTitle: 'Backing Hunters',
      publisher: 'ACT New Zealand',
      documentDate: '25 July 2026',
      retrieved: '2026-08-16',
    },
  },

  {
    // Now on democracy-government, the topic this document is part of the
    // reason for. It stays on economy too: the case it makes is fiscal —
    // the "common pool" effect, deficit per spending minister, savings
    // redirected to the frontline — so a reader comparing economic policy
    // should still find it.
    topics: ['democracy-government', 'economy'],
    party: 'act',
    slug: 'smaller-government',
    title: 'A consolidated bureaucracy: 43 departments into 19',
    summary:
      'ACT would merge New Zealand’s 43 government departments into 19 and its 78 ministerial portfolios into 18, so ' +
      'that each department answers to a single minister. Ministers would appoint their own chief executives on fixed ' +
      'renewable terms and be able to remove them for non-performance or policy misalignment, and the Public Service ' +
      'Commission’s functions would move into the Department of the Prime Minister and Cabinet. The document maps ' +
      'every current department and portfolio to where it would land.',

    facts: [
      { label: 'Departments', value: '43 → 19', note: 'Norway governs a country our size with 17' },
      { label: 'Portfolios', value: '78 → 18', note: 'Against the 20 the document says Norway needs' },
      { label: 'Chief executives', value: 'Appointed by ministers', note: 'Fixed term, renewable once' },
      { label: 'Public Service Commission', value: 'Folded into DPMC', note: 'No longer a gatekeeper on appointments' },
      { label: 'Cited fiscal effect', value: '0.08–0.18% of GDP', note: 'Per spending minister, from OECD panel studies' },
      { label: 'Frontline staff', value: 'Not targeted', note: 'Consolidation aimed at duplicated head-office functions' },
    ],

    coveredLabel: 'Some of the bigger mergers',
    exemptLabel: 'Departments left as they are',

    covered: [
      'New Zealand Revenue and Customs — Inland Revenue and the Customs Service',
      'Ministry of Defence and Security — Defence, the Defence Force, GCSB and NZSIS',
      'Ministry of Justice and Law — Justice, Corrections, Police, the Serious Fraud Office, NEMA, Fire and Emergency, and Treaty Settlements',
      'Ministry of Cities, Environment, Regions and Transport — Environment, Housing and Urban Development, Transport, Local Government and Infrastructure',
      'Ministry of Health and Wellbeing — Health, Health New Zealand, the Cancer Control Agency and ACC',
      'Ministry for Culture and Heritage — Ethnic Communities, Pacific Peoples, Seniors, Women, Māori Development, and Arts, Culture and Heritage',
    ],

    exempt: [
      'The Treasury',
      'Department of Conservation',
      'Ministry for Regulation',
      'Ministry of Foreign Affairs and Trade',
      'Oranga Tamariki',
      'Ministry for Primary Industries',
      'MCERT, which the document says would keep reporting to multiple ministers',
    ],

    mechanics: [
      {
        heading: 'Fewer departments',
        body:
          'New Zealand runs 43 departments, which the document says is more than one and a half times what comparable ' +
          'countries carry, each with its own chief executive, communications team, HR and finance. They would be ' +
          'consolidated into 19, grouped around real policy domains so that one department owns an outcome rather ' +
          'than several sharing it. The document lists every current agency and the department it would land in.',
      },
      {
        heading: 'Fewer ministers',
        body:
          '78 ministerial portfolios would become 18. The argument is that splitting responsibility this far makes ' +
          'problems like housing and crime everyone’s job and nobody’s duty. Combined with the department mergers, ' +
          'each department would report to one minister for its budget and outcomes — with MCERT named as the ' +
          'exception.',
      },
      {
        heading: 'Ministers appointing and removing chief executives',
        body:
          'The document’s stated problem is that ministers are accountable for delivery but neither appoint nor can ' +
          'remove the chief executives who implement their policies. Ministers would appoint departmental chief ' +
          'executives for a fixed term, renewable once, and could remove them for specified reasons such as ' +
          'non-performance or policy misalignment. Officials would keep public service protections and the right to ' +
          'return to a lower classified role.',
      },
      {
        heading: 'What happens to the Public Service Commission',
        body:
          'It would no longer sit between ministers and key appointments. Its functions would move into the Department ' +
          'of the Prime Minister and Cabinet.',
      },
      {
        heading: 'Protecting the frontline',
        body:
          'The document is explicit that consolidation targets duplicated head-office functions — multiple ' +
          'communications offices, HR teams, finance teams and executive layers — and not nurses, teachers or police. ' +
          'Savings could go back to frontline services, to taxpayers, or to paying down debt.',
      },
      {
        heading: 'The research it rests on',
        body:
          'The case draws on the “common pool” effect, where many ministers each control part of the budget and each ' +
          'has an incentive to expand their own spending while the cost spreads across all taxpayers. OECD panel ' +
          'studies are cited putting this at roughly 0.08 to 0.18 percent of GDP in additional deficit per spending ' +
          'minister, with a 58-country study and evidence from Swiss cantons pointing the same way. The document ' +
          'lists its sources, including a 2025 New Zealand Initiative report applying the research here.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand runs one of the most fragmented executives in the developed world. It wasn’t designed, it grew by accident.',
        context: 'Opening statement',
      },
      {
        text: 'When responsibility is split this far, problems like housing and crime become everyone’s job and nobody’s duty.',
        context: 'Fewer ministers, clearer responsibility',
      },
      {
        text: 'ACT will let ministers remove chief executives for specified reasons such as non-performance or policy misalignment, but they would retain public service protections and the right to return to a lower classified role.',
        context: 'Accountable chief executives',
      },
      {
        text: 'Consolidation targets duplicated head-office functions: the multiple communications offices, HR teams, finance teams and executive layers, not nurses, teachers or police.',
        context: 'Protect the frontline',
      },
    ],

    openQuestions: [
      'No savings figure is given. The document says savings could go to frontline services, taxpayers or debt, but does not estimate them.',
      'No cost or timeline is given for carrying out the restructuring itself.',
      '“Policy misalignment” as a ground for removing a chief executive is not defined, and the document does not say who would adjudicate it.',
      'The research cited estimates the fiscal cost of each additional spending minister, but the document does not convert that into an expected saving from cutting 78 portfolios to 18.',
      'Land Information New Zealand is marked “not yet included” in the department it would otherwise join.',
      'MCERT is a stated exception to the one-department-one-minister rule, on the grounds that a newly established ministry should not be restructured yet.',
      'How many staff would be affected by consolidating duplicated head-office functions is not given.',
    ],

    source: {
      documentTitle: 'ACT’s plan for a consolidated bureaucracy',
      publisher: 'ACT New Zealand',
      documentDate: '28 June 2026',
      retrieved: '2026-08-16',
    },
  },

  // ── New Zealand First ──────────────────────────────────────────────────────
  //
  // Sourced from nzfirst.nz rather than a PDF. NZ First publishes its 2026
  // campaign policy as web pages, so these are the first dives that can link
  // straight to the document a reader is being asked to check. Their 2023
  // manifesto is deliberately not used: it predates their term in government
  // and their own site keeps it on a separate "2023 Election Policies" page.

  {
    topics: ['climate'],
    party: 'nzfirst',
    slug: 'breaking-up-the-gentailers',
    title: 'Breaking up the gentailers',
    summary:
      'NZ First would split the four big power companies into separate generation and retail businesses, on the ' +
      'argument that owning both keeps prices high and keeps cheaper retailers out. The pricing system in which the ' +
      'most expensive generator sets the price for all electricity would be replaced, holding back supply to lift ' +
      'prices would be stopped, new generation would get long-term fixed-price contracts and first use of its power, ' +
      'and households with solar could sell back at the price they pay. All under a National Energy Strategy.',

    facts: [
      { label: 'Generation controlled', value: 'Almost 90%', note: 'By the big four power companies' },
      { label: 'The split', value: 'Generators and retailers', note: 'So no company controls both the power and the price' },
      { label: 'Pricing today', value: 'The dearest sets it', note: 'Even for electricity that is cheap to generate' },
      { label: 'Solar buy-back', value: 'What you pay for it', note: 'Households selling back at the retail rate' },
      { label: 'New generation', value: 'Fixed-price contracts', note: 'Plus a guarantee their power is used first' },
      { label: 'Framework', value: 'A National Energy Strategy', note: 'Promised, with no detail given' },
    ],

    // One panel, no counterpart. These are the closures the document offers as
    // evidence; inventing a second list to balance the layout would be padding.
    coveredLabel: 'Closures the policy points to',
    covered: [
      'The mills at Karioi and Tangiwai',
      'Oji Fibre Solutions’ Penrose mill',
      'Carter Holt Harvey’s Tokoroa plywood plant and Eves Valley sawmill',
      'Balance Agri-Nutrients’ Kapuni fertiliser plant',
      'Heinz Wattie’s, which has proposed ending New Zealand manufacturing, putting 350 jobs at risk',
    ],

    mechanics: [
      {
        heading: 'Splitting generation from retail',
        body:
          'The four big power companies would be broken into separate generators and retailers. The stated problem is ' +
          'that they control almost 90 percent of generation and then sell it back to themselves, which the document ' +
          'says makes it very difficult for innovative and low-cost retailers to enter, keeping prices high.',
      },
      {
        heading: 'Changing how the price is set',
        body:
          'Under the current system the most expensive generator sets the price for all electricity, including power ' +
          'that costs very little to produce. NZ First would replace that, and stop companies holding back supply to ' +
          'drive prices higher.',
      },
      {
        heading: 'Certainty for new power stations',
        body:
          'Long-term fixed-price contracts would be guaranteed for new-build generation, along with a guarantee that ' +
          'their power is first to be used. The claimed result is more power stations, more renewable energy, more ' +
          'competition and more resilience.',
      },
      {
        heading: 'Selling your own solar back',
        body:
          'Households generating their own power would be able to sell it back to the grid at the same price they pay ' +
          'for power — a straight retail-rate buy-back rather than the lower rates typically offered now.',
      },
      {
        heading: 'A National Energy Strategy',
        body:
          'The whole package sits under a promised National Energy Strategy. The document commits to delivering one ' +
          'but does not describe what it would contain or when it would arrive.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'We will be breaking up the power companies so they can no longer control both the power and the price.',
        context: 'Opening statement of the policy',
      },
      { text: 'Energy security is national security.', context: 'On why it matters' },
      {
        text: 'Under the current system, the most expensive generator sets the price for all electricity - even electricity that costs peanuts to generate.',
        context: 'On how the price is set',
      },
      {
        text: 'If you generate power at home like solar, you should be able to sell it back to the grid at the same price you pay for it.',
        context: 'On household generation',
      },
    ],

    openQuestions: [
      'No cost, timeline or legislative vehicle is given for the split.',
      'Whether the separation would be by ownership or operational within existing companies is not stated — the difference decides how far it goes.',
      'What replaces the current pricing system is not described, beyond ending the rule that the most expensive generator sets the price.',
      'The solar buy-back is set at the retail price a household pays, and the document does not say who absorbs the gap between that and the wholesale rate.',
      'Who would hold the fixed-price contracts for new generation, and what happens if wholesale prices fall below the fixed price, is not addressed.',
      'The National Energy Strategy is promised without content or timing.',
    ],

    source: {
      documentTitle: 'Breaking up the Gentailers',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/breaking_up_the_gentailers',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['economy'],
    party: 'nzfirst',
    slug: 'kiwisaver-generation',
    title: 'A KiwiSaver Generation: enrolment at birth',
    summary:
      'NZ First would make KiwiSaver enrolment automatic at birth, with an immediate $1,000 Crown contribution for New ' +
      'Zealand citizens only — a once-per-lifetime payment meant to compound for decades. It is designed to work with ' +
      'their existing campaign policy of compulsory KiwiSaver across the workforce, with employee and employer ' +
      'contributions rising to 8 percent and eventually 10.',

    facts: [
      { label: 'Enrolment', value: 'Compulsory at birth', note: 'Described as universal, removing the enrolment gap' },
      { label: 'Crown contribution', value: '$1,000', note: 'Automatic and immediate' },
      { label: 'Who gets the money', value: 'NZ citizens only', note: 'The contribution is citizenship-restricted' },
      { label: 'How often', value: 'Once per lifetime', note: 'Intended to compound for decades' },
      { label: 'Workforce contributions', value: '8%, then 10%', note: 'Employee and employer, under their existing policy' },
      { label: 'Workforce enrolment', value: 'Compulsory', note: 'Their existing campaign policy, which this extends' },
    ],

    mechanics: [
      {
        heading: 'Enrolment from day one',
        body:
          'Every child would begin their financial life as a KiwiSaver member rather than joining on entering work. ' +
          'The document frames this as removing the enrolment gap entirely for the next generation and normalising ' +
          'saving as a lifelong habit, so that no New Zealander reaches adulthood without a savings foundation.',
      },
      {
        heading: 'The $1,000 contribution',
        body:
          'An automatic, immediate Crown payment into the new account, restricted to New Zealand citizens. It is a ' +
          'once-per-lifetime investment rather than a recurring one, and the case for it rests on decades of ' +
          'compounding rather than the size of the sum.',
      },
      {
        heading: 'How it fits their wider KiwiSaver policy',
        body:
          'This extends an existing NZ First campaign policy of compulsory KiwiSaver enrolment across the workforce ' +
          'with employee and employer contributions rising to 8 percent initially and eventually 10 percent. The ' +
          'document’s argument is that if participation is to be the default rather than the exception, birth ' +
          'enrolment is the logical starting point.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand First is going to make KiwiSaver enrolment compulsory at birth and there will be an automatic immediate Crown contribution of $1000 for New Zealand citizens only.',
        context: 'Opening statement of the policy',
      },
      { text: 'This is a once-per-lifetime investment that compounds for decades.', context: 'On the $1,000 contribution' },
      {
        text: 'Universal birth enrolment will ensure every child begins their financial life as a KiwiSaver member, with a meaningful balance already growing on their behalf.',
        context: 'On enrolment at birth',
      },
    ],

    openQuestions: [
      'Enrolment is described as universal while the $1,000 is for citizens only, and the document does not say whether a non-citizen child is enrolled without the payment or not enrolled at all.',
      'No total cost is given, and none can be worked out from the document, which states no number of births.',
      'Which fund a newborn’s account would default to, and who would choose it, is not stated.',
      'When the balance could be accessed, and whether the existing first-home withdrawal rules would apply to it, is not addressed.',
      'The rise to 8 and then 10 percent contributions is referred to as existing policy, with no timeline given here.',
      'Whether the $1,000 would be indexed, or fixed at that amount for future cohorts, is not said.',
    ],

    source: {
      documentTitle: 'Establishing a KiwiSaver Generation',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/establishing_a_kiwisaver_generation',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['economy'],
    party: 'nzfirst',
    slug: 'break-up-the-supermarket-duopoly',
    title: 'Breaking up the supermarket duopoly',
    summary:
      'NZ First would legislate to split Foodstuffs into two nationwide cooperatives by brand — New World and Four ' +
      'Square in one, Pak’nSave in the other — putting both in direct competition with Woolworths. Commerce ' +
      'Commission penalties would rise to match Australia’s, the Grocery Commissioner would gain power to ' +
      'investigate, make binding decisions and impose penalties, and a new industry-rules framework under the ' +
      'Commerce Act 1986 would allow faster targeted action on the path from farm to shelf.',

    facts: [
      { label: 'Market share', value: 'Over 80%', note: 'Held between Woolworths and Foodstuffs' },
      { label: 'Excess profits', value: '~$1m a day', note: 'A previous Commerce Commission finding' },
      { label: 'The split', value: 'Foodstuffs into two', note: 'New World and Four Square; Pak’nSave' },
      { label: 'Maximum penalty', value: '$10m', note: 'Or three times the gain, or 10% of turnover' },
      { label: 'Grocery Commissioner', value: 'Binding decisions', note: 'Plus powers to investigate and penalise' },
      { label: 'The supply chain gap', value: '60c to $5.79', note: 'A grower’s price per kg of peas against the shelf price' },
    ],

    coveredLabel: 'What the Commerce Commission would gain',
    exemptLabel: 'What the Grocery Commissioner would gain',

    covered: [
      'Penalties lifted to match Australia — up to $10 million, three times the gain, or 10 percent of turnover',
      'Faster investigations',
      'Real enforcement powers for serious breaches',
      'A new industry-rules framework under the Commerce Act 1986, allowing targeted action without waiting for new legislation',
    ],

    exempt: [
      'Power to investigate',
      'Power to make binding decisions',
      'Power to impose penalties directly',
      'In place of a role the document describes as sitting on the sidelines giving warnings',
    ],

    mechanics: [
      {
        heading: 'Splitting Foodstuffs in two',
        body:
          'Legislation would break Foodstuffs into two nationwide cooperatives along brand lines — one holding New ' +
          'World and Four Square, the other Pak’nSave — so that both compete directly with Woolworths New Zealand ' +
          'and with each other. The stated aim is real pressure to lower prices, improve value and treat suppliers ' +
          'fairly.',
      },
      {
        heading: 'Penalties matched to Australia',
        body:
          'Tougher penalties, faster investigations and real enforcement powers for the Commerce Commission, with ' +
          'fines for serious breaches lifted to Australian levels: up to $10 million, three times the gain made, or ' +
          '10 percent of turnover.',
      },
      {
        heading: 'A Grocery Commissioner with teeth',
        body:
          'The document calls the current role toothless and would reform it to give the Commissioner power to ' +
          'investigate, make binding decisions and impose penalties directly, rather than issuing warnings.',
      },
      {
        heading: 'Fixing the farm-to-shelf pathway',
        body:
          'The argument is that controlling who gets shelf access means controlling the price. A new framework for ' +
          'industry rules under the Commerce Act 1986 would allow targeted action on competition problems without ' +
          'waiting for lengthy legislative change, with the stated aim of stopping New Zealand producers being ' +
          'squeezed off the shelf.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'For too long, New Zealanders have faced rising grocery bills while Woolworths and Foodstuffs control more than 80 percent of the grocery market.',
        context: 'Opening statement of the problem',
      },
      {
        text: 'recently a grower received just 60c per kg of peas, while those same peas retail for as much as $5.79',
        context: 'On the imbalance across the supply chain',
      },
      {
        text: 'When they control the pathway from farm to shelf, they control the price.',
        context: 'Fixing the ‘Farm to Shelf’ Pathway',
      },
      {
        text: 'The role of the current toothless Groceries Commissioner, belatedly established by Labour in 2023, will also be reformed giving the position the proper powers to investigate, make binding decisions, and impose penalties directly - not just sit on the sidelines and give warnings.',
        context: 'Stronger Powers for Commerce Commission and Grocery Commissioner',
      },
    ],

    openQuestions: [
      'Foodstuffs is a cooperative owned by its member grocers, and the document does not describe how legislation would divide it or what happens to those members’ ownership.',
      'No timeline or cost is given, and no view on whether compensation would arise.',
      'Nothing says whether the two new cooperatives would be barred from re-merging or from coordinating on price.',
      'The $1 million a day in excess profits is attributed to a previous Commerce Commission finding without a date or report named.',
      'The pea price comparison gives no date, region, or account of what happens between the grower and the shelf.',
      'What the new industry-rules framework would cover, and who would write the rules, is not stated.',
    ],

    source: {
      documentTitle: 'Break up the Supermarket Duopoly',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/break_up_the_supermarket_duopoly',
      retrieved: '2026-08-16',
    },
  },

  {
    // Both topics. It is a regional revenue policy, but it also rewrites where
    // mining may happen and cuts back DOC's role, which a reader on the
    // environment page needs to see.
    topics: ['economy', 'environment'],
    party: 'nzfirst',
    slug: 'mining-royalties-to-regions',
    title: 'Returning 50% of mining royalties to the regions',
    summary:
      'Half the royalties from any mine would stay in the region it came from rather than going to Wellington, ' +
      'earmarked for local infrastructure and services. Around that sits a wider mining package: new zones with ' +
      'clearer rules on where mining may happen, longer permits covering the full life of a mine, a reined-in role ' +
      'for DOC and other agencies, a modern geological survey of what is underground, and the reopening of the ' +
      'School of Mines.',

    facts: [
      { label: 'Royalty share', value: '50% to the region', note: 'From mining in that region, rather than to Wellington' },
      { label: 'Permits', value: 'Longer', note: 'Covering the full life of the mine, including rehabilitation' },
      { label: 'Mining zones', value: 'New and clearer', note: 'Recognising regions where mining is already key' },
      { label: 'Agencies', value: 'Reined in', note: 'Including DOC, told to stay on core priorities' },
      { label: 'Survey', value: 'A modern geological survey', note: 'Plus advanced core-scanning of existing data' },
      { label: 'Workforce', value: 'Reopen the School of Mines', note: 'With investment in skills and training' },
    ],

    coveredLabel: 'What the regional half would be invested in',
    covered: [
      'Water services',
      'Flood protection',
      'Energy generation opportunities',
      'Tourism opportunities',
      'Transport and connectivity upgrades',
      'Housing development in areas of high minerals industry growth',
      'Critical infrastructure projects, plus properly funded Mines Rescue capability',
    ],

    mechanics: [
      {
        heading: 'Half the royalties stay put',
        body:
          'Where mining happens in a region, 50 percent of the royalties would remain there to support local ' +
          'infrastructure, services and long-term development, backed by targeted regional investment to help those ' +
          'projects succeed. The document’s framing is that the benefits of mining should flow back to the ' +
          'communities the mining happens in rather than to Wellington.',
      },
      {
        heading: 'Simplifying a system they call overly complex',
        body:
          'The stated problem is duplication, delay and rules that the document says do not improve environmental ' +
          'outcomes but do stop investment and cost jobs. New mining zones would set clearer rules about where mining ' +
          'can occur, recognising regions where it is already a key part of the economy.',
      },
      {
        heading: 'Longer permits',
        body:
          'Permit duration would be changed to reflect that mining is a long-term business, with permits covering the ' +
          'full life of a mine including rehabilitation. The argument is investor certainty: more confidence, more ' +
          'investment.',
      },
      {
        heading: 'Reining in the agencies',
        body:
          'The package would limit the role of government agencies including the Department of Conservation, on the ' +
          'basis that they should stay focused on core priorities and that regional prosperity should not be ' +
          'sidelined by processes the document says have lost all sense of proportion.',
      },
      {
        heading: 'Finding out what is actually there',
        body:
          'A modern geological survey, plus investment in advanced core-scanning technology to unlock existing data. ' +
          'The document’s case is that New Zealand does not currently have a modern understanding of what lies ' +
          'underground while other countries do.',
      },
      {
        heading: 'Value here rather than dig and ship',
        body:
          'The concern raised is that New Zealand risks exporting critical minerals raw and letting others capture ' +
          'the value. The response is continued investment in science and innovation, and rebuilding the sector ' +
          'workforce — including reopening the School of Mines so New Zealanders can take the high-paying jobs.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'If mining happens in a region, a 50% share of the royalties will stay in that region, supporting local infrastructure, services, and long-term development.',
        context: 'On the regional share',
      },
      {
        text: 'You can protect the environment and grow the economy at the same time. They are not mutually exclusive.',
        context: 'On reining in government agencies',
      },
      {
        text: 'Right now, we don’t even have a modern understanding of what we’ve got beneath our feet.',
        context: 'On the geological survey',
      },
      {
        text: 'At the moment, we risk being stuck in a ‘dig and ship’ model for key future industries, sending our resources offshore and letting others make the real money.',
        context: 'On adding value in New Zealand',
      },
    ],

    openQuestions: [
      'No total royalty figure is given, so there is no way to tell what the regional half would amount to.',
      'Who would hold and spend the regional share — councils, a new body, or central government — is not stated.',
      'Which region receives the share where a mine spans a boundary, or sits offshore, is not addressed.',
      'Whether the new mining zones would permit mining on conservation land is not said, though the policy does cut back DOC’s role.',
      '“Reining in” DOC and other agencies is not defined, and no statutory change is named.',
      'Longer permits are proposed without saying how long, and no cost is given for the geological survey, the core-scanning programme or reopening the School of Mines.',
    ],

    source: {
      documentTitle: 'Returning 50% of mining royalties to the regions',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/returning_50_of_mining_royalties_to_the_regions',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['economy'],
    party: 'nzfirst',
    slug: 'new-zealand-owned-bank',
    title: 'Buying back the BNZ to build a New Zealand owned bank',
    summary:
      'NZ First would buy the Bank of New Zealand back from National Australia Bank and merge it with Kiwibank to ' +
      'form the National Bank of New Zealand — fully Crown owned, commercially run, and big enough to compete with ' +
      'ANZ, ASB and Westpac. It would not come out of the operating budget: the funding stack is a sovereign banking ' +
      'bond, long-dated Crown debt, a limited tranche of Future Fund and ACC money, and Kiwibank’s existing capital.',

    facts: [
      { label: 'The plan', value: 'Buy back BNZ', note: 'From National Australia Bank' },
      { label: 'Merged with', value: 'Kiwibank', note: 'To form the National Bank of New Zealand' },
      { label: 'Australian-owned share', value: '~85%', note: 'Of the banking system, held across four banks' },
      { label: 'Kiwibank today', value: 'Just under 8%', note: 'Of the mortgage market' },
      { label: 'BNZ cash earnings', value: '$1.5bn+ a year', note: 'Which they say would comfortably service the debt' },
      { label: 'Ownership', value: 'Fully Crown owned', note: 'Commercially run, not a government department' },
    ],

    coveredLabel: 'How the buy-back would be funded',
    exemptLabel: 'Countries the policy points to',

    covered: [
      'A New Zealand Sovereign Banking Bond, marketed to domestic retail and KiwiSaver investors',
      'Long-dated Crown debt at current sovereign rates',
      'A limited tranche of NZ Future Fund and ACC investment, as commercial equity at arm’s length and a market rate of return',
      'Retention of Kiwibank’s existing capital base',
    ],

    exempt: [
      'Singapore',
      'Norway',
      'Germany',
      'Canada',
      'France',
    ],

    mechanics: [
      {
        heading: 'The buy-back and the merger',
        body:
          'BNZ would be bought back from National Australia Bank and merged with Kiwibank into a single Crown-owned ' +
          'commercial bank with the scale to compete with the other majors. The document notes that when National ' +
          'sold BNZ to NAB in November 1992 it had six of every ten New Zealand banking customers.',
      },
      {
        heading: 'The case they make about the market',
        body:
          'Four Australian-owned banks control around 85 percent of the system and, the document says, lend New ' +
          'Zealand deposits back at margins materially higher than their parents earn in Australia. It cites the ' +
          'Commerce Commission’s 2024 personal banking market study as finding a structurally uncompetitive market ' +
          'with no sustained pressure to compete on price and no realistic threat of new entry at scale. Kiwibank was ' +
          'created in 2002 as a domestic challenger but holds just under 8 percent of the mortgage market.',
      },
      {
        heading: 'Paying for it without touching the operating budget',
        body:
          'A blended funding stack rather than a single source, built so that BNZ’s own earnings service the debt ' +
          'raised to buy it. The document describes the result as self-financing in expectation, with the fiscal ' +
          'impact being a one-off balance-sheet expansion rather than an ongoing cost.',
      },
      {
        heading: 'What it would and would not be',
        body:
          'Not a government department, and the document is explicit that it does not regard this as nationalisation. ' +
          'A fully commercial bank with a Crown shareholder, intended as a strategic domestic lender for agriculture, ' +
          'infrastructure and SME growth on long-horizon terms. The management structure is deferred to later ' +
          'campaign announcements.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'Four Australian owned banks control around 85 percent of the system.',
        context: 'Opening statement of the problem',
      },
      {
        text: 'Successive governments have starved it of the capital it would need to be a genuine system-shaping competitor.',
        context: 'On Kiwibank',
      },
      {
        text: 'The buy-back is self-financing in expectation. The fiscal impact is a one-off balance-sheet expansion, not an ongoing cost.',
        context: 'On the funding stack',
      },
      {
        text: 'This is not nationalisation – this is taking back our country.',
        context: 'On what the policy is',
      },
    ],

    openQuestions: [
      'No purchase price is given, and the document does not say whether National Australia Bank is willing to sell or what happens if it is not.',
      'The management structure is explicitly deferred to “upcoming campaign announcements”.',
      'How much of the NZ Future Fund and ACC would be committed is described only as a limited tranche.',
      'Whether both brands survive the merger, and what changes for existing Kiwibank customers, is not addressed.',
      '“Self-financing in expectation” rests on BNZ’s current earnings continuing, and no sensitivity to a downturn or a rate cycle is offered.',
      'The comparison countries are named without saying which of their state-owned banks are comparable in structure or share.',
    ],

    source: {
      documentTitle: 'Backing a New Zealand Owned Bank',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/backing_a_new_zealand_owned_bank',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['economy'],
    party: 'nzfirst',
    slug: 'marsden-point-economic-zone',
    title: 'A Special Economic Zone at Marsden Point',
    summary:
      'A Special Economic Zone covering the former refinery and Northport, focused on energy and maritime activity ' +
      'including a new drydock for ship repairs. Its principal feature is relief from planning regulation and the ' +
      'RMA: instead of councils, DOC and other agencies, consents would be decided quickly by a government expert ' +
      'panel judging whether a proposal grows the economy. Changes to overseas investment rules and a range of tax ' +
      'incentives are under consideration.',

    facts: [
      { label: 'Where', value: 'The former refinery and Northport' },
      { label: 'Focus', value: 'Energy and maritime', note: 'Including a new drydock servicing ship repairs worldwide' },
      { label: 'Principal benefit', value: 'Relief from the RMA', note: 'And from planning regulation generally' },
      { label: 'Consenting', value: 'A government expert panel', note: 'In place of councils, DOC and other agencies' },
      { label: 'Tax', value: 'Under consideration', note: 'Rates rebates through to reduced company tax' },
      { label: 'Alongside it', value: 'Drydock, expressway, rail', note: 'Northland Expressway and the Marsden Point rail link' },
    ],

    coveredLabel: 'Relief the zone would offer',
    covered: [
      'Planning rules and RMA consents decided by a government panel rather than councils',
      'No dealing with local or regional councils, DOC or other agencies',
      'Possible Overseas Investment Act changes to ease quality foreign investment',
      'Rates rebates, with the Crown paying councils for services provided to zone businesses',
      'Foregoing various levies',
      'Investment incentives, up to reduced company taxes for specific investments',
    ],

    mechanics: [
      {
        heading: 'What the zone covers',
        body:
          'The former refinery site and Northport, focused on energy generation and distribution and on maritime ' +
          'activity — including the new drydock, servicing ship repairs from New Zealand and around the world. The ' +
          'document places it in a wider strategy of producing more for export while fortifying national security.',
      },
      {
        heading: 'Consenting by expert panel',
        body:
          'The principal benefit named is relief from planning regulation and the RMA. Rather than dealing with local ' +
          'and regional councils, DOC and other agencies, planning rules and consents would be determined quickly by ' +
          'a government panel, deciding on whether a change grows the economy and achieves the aims of the zone.',
      },
      {
        heading: 'Foreign investment',
        body:
          'Changes to the Overseas Investment Act are under consideration to make quality foreign investment in the ' +
          'zone easier, while the document says national interest and ownership would still be protected — it points ' +
          'to Darwin, whose port is foreign-owned, as what it wants to avoid.',
      },
      {
        heading: 'Tax incentives, as options',
        body:
          'Presented as being considered rather than committed: rates rebates with the Crown paying councils for ' +
          'services to zone businesses, foregoing various levies, investment incentives, and reduced company taxes ' +
          'for specific investments. The document notes SEZ policy mixes vary internationally and can include tax ' +
          'breaks, wage subsidies, reduced regulation and infrastructure investment.',
      },
      {
        heading: 'The infrastructure around it',
        body:
          'The zone is presented as part of a complex rather than a standalone legislative change, alongside the ' +
          'drydock, the Northland Expressway, and the Marsden Point rail link running north and south to Auckland.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The principal benefit this economic zone would provide is relief from planning regulations and the RMA.',
        context: 'On what the zone does',
      },
      {
        text: 'No longer will industries in the zone have to deal with local/regional councils, DOC and a myriad of other bureaucratic agencies for their activities.',
        context: 'On consenting',
      },
      {
        text: 'This expert panel would make decisions based on whether the changes will grow the economy and achieve the aims of the zone.',
        context: 'On the decision test',
      },
      {
        text: 'Afterall, who wants another Darwin, where that port in Australia is owned by foreign interests?',
        context: 'On overseas investment',
      },
    ],

    openQuestions: [
      'Who sits on the expert panel, how members are appointed, and whether decisions can be appealed is not stated.',
      'What environmental standards apply inside the zone once the RMA does not is not described.',
      'The tax incentives are listed as options under consideration rather than commitments, with no cost attached to any of them.',
      'The Overseas Investment Act changes are also only being considered, and the protections said to accompany them are not specified.',
      'No revenue, job or investment estimate is given for the zone.',
      'Whether the model would be extended to other sites is not addressed.',
    ],

    source: {
      documentTitle: 'Establishing a Special Economic Zone at Marsden Point',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/establishing_a_special_economic_zone_at_marsden_point',
      retrieved: '2026-08-16',
    },
  },

  {
    // Climate, like every other party's energy policy on this site — there is no
    // energy topic, and a reader comparing energy plans should find this next to
    // the Greens' and TOP's.
    topics: ['climate'],
    party: 'nzfirst',
    slug: 'fuel-security',
    title: 'Fuel security: a $1 billion subsurface survey',
    summary:
      'NZ First would spend $1 billion over a term of government on a National Subsurface Development Survey, ' +
      'building a single national dataset across energy, geothermal and CO₂ storage sites, and a framework to ' +
      'develop them. The case is that New Zealand’s offshore basins have never been surveyed with modern tools, that ' +
      'the odds of a major commercial discovery are above ninety percent, and that a find would fund a ' +
      'Norwegian-model sovereign wealth fund on royalties well above 50 percent.',

    facts: [
      { label: 'Investment', value: '$1bn', note: 'Over the term of a government' },
      { label: 'The survey', value: 'One national dataset', note: 'Across energy, geothermal and CO₂ storage sites' },
      { label: 'Basins', value: 'Ten prospective', note: 'The Great South Basin has had eight wells in its history' },
      { label: 'Claimed odds', value: 'Above 90%', note: 'Of a major commercial discovery, per unnamed analysis' },
      { label: 'Royalty', value: 'Well above 50%', note: 'On all extractions, as production matures' },
      { label: 'Where the money goes', value: 'A sovereign fund', note: 'On the Norwegian model' },
    ],

    coveredLabel: 'The timeline the policy sets out',
    covered: [
      'First results within twelve months, turning potential into data global capital can bid against',
      'Within twenty-four months, the highest-ranked basins surveyed, wells identified, and first physical proof reserves exist',
      'Potentially within six years, a pathway to owning and controlling our own energy supply for domestic use and export',
    ],

    mechanics: [
      {
        heading: 'The survey itself',
        body:
          'A National Subsurface Development Survey pulling energy, geothermal and CO₂ storage sites into one ' +
          'national dataset, plus the framework to develop them. The document says existing seismic data is two ' +
          'technology generations old and covers only a fraction of the subsurface.',
      },
      {
        heading: 'Why they say now',
        body:
          'Survey costs are described as sitting at structural lows, and capital as moving into politically stable ' +
          'basins since the conflict in the Strait of Hormuz — but that to move, it needs modern data. The document ' +
          'points to Namibia, whose data acquisition campaign began in 2022, and Guyana, which went from first ' +
          'discovery to South America’s third-largest producer in under a decade.',
      },
      {
        heading: 'What happens if they find something',
        body:
          'Explorers would carry the risk of proving the fields on terms the document calls fair, with a royalty well ' +
          'above 50 percent on all extractions as production matures. Any discovery would be used to end the gas ' +
          'shortfalls it blames for high power prices, drive local fuel costs down, export oil and gas, and establish ' +
          'a Norwegian-model sovereign fund turning the find into permanent national wealth and regional investment.',
      },
      {
        heading: 'How it is positioned against other parties',
        body:
          'The document explicitly contrasts itself with what it calls tinkering around the edges with solar panel ' +
          'plans, arguing that does next to nothing for fuel and gas insecurity, and frames the issue as economic ' +
          'sovereignty rather than energy policy — New Zealand ceasing to be beholden to other nations’ decisions.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand potentially holds Norway-scale energy prospects in our offshore basins and that potential has never been accurately surveyed or characterised with modern tools.',
        context: 'On the opportunity',
      },
      {
        text: 'Analysis shows that the odds of New Zealand having a major commercial discovery in our basins is well above ninety percent.',
        context: 'On the likelihood of a find',
      },
      {
        text: 'We would set fair terms while explorers carry the risk of proving the fields — and over time place a royalty well above 50% on all extractions as production matures.',
        context: 'On terms and royalties',
      },
      {
        text: 'Other parties want to ‘tinker around the edges’ with solar panel plans – which does next to nothing to address fuel and gas insecurity',
        context: 'On other parties’ energy policies',
      },
    ],

    openQuestions: [
      'The “well above ninety percent” figure is attributed to analysis that is not named, dated or cited.',
      'The document does not address what the emissions consequences of extraction would be, or how the policy sits with New Zealand’s climate targets.',
      'Whether the survey and any subsequent extraction would cover areas currently subject to offshore exploration restrictions is not stated.',
      'The royalty is given as “well above 50%” without a figure, and “as production matures” is not defined.',
      'No cost is attached to the development framework beyond the $1 billion for the survey itself.',
      'The six-year pathway assumes a commercial discovery, and no alternative is described if the survey finds nothing.',
      'CO₂ storage sites are named in the survey’s scope but no policy for using them is given.',
    ],

    source: {
      documentTitle: 'Future Proofing our Fuel Security',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/future_proofing_our_fuel_security',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['economy'],
    party: 'nzfirst',
    slug: 'kiwi-kids-grant',
    title: 'The Kiwi Kids Grant',
    summary:
      'A universal, non-means-tested payment of $5,000 a year for each of a family’s first three children, through ' +
      'each child’s first three years, tax free and paid monthly through IRD. One parent must be a New Zealand ' +
      'citizen. It would sit on top of existing support and is costed at $400 million a year by year three. The case ' +
      'made for it is demographic: a falling citizen birthrate that NZ First argues cannot be solved by migration.',

    facts: [
      { label: 'The grant', value: '$5,000 a year', note: 'Tax free, through each child’s first three years' },
      { label: 'Children covered', value: 'The first three', note: 'First, second and third child only' },
      { label: 'Eligibility', value: 'One parent a citizen', note: 'Universal and not means tested' },
      { label: 'How it is paid', value: 'Monthly, via IRD', note: 'First year for a first child can be taken as a lump sum' },
      { label: 'Cost', value: '$400m a year', note: 'By year three, once the full cycle is established' },
      { label: 'Relationship to other support', value: 'In addition', note: 'On top of everything parents already receive' },
    ],

    coveredLabel: 'The birth figures the policy cites',
    covered: [
      'Citizen births falling from 52,506 in 2006 to 36,351 in 2025 — a 30 percent drop',
      'Non-citizen births rising from 8,001 in 2006 to 14,380 in 2025',
      'The share of all births shifting from 87% citizen and 13% non-citizen in 2006 to 72% and 28% last year',
      'A birthrate of 1.53 per person against the 2.1 needed for replacement',
    ],

    mechanics: [
      {
        heading: 'What the grant is',
        body:
          'A universal, non-means-tested $5,000 a year for each of the first, second and third child, paid across ' +
          'each child’s first three years. It is tax free and additional to every other support parents already ' +
          'qualify for, so it does not replace Working for Families or Best Start.',
      },
      {
        heading: 'How it would be paid',
        body:
          'As a regular monthly payment administered through IRD, with one option: the first year’s grant for a first ' +
          'child can be taken as an upfront lump sum, to help with the cost of preparing for a first baby.',
      },
      {
        heading: 'The demographic case',
        body:
          'The document’s argument is that citizen births have fallen 30 percent in a decade while non-citizen births ' +
          'have nearly doubled, shifting the composition of who is born here, and that the birthrate of 1.53 is well ' +
          'below replacement. It describes relying on migration to fill that gap as papering over the cracks, and ' +
          'notes the same decline is happening across the western world.',
      },
      {
        heading: 'Why cost is the lever they pick',
        body:
          'The document lists several reasons people have fewer children or have them later — prioritising careers, ' +
          'wanting a dependent-free adulthood, rising costs, and the sacrifices involved — and picks cost as the one ' +
          'a government can move, describing the grant as substantially lowering one main barrier.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The ‘Kiwi Kids Grant’ is a universal, non-means tested grant of $5000 annually for the first three years, and for each of the first, second, and third child.',
        context: 'On what the grant is',
      },
      { text: 'One parent must be a New Zealand citizen to be eligible for this grant.', context: 'On eligibility' },
      {
        text: 'New Zealand’s current birthrate is 1.53 births per person, which is well below the rate of replacement of 2.1 births per person needed to just maintain our population.',
        context: 'On the birthrate',
      },
      {
        text: 'Masking this massive problem with increasing migration is just papering over the cracks and will be disastrous for our future.',
        context: 'On migration as an alternative',
      },
    ],

    openQuestions: [
      'The birth and birthrate figures are given without a source or a link to the underlying data.',
      'Eligibility turns on one parent being a citizen, and the document does not say what happens where neither parent is.',
      'Nothing is said about a fourth or subsequent child, who appear to fall outside the grant entirely.',
      'Whether the $5,000 would be indexed, or fixed at that amount for future cohorts, is not stated.',
      'The $400 million estimate is given for year three without the birth assumptions or take-up rate behind it.',
      'The document lists career, lifestyle and the sacrifices of parenting alongside cost as reasons for the decline, but offers no evidence for how much of it cost accounts for.',
    ],

    source: {
      documentTitle: 'The ‘Kiwi Kids Grant’',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/the_kiwi_kids_grant',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['treaty-maori-affairs'],
    party: 'nzfirst',
    slug: 'disestablish-imsb',
    title: 'Disestablishing Auckland’s Independent Māori Statutory Board',
    summary:
      'NZ First has a member’s bill to disestablish the Independent Māori Statutory Board, the unelected body created ' +
      'alongside the Auckland Super City in 2010. Its functions, property and obligations would transfer back to ' +
      'Auckland Council. The argument made is accountability: that ratepayers fund the board — $3.5 million last ' +
      'year — without being able to elect or remove its members. The document states the change would not stop the ' +
      'council engaging with Māori.',

    facts: [
      { label: 'The body', value: 'Auckland’s IMSB', note: 'Created alongside the Super City in 2010' },
      { label: 'Mechanism', value: 'A member’s bill', note: 'Written and introduced, to be campaigned on' },
      { label: 'Cost cited', value: '$3.5m last year', note: 'Paid by ratepayers, per the document' },
      { label: 'Members', value: 'Unelected', note: 'Ratepayers cannot elect or remove them' },
      { label: 'Functions', value: 'Back to the council', note: 'Along with property and obligations' },
      { label: 'Engagement with Māori', value: 'Not prevented', note: 'But to occur within elected structures' },
    ],

    // The document is explicit about limits on its own reach, and a reader
    // deserves that as prominently as the case for the change.
    coveredLabel: 'What the policy says it does not do',
    covered: [
      'Prevent Auckland Council from engaging with Māori',
      'Prevent the council recognising Māori interests',
      'Interrupt council operations — the bill provides for an orderly transition of functions, property and obligations',
    ],

    mechanics: [
      {
        heading: 'What the board is, and how its role grew',
        body:
          'The Independent Māori Statutory Board was created with the amalgamation of Auckland’s councils in 2010. ' +
          'The document says it was originally established to provide advice, but that its statutory documents and ' +
          'appointments have since become embedded across council planning, funding, procurement and performance ' +
          'systems.',
      },
      {
        heading: 'The accountability argument',
        body:
          'The case rests on elected accountability rather than on the board’s work: that Aucklanders were never ' +
          'asked whether to fund or empower it, that ratepayers pay millions a year including $3.5 million last year, ' +
          'and that they cannot elect or remove its members. The document sets this against rising rates, increasing ' +
          'debt and reductions in core services, calling the result a growing democratic deficit.',
      },
      {
        heading: 'Where its functions would go',
        body:
          'The bill provides for an orderly transition of the board’s functions, property and obligations back to ' +
          'Auckland Council, with the stated aim of continuity of council operations.',
      },
      {
        heading: 'What the document says it does not change',
        body:
          'It states directly that removing the board does not prevent Auckland Council from engaging with Māori or ' +
          'recognising their interests — the stated intent being that such engagement happens through democratically ' +
          'accountable structures instead.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'Aucklanders were never asked whether they agreed to fund or empower a parallel governance system within their council.',
        context: 'On the accountability argument',
      },
      {
        text: 'The removal of the IMSB will ensure that those who influence public spending and public decision making are directly accountable to the public.',
        context: 'On what removal achieves',
      },
      {
        text: 'It does not prevent Auckland Council from engaging with Māori or recognising their interests, rather it ensures that such engagement occurs within democratically accountable structures.',
        context: 'On the limits of the policy',
      },
    ],

    openQuestions: [
      'The $3.5 million figure is given for “last year” without naming the year or the source.',
      'The member’s bill is described as written and introduced but is not named, so a reader cannot look it up.',
      'How the board’s advisory functions would actually be performed once returned to the council is not described.',
      'Whether the statutory documents the board has produced would remain in force is not addressed.',
      'What an orderly transition means for the board’s staff is not stated.',
      'The document does not say whether equivalent arrangements at other councils would be affected.',
    ],

    source: {
      documentTitle: 'Disestablish Auckland’s ‘Independent Maori Statutory Board’',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/disestablish_auckland_s_independent_maori_statutory_board',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['treaty-maori-affairs'],
    party: 'nzfirst',
    slug: 'referendum-on-maori-seats',
    title: 'A referendum on the Māori seats',
    summary:
      'NZ First would put the future of the Māori electorate seats to a public vote, and says that if enough people ' +
      'support them they could be retained. The case rests on the 1986 Royal Commission’s conclusion that MMP would ' +
      'remove the original justification for separate seats, on figures the party gives for Māori representation in ' +
      'the House, on falling Māori roll enrolment, and on its characterisation of the current seat-holders.',

    facts: [
      { label: 'The proposal', value: 'A public referendum', note: 'On whether the Māori seats are still needed' },
      { label: 'If support exists', value: 'They could be retained', note: 'The document’s own stated position' },
      { label: '1986 Royal Commission', value: 'Cited', note: 'That MMP would remove the original justification' },
      { label: 'Māori in the House', value: '27% claimed', note: 'Against a stated 17% of the population' },
      { label: 'Māori roll', value: 'About half', note: 'Of enrolled Māori, and falling, per the document' },
      { label: 'General seats 1854–1978', value: 'Four Māori MPs', note: 'Rising substantially since MMP, it says' },
    ],

    mechanics: [
      {
        heading: 'Putting it to a vote',
        body:
          'The proposal is that the public decide whether the Māori seats are effective, relevant and still needed. ' +
          'The document points to the recent referendum on local Māori wards as precedent, and is explicit that if ' +
          'the seats have enough support they could be retained. NZ First notes it has campaigned on this before and ' +
          'wants it implemented after the next election.',
      },
      {
        heading: 'The Royal Commission argument',
        body:
          'The central constitutional claim is that the 1986 Royal Commission on the electoral system concluded that ' +
          'MMP would produce a more representative Parliament and that the original justification for separate Māori ' +
          'seats would no longer exist.',
      },
      {
        heading: 'The representation figures',
        body:
          'The document says there is now a record number of Māori in Parliament and Cabinet, putting it at 27 ' +
          'percent of the House against what it describes as an often-claimed 17 percent of the population. It adds ' +
          'that between 1854 and 1978 only four Māori held a general seat, that the number has risen substantially ' +
          'since MMP, and that enrolment on the Māori roll has been falling and now sits at about half of enrolled ' +
          'Māori. From this it concludes that a separate franchise based on race has become irrelevant.',
      },
      {
        heading: 'Its case about the current seat-holders',
        body:
          'The document gives the conduct of the Māori Party over the past two years as part of its reasoning, saying ' +
          'they hold the majority of the Māori seats, do not turn up to Parliament and disregard the rules and ' +
          'processes, and concluding that the seats no longer serve their original purpose. These are the document’s ' +
          'characterisations; it offers no attendance, voting or participation data alongside them.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'the Royal Commission into the electoral system in 1986 stated that with the implementation of MMP it would create a more representative Parliament and the original justification for separate Māori seats would no longer exist.',
        context: 'On the constitutional argument',
      },
      {
        text: 'If the Māori seats have enough people who support them then they could be retained.',
        context: 'On what the referendum could decide',
      },
      {
        text: 'we currently have a record number of Māori in parliament and in Cabinet, with twenty-seven percent of the House having a Māori background',
        context: 'On representation in the House',
      },
      {
        text: 'The arguments for a separate franchise based on race have become irrelevant.',
        context: 'The document’s conclusion',
      },
    ],

    openQuestions: [
      'No date, wording or threshold for the referendum is given, and the document does not say whether the result would be binding.',
      'The claim that the Māori Party do not turn up to Parliament is made without attendance or voting data.',
      'The 27 percent and 17 percent figures, the Māori roll enrolment claim and the 1854–1978 figure are all given without a source.',
      'The 1986 Royal Commission is cited for one conclusion, and the document does not set out what else it recommended about Māori representation.',
      'What would happen to electorate boundaries and the size of the House if the seats were abolished is not addressed.',
      'Whether Māori would keep the choice between rolls in the meantime, and what happens to those already enrolled, is not stated.',
    ],

    source: {
      documentTitle: 'Referendum on Maori Seats',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/referendum_on_maori_seats',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['democracy-government'],
    party: 'nzfirst',
    slug: 'citizens-only-voting',
    title: 'Restricting the vote to citizens',
    summary:
      'NZ First would change electoral law so that only New Zealand citizens can vote. Permanent residents can currently ' +
      'vote after two years, and holders of certain visas with no expiry date after one. The party would keep ' +
      'permanent residence as the right to live, work, study and build a life here, while reserving the vote for those ' +
      'who have taken citizenship.',

    facts: [
      { label: 'The change', value: 'Citizens only', note: 'In electoral law, for the right to vote' },
      { label: 'Residents can vote now', value: 'After 2 years', note: 'Permanent residents, through the normal process' },
      { label: 'Some visa holders', value: 'After 1 year', note: 'Certain visas with no expiry date' },
      { label: 'What residence keeps', value: 'Live, work, study', note: 'The right to build a life here is unchanged' },
      { label: 'Their distinction', value: 'Allegiance', note: 'Citizenship framed as a formal bond, residence as permission to stay' },
      { label: 'Local elections', value: 'Not addressed', note: 'Council voting is named as a problem but not in the remedy' },
    ],

    mechanics: [
      {
        heading: 'What the rule is now',
        body:
          'The document sets out the current position as its starting point: a permanent resident who has been through ' +
          'the normal process can vote after two years living here, and someone on certain visas with no expiry date ' +
          'is technically eligible after one. It notes this covers who forms the government, who sits on local ' +
          'councils, and referendums.',
      },
      {
        heading: 'The line they would draw',
        body:
          'Permanent residence and citizenship are treated as different things doing different jobs. Residence gives ' +
          'the right to live, work, study and build a life; citizenship is described as the formal bond of allegiance, ' +
          'belonging, responsibility and democratic authority. The policy is that only the second should carry the ' +
          'vote — the party’s phrase is that the distinction “should matter again”.',
      },
      {
        heading: 'How it is argued',
        body:
          'The case is put in terms of commitment rather than administration: voting is framed as a privilege of those ' +
          'who have sworn allegiance and made New Zealand their home and their future. The document is explicit that ' +
          'people who have not done so remain welcome to live here permanently.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand First has announced that we will be campaigning to change the electoral law to ensure that only citizens have the right to vote.',
        context: 'Opening statement of the policy',
      },
      {
        text: 'Currently, any permanent resident who has gone through the normal process, after just two years living in New Zealand, can vote.',
        context: 'On the current rule',
      },
      {
        text: 'Permanent residence gives people the right to live, work, study, and build a life in New Zealand. Citizenship is different.',
        context: 'On the distinction they draw',
      },
      {
        text: 'New Zealand First will restore the basic democratic principle that the right to decide New Zealand’s future belongs to New Zealand citizens.',
        context: 'On what the change would do',
      },
    ],

    openQuestions: [
      'Local council voting and referendums are both named as part of the problem, but the stated remedy covers general elections — whether local elections change too is not said.',
      'Nothing is said about people already enrolled as residents: whether they would be removed from the roll, and if so when or how they would be told.',
      'The document does not say whether the change would apply from a future election or immediately.',
      'No estimate is given of how many current voters it would affect.',
      'Citizenship carries its own residence and character requirements; whether the party would change those alongside the voting rule is not addressed.',
      'New Zealand is one of a small number of countries allowing resident non-citizens to vote nationally, and the document makes no comparison to how others handle it.',
    ],

    source: {
      documentTitle: 'Citizen’s Only Voting',
      publisher: 'New Zealand First',
      url: 'https://www.nzfirst.nz/citizens_only_voting',
      retrieved: '2026-08-17',
    },
  },

  // ── Te Pāti Māori ──────────────────────────────────────────────────────────
  //
  // Their eighteen policy pages run to three bullets and a short rationale
  // each, which is too thin for this format — a dive built from one would be
  // mostly "the document does not say", which reads as evasiveness rather than
  // as brevity. These two come from announcements that do carry specific
  // commitments, paired with the matching policy page. The first open question
  // on each says plainly that the source is an announcement, so the gaps are
  // read as what they are.

  {
    topics: ['treaty-maori-affairs'],
    party: 'tpm',
    slug: 'binding-waitangi-tribunal',
    title: 'Making Waitangi Tribunal recommendations binding',
    summary:
      'Te Pāti Māori would make Waitangi Tribunal recommendations binding rather than advisory, establish a ' +
      'Parliamentary Commissioner for Te Tiriti, and require every Bill before Parliament to carry a Te Tiriti Impact ' +
      'Statement. The problem they identify is structural: the Tribunal can investigate, hear evidence and make ' +
      'findings, but a government can simply ignore them. It sits under their wider Mana Motuhake commitment to ' +
      'Te Tiriti-based constitutional change.',

    facts: [
      { label: 'Tribunal findings', value: 'Would bind', note: 'Rather than being recommendations a government may ignore' },
      { label: 'New office', value: 'Commissioner for Te Tiriti', note: 'A Parliamentary Commissioner' },
      { label: 'Every Bill', value: 'A Te Tiriti Impact Statement', note: 'Required before Parliament' },
      { label: 'The stated flaw', value: 'Findings can be ignored', note: 'The Tribunal can find, but not compel' },
      { label: 'Wider commitment', value: 'Constitutional change', note: 'Te Tiriti-based, under Mana Motuhake' },
      { label: 'Also committed to', value: 'Land back', note: 'And rangatiratanga commitments under Te Tiriti' },
    ],

    coveredLabel: 'The wider Mana Motuhake commitments',
    covered: [
      'Commit to Te Tiriti-based constitutional change',
      'Strengthen Māori political authority and governance structures',
      'Progress land back and rangatiratanga commitments under Te Tiriti o Waitangi',
    ],

    mechanics: [
      {
        heading: 'Binding recommendations',
        body:
          'The central change. The Waitangi Tribunal would move from making recommendations a government can decline ' +
          'to act on, to making findings that bind. The party frames the current arrangement as a flaw in Aotearoa’s ' +
          'constitutional arrangements rather than a failure of any one government.',
      },
      {
        heading: 'A Parliamentary Commissioner for Te Tiriti',
        body:
          'A new office, named as one of three mechanisms alongside binding findings and impact statements. The ' +
          'announcement establishes that it would exist but does not set out its powers.',
      },
      {
        heading: 'A Te Tiriti Impact Statement on every Bill',
        body:
          'Every Bill before Parliament would have to include one — the third mechanism, aimed at putting Te Tiriti ' +
          'into the legislative process at the point a law is written rather than after it is challenged.',
      },
      {
        heading: 'What prompted the announcement',
        body:
          'It responds to a call by New Zealand First to review the Waitangi Tribunal, made after the Tribunal found ' +
          'the Government’s Treaty clause review was a major breach of Te Tiriti. Co-leader Rawiri Waititi’s argument ' +
          'is that a government told by an independent watchdog that it has breached Te Tiriti should address the ' +
          'breach rather than investigate the watchdog.',
      },
      {
        heading: 'Where it sits in their platform',
        body:
          'Under Mana Motuhake, which commits to Te Tiriti-based constitutional change, strengthening Māori political ' +
          'authority and governance structures, and progressing land back and rangatiratanga commitments. The stated ' +
          'reasoning for constitutional entrenchment is that without it, every gain can be undone by the next ' +
          'government.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The Waitangi Tribunal can investigate, hear evidence and make findings. But governments can simply ignore them.',
        context: 'On the problem being solved',
      },
      {
        text: 'That is why Te Pāti Māori will make Waitangi Tribunal recommendations binding, establish a Parliamentary Commissioner for Te Tiriti, and require every Bill before Parliament to include a Te Tiriti Impact Statement.',
        context: 'The commitment itself',
      },
      {
        text: 'It is about accountability. When an independent watchdog tells the Government it has breached Te Tiriti, the Government’s job is to address the breach, not attack the watchdog.',
        context: 'Rawiri Waititi on what prompted it',
      },
      {
        text: 'If governments can ignore the Waitangi Tribunal every time they don’t like the answer, what accountability is left?',
        context: 'Rawiri Waititi',
      },
    ],

    openQuestions: [
      'The source is a press release announcing the commitment rather than a policy document, so most of the mechanics below are simply not covered by it yet.',
      'How binding recommendations would work in law is not set out, nor whether they would apply only to future findings or also to the Tribunal’s existing body of recommendations.',
      'What happens where a binding recommendation requires spending, or conflicts with other legislation, is not addressed.',
      'The Parliamentary Commissioner for Te Tiriti’s powers, appointment process and reporting lines are not described.',
      'What a Te Tiriti Impact Statement would contain, who would assess it, and what happens to a Bill that fails one, is not stated.',
      'No cost or timeline is given for any of the three mechanisms.',
    ],

    source: {
      documentTitle: 'Te Pati Maori will make the Waitangi Tribunal recommendations binding',
      publisher: 'Te Pāti Māori',
      documentDate: '6 August 2026',
      url: 'https://www.maoriparty.org.nz/te_pati_maori_will_make_the_waitangi_tribunal_recommendations_binding',
      retrieved: '2026-08-16',
      alsoFrom: [
        { documentTitle: 'Mana Motuhake', note: 'their policy page, for the wider constitutional commitments' },
      ],
    },
  },

  {
    topics: ['environment'],
    party: 'tpm',
    slug: 'seabed-mining-prohibition',
    title: 'A permanent ban on seabed mining',
    summary:
      'Co-leader Debbie Ngarewa-Packer has reintroduced a member’s bill, the Seabed Mining Prohibition Act, to ban ' +
      'seabed mining permanently — closing all legal pathways including fast-track approvals, and applying across the ' +
      'coastal marine area, the exclusive economic zone and the continental shelf. It is the second version, ' +
      'strengthened to account for fast-track legislation; the first was supported by the Greens and voted down by ' +
      'Labour.',

    facts: [
      { label: 'The bill', value: 'Seabed Mining Prohibition Act', note: 'A member’s bill, prepared for the ballot' },
      { label: 'Scope', value: 'All legal pathways', note: 'Including fast-track approvals' },
      { label: 'Area covered', value: 'Coastal, EEZ, shelf', note: 'Coastal marine area, exclusive economic zone, continental shelf' },
      { label: 'Version', value: 'The second', note: 'Strengthened to reflect fast-track legislation' },
      { label: 'The previous bill', value: 'Voted down', note: 'Supported by the Greens, opposed by Labour' },
      { label: 'Route', value: 'The members’ ballot', note: 'Not government legislation' },
    ],

    coveredLabel: 'The wider climate commitments it sits under',
    covered: [
      'Protect whenua and moana from extractive industries, including banning seabed mining',
      'Invest in climate resilience for communities most at risk',
      'Back regenerative and sustainable approaches aligned with Māori values',
    ],

    mechanics: [
      {
        heading: 'What the bill does',
        body:
          'The Seabed Mining Prohibition Act would close all legal pathways for seabed mining, fast-track approvals ' +
          'included, and apply across the coastal marine area, the exclusive economic zone and the continental shelf ' +
          '— so the ban is defined by where the seabed is rather than by which consenting regime applies.',
      },
      {
        heading: 'Why a second version',
        body:
          'Ngarewa-Packer has introduced seabed mining legislation before. That bill had Green Party support and was ' +
          'voted down by Labour. This version is described as strengthened to reflect changes in the law since, ' +
          'specifically the fast-track regime.',
      },
      {
        heading: 'The argument from the fast-track process',
        body:
          'The case made is that the evidence is now settled because it survived a process designed to be permissive: ' +
          'even under fast-track legislation intended to push projects through, seabed mining was found to cause ' +
          'unacceptable harm to the environment, to taonga species and to tikanga Māori. The conclusion drawn is that ' +
          'these impacts cannot be conditioned away, and that where regulators themselves find the risk too great, ' +
          'Parliament should act.',
      },
      {
        heading: 'Where it sits in their platform',
        body:
          'Under a climate policy that commits to protecting whenua and moana from extractive industries, naming a ' +
          'seabed mining ban directly, alongside climate resilience investment for the communities most at risk and ' +
          'regenerative approaches aligned with Māori values. The framing offered is mana moana, kaitiakitanga and ' +
          'intergenerational responsibility.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The Seabed Mining Prohibition Act closes all legal pathways for seabed mining, including fast-track approvals, and applies across the coastal marine area, the exclusive economic zone, and the continental shelf.',
        context: 'What the bill does',
      },
      {
        text: 'Even under fast-track legislation designed to push projects through, seabed mining has been found to cause unacceptable harm to the environment, to taonga species, and to tikanga Māori.',
        context: 'Debbie Ngarewa-Packer on the evidence',
      },
      {
        text: 'When regulators themselves conclude that the risks are too great and the uncertainty too high, Parliament has a responsibility to act.',
        context: 'Debbie Ngarewa-Packer',
      },
      {
        text: 'Our oceans are not sacrifice zones and this is work I intend to see through.',
        context: 'Debbie Ngarewa-Packer',
      },
    ],

    openQuestions: [
      'The source is a press release announcing the bill; the bill text itself is not linked, so its drafting cannot be checked against the description.',
      'A member’s bill depends on being drawn from the ballot, and the announcement does not say what happens to the policy if it is not.',
      'Whether existing permits or live applications would be extinguished, and whether compensation would follow, is not addressed.',
      'How the ban would sit with the Crown Minerals Act and the EEZ Act is not set out.',
      'No exemption is described for scientific research, cable laying or other non-extractive seabed activity.',
      'The announcement notes the previous bill was voted down by Labour but does not say what has changed to make a different result likely.',
    ],

    source: {
      documentTitle: 'Seabed mining banned in Aotearoa under reintroduced Member’s Bill',
      publisher: 'Te Pāti Māori',
      documentDate: '8 February 2026',
      url: 'https://www.maoriparty.org.nz/seabed_mining_banned_in_aotearoa_under_reintroduced_member_s_bill',
      retrieved: '2026-08-16',
      alsoFrom: [
        { documentTitle: 'Climate', note: 'their policy page, for the commitments this sits under' },
      ],
    },
  },

  // ── Women's Rights Party ───────────────────────────────────────────────────
  //
  // From a single 54,000-word policy document. Contested subject matter, so
  // rule 1 does the work it was written for: what follows is what the document
  // sets out, in their terms, with claims attributed to them and the gaps in
  // openQuestions. Included because they are a registered contesting party,
  // which is the site's only test.

  {
    topics: ['economy'],
    party: 'womens-rights',
    slug: 'womens-incomes',
    title: 'Women’s incomes: pay equity, carers and retirement savings',
    summary:
      'The party would legislate for pay equity in the private sector as well as the public, reinstate support for ' +
      'Fair Pay Agreements, and pay income support to people raising children or caring for elders. On retirement, it ' +
      'targets a KiwiSaver gap it puts at 25 percent between women and men, with four specific changes — including a ' +
      'State contribution to the KiwiSaver of unpaid carers, and continued employer contributions through maternity ' +
      'leave.',

    facts: [
      { label: 'KiwiSaver gap', value: '25% lower', note: 'Average balance for women, across all age groups' },
      { label: 'Pay equity claims', value: '150,000 women', note: 'Whose claims they say were extinguished in April 2025' },
      { label: 'The pay gap penalty', value: '3+ years', note: 'Of retirement income lost, on their estimate' },
      { label: 'Fair Pay Agreements', value: 'Reinstated', note: 'Legislative support for them restored' },
      { label: 'Carers', value: 'Income support', note: 'For raising children or caring for elders' },
      { label: 'Working for Families', value: 'Reformed', note: 'Backing the Child Poverty Action Group campaign' },
    ],

    coveredLabel: 'Their four KiwiSaver changes',
    covered: [
      'Require an employer to treat all its employees the same for the employer contribution',
      'Address pay equity, since the pay gap compounds into the retirement balance',
      'Continue employer contributions to KiwiSaver during maternity leave',
      'A State contribution to carers’ KiwiSaver, recognising unpaid childcare and care of dependants',
    ],

    mechanics: [
      {
        heading: 'Pay equity in both sectors',
        body:
          'The argument is that work typically done by women, and particularly by Māori and Pasifika women, stays ' +
          'undervalued, producing both a sex-based pay gap and a sex and ethnicity gap. The proposals are a strong ' +
          'onus on employers, publication of average hourly pay statistics broken down by occupation, sex and ' +
          'ethnicity, and reinstated legislative support for Fair Pay Agreements — applied to private sector jobs as ' +
          'well as public.',
      },
      {
        heading: 'Their account of the April 2025 changes',
        body:
          'The document records members’ concern at changes made to pay equity legislation under urgency in April ' +
          '2025, putting the number of women whose claims were extinguished at an estimated 150,000, and says many of ' +
          'those claims will not be able to restart under the new regime. It backs the People’s Select Committee ' +
          'process examining the evidence for and against the changes.',
      },
      {
        heading: 'Income support for carers',
        body:
          'Income support while raising children or caring for elders, on the stated basis that mothering and caring ' +
          'is work that contributes to society. Alongside it, the party backs the Child Poverty Action Group’s ' +
          'campaign to reform Working for Families so it reaches all lower income families, and singles out ' +
          'discrimination against beneficiary families — many headed by single mothers — for removal.',
      },
      {
        heading: 'Why retirement savings diverge',
        body:
          'The causes given are low pay in typically female jobs, lower lifetime income, part-time work, career breaks ' +
          'to raise children, and disadvantage after relationship breakdowns. The document puts the resulting average ' +
          'KiwiSaver balance for women at 25 percent below men’s across all age groups, and describes the compounding ' +
          'effect of the pay gap as costing three or more years of retirement income — which it notes matters more ' +
          'because women tend to live longer.',
      },
      {
        heading: 'Financial stability in older age',
        body:
          'The document identifies older women as the fastest-growing group living in poverty globally, and links low ' +
          'home ownership among older women to the same lifetime income pattern. Its proposals here are broader than ' +
          'specific: minimum wages and benefits lifted to living incomes, affordable housing, accessible healthcare, ' +
          'free financial advice available to women as needed, and work with the Office of Seniors on local and ' +
          'national solutions.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'In New Zealand, the average KiwiSaver balance for women is 25% lower than the average balance for men across all age groups.',
        context: 'Inequity in retirement savings',
      },
      {
        text: 'The Women’s Rights Party advocates for income support while raising our children or caring for our elders, recognising that mothering and caring is work and contributes to society.',
        context: 'Income support for carers',
      },
      {
        text: 'An estimated 150,000 women workers whose pay equity claims have been extinguished are now in limbo.',
        context: 'Pay Equity',
      },
      {
        text: 'Globally, older women are the fastest-growing group living in poverty.',
        context: 'Financial stability for women in older age',
      },
    ],

    openQuestions: [
      'No cost is given for the State contribution to carers’ KiwiSaver, or for continuing employer contributions through maternity leave.',
      'The 25 percent KiwiSaver gap and the 150,000 pay equity claims figure are both given without a source.',
      '“Income support for carers” is not defined — no rate, eligibility test, or relationship to existing benefits is set out.',
      'What effective pay equity policy would require of private sector employers, beyond publishing pay statistics, is not stated.',
      'Reinstating legislative support for Fair Pay Agreements is proposed without saying in what form.',
      'Free financial advice for women is advocated without saying who would provide or fund it.',
    ],

    source: {
      documentTitle: 'Policy of the Women’s Rights Party',
      publisher: 'Women’s Rights Party',
      documentDate: 'November 2025',
      url: 'https://womensrightsparty.nz/policy/',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['health'],
    party: 'womens-rights',
    slug: 'maternity-and-medical-treatment',
    title: 'Maternity care, screening, surrogacy and treatment for under-18s',
    summary:
      'On maternity: continuity of midwifery care funded properly, publicly funded primary maternity services rural ' +
      'and urban, paid maternity leave extended from six months to twelve, and partner leave on top. Women’s ' +
      'screening free and available. On treatment: a ban on puberty blockers and cross-sex hormones for under-18s ' +
      'presenting with sex-related distress, government-funded masculinisation or feminisation surgery restricted to ' +
      'over-25s, and an inquiry into Health NZ’s contracting of PATHA.',

    facts: [
      { label: 'Paid maternity leave', value: '6 to 12 months', note: 'Reviewed and extended' },
      { label: 'Partner leave', value: 'At the birth', note: 'Additional to the mother’s entitlement' },
      { label: 'Screening', value: 'Free and available', note: 'Cervical smears and breast screening' },
      { label: 'Puberty blockers', value: 'Banned under 18', note: 'And cross-sex hormones, for sex-related distress' },
      { label: 'Funded surgery', value: 'Age 25', note: 'Up from 18, for masculinisation or feminisation' },
      { label: 'PATHA guidelines', value: 'Inquiry called for', note: 'Into Health NZ contracting them' },
    ],

    coveredLabel: 'What maternity services would get',
    exemptLabel: 'The treatment changes for under-18s',

    covered: [
      'Continuity of midwifery care properly recognised and funded by Health NZ',
      'Publicly funded primary maternity services in both rural and urban centres',
      'Paid maternity leave extended from six months to twelve',
      'Partner leave at the time of birth, on top of the mother’s entitlement',
      'Wrap-around services for vulnerable mothers and their babies',
      'Retention of the words “mother”, “woman” and “breastfeeding” in maternity services',
    ],

    exempt: [
      'A ban on puberty blockers and cross-sex hormones for under-18s presenting with sex-related distress',
      'Government-funded masculinisation or feminisation cosmetic surgery restricted to over-25s, currently over-18s',
      'An inquiry into Health NZ contracting PATHA to update gender-affirming care guidelines',
    ],

    mechanics: [
      {
        heading: 'Maternity and midwifery',
        body:
          'The document calls on Health NZ to properly recognise and fund continuity of midwifery care, and to provide ' +
          'publicly funded primary maternity services in rural as well as urban centres, with services adequately ' +
          'resourced for quality and affordable provision for all. Alongside it, wrap-around support for vulnerable ' +
          'mothers and babies, tied to a stated aim of reducing the number of children removed from their families.',
      },
      {
        heading: 'Leave and childcare',
        body:
          'Paid maternity leave reviewed and extended from six to twelve months, with partners entitled to paid leave ' +
          'at the birth in addition. On childcare, quality and affordable or free provision with qualified and fairly ' +
          'paid staff, and a complete review of the current for-profit early childhood education sector against ' +
          'whether it meets the needs of women and children.',
      },
      {
        heading: 'Women’s health services',
        body:
          'Cervical smears and breast screening free and easily available to all women. The document adds that such ' +
          'services should be exclusively for biological women and use clear language including the word “women”.',
      },
      {
        heading: 'Treatment for under-18s',
        body:
          'A ban on puberty blockers and cross-sex hormones for children and adolescents under 18 presenting with ' +
          'what the document calls sex-related distress, and government-funded masculinisation or feminisation ' +
          'cosmetic surgery restricted to those over 25 rather than the current 18.',
      },
      {
        heading: 'The PATHA inquiry',
        body:
          'The document calls for an inquiry into Health NZ’s contracting of PATHA, the Professional Association for ' +
          'Transgender Health Aotearoa, to update guidelines for gender-affirming care. Its stated basis is the Cass ' +
          'Report’s assessment of guideline quality, which it says placed the New Zealand PATHA guidelines second to ' +
          'last with a score of 149 out of 600.',
      },
      {
        heading: 'Surrogacy',
        body:
          'Commercial surrogacy should remain illegal, and the document calls additionally for a ban on New Zealand ' +
          'citizens entering commercial surrogacy arrangements overseas. It supports the current Bill’s preservation ' +
          'of the birth mother as first legal parent but wants longer than seven days for her to decide on ' +
          'transferring parentage, and supports surrogate-born children being able to learn their genetic and ' +
          'gestational origins and whakapapa. It raises health and safety concerns about egg harvesting and embryo ' +
          'transfer for donors and recipients.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'Maternity services should be adequately resourced and funded to ensure quality, affordable provision for all.',
        context: 'Caring for mothers and children',
      },
      {
        text: 'We support a review and extension of paid maternity leave from six to 12 months, and entitlement of women’s partners to paid leave at the time of the birth in addition to the mother’s entitlements.',
        context: 'Caring for mothers and children',
      },
      {
        text: 'Women’s health services, including cervical smears and breast screening, must be free and easily available to all women.',
        context: 'Caring for mothers and children',
      },
      {
        text: 'The Women’s Rights Party supports a ban on the use of puberty blockers and cross-sex hormones to treat children and adolescents under the age of 18 who are presenting with “sex-related distress”, and to restrict Government-funded masculinisation or feminisation cosmetic surgery to those aged over 25 (currently aged over 18).',
        context: 'Key legislative issues',
      },
    ],

    openQuestions: [
      'No cost is given for extending paid maternity leave from six months to twelve, for the new partner leave, or for the maternity and childcare commitments.',
      'The Cass Report score of 149 out of 600 for the PATHA guidelines is cited without a link to the assessment.',
      'What would replace the PATHA guidelines, and who would write the replacement, is not stated.',
      'The ban is framed around under-18s presenting with sex-related distress; whether it affects the same medicines prescribed for other indications is not addressed.',
      'No transition arrangement is described for people already receiving treatment when a ban took effect.',
      'Who would conduct the inquiry into Health NZ’s contracting of PATHA, and under what powers, is not said.',
      'The call for a longer decision period for birth mothers in surrogacy does not say how long it should be.',
    ],

    source: {
      documentTitle: 'Policy of the Women’s Rights Party',
      publisher: 'Women’s Rights Party',
      documentDate: 'November 2025',
      url: 'https://womensrightsparty.nz/policy/',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['education'],
    party: 'womens-rights',
    slug: 'rse-and-schools',
    title: 'The relationships and sexuality curriculum, and schools',
    summary:
      'The party supports the Ministry of Education’s Relationships and Sexuality Education Framework, with ' +
      'unspecified reservations, because it recognises biological sex and drops references to gender. It would ' +
      'require schools to disclose the curriculum fully to parents, dispose of resources conflating sex and gender, ' +
      'keep named outside agencies out of classrooms, guarantee privacy from the opposite sex in toilets and changing ' +
      'rooms, and stop teachers supporting social transition.',

    facts: [
      { label: 'RSE Framework', value: 'Supported', note: 'With reservations the document does not set out' },
      { label: 'Consent teaching', value: 'Must stress under-16s', note: 'Cannot legally consent' },
      { label: 'Parents', value: 'Full disclosure', note: 'Of what is taught in the curriculum' },
      { label: 'Outside agencies', value: 'Kept out', note: 'Inside Out and Qtopia named' },
      { label: 'Social transition', value: 'Not by teachers', note: 'Described as a clinical intervention' },
      { label: 'Referrals', value: 'With parents involved', note: 'To professionals, per the Cass Report' },
    ],

    coveredLabel: 'What schools would be expected to do',
    covered: [
      'Give parents and caregivers full disclosure of what is taught in the relationships and sexuality curriculum',
      'Dispose of resources that conflate “sex” and “gender”, or confuse sexual orientation with gender',
      'Stop outside agencies such as Inside Out and Qtopia providing resources or instruction, especially without a teacher present',
      'Guarantee all children privacy from the opposite sex in single-sex spaces such as toilets and changing rooms',
      'Support children who do not conform to sex-based stereotypes, or who could grow up attracted to the same sex',
      'Refer distress about sex to appropriate professionals, with parents involved in those discussions',
    ],

    mechanics: [
      {
        heading: 'Why they back the RSE Framework',
        body:
          'The document supports the Ministry of Education’s Relationships and Sexuality Education Framework, which ' +
          'replaced the previous guidelines, on the grounds that it recognises the reality of biological sex and ' +
          'removes references to what the document calls the imprecise concept of gender. It records reservations ' +
          'about the Framework but does not say what they are.',
      },
      {
        heading: 'Consent',
        body:
          'Support for age-appropriate and scientifically accurate education about sexuality, relationships and ' +
          'consent, with one stated requirement: that any discussion of consent in a sexual context must stress that ' +
          'young people under 16 cannot legally consent.',
      },
      {
        heading: 'Parents and classroom resources',
        body:
          'Schools would give parents and caregivers full disclosure of what is being taught, and dispose of resources ' +
          'that conflate sex with gender or confuse sexual orientation with gender. Outside agencies are named — ' +
          'Inside Out and Qtopia — and would not provide resources or instruction in schools, with the document ' +
          'placing particular weight on cases where the teacher is not present.',
      },
      {
        heading: 'Social transition in schools',
        body:
          'The document defines social transition as changing appearance to align with stereotypes of the opposite ' +
          'sex or no sex, using different pronouns, and using opposite-sex toilets and changing facilities. Its ' +
          'position is that teachers should not support it, on the stated basis that doing so is a clinical ' +
          'intervention which often leads to medical transition and affects all students, and that it has been ' +
          'happening without parents’ knowledge.',
      },
      {
        heading: 'Where a child is distressed',
        body:
          'Teachers would refer concerns about children showing signs of distress about their sex to appropriate ' +
          'professionals, which the document attributes to the recommendations of the Cass Report, and all such ' +
          'discussions would involve parents. The document also states that children who do not conform to ' +
          'sex-based stereotypes, or who could grow up same-sex attracted, should be supported.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The Women’s Rights Party supports, with some reservations, the Ministry of Education’s Relationships and Sexuality Education Framework which replaces the previous guidelines.',
        context: 'Educating our Young People',
      },
      {
        text: 'any discussion about consent in the context of sexual activity must stress that young people cannot legally consent if they are under 16 years of age.',
        context: 'Educating our Young People',
      },
      {
        text: 'Teachers should not be supporting social transitioning in schools. Supporting social transition is a clinical intervention that often leads to medical transitioning and affects all students.',
        context: 'Educating our Young People',
      },
      {
        text: 'Children who do not conform to sex-based stereotypes or who could grow up to be attracted to the same sex, should be supported in this.',
        context: 'Educating our Young People',
      },
    ],

    openQuestions: [
      'The reservations about the RSE Framework are referred to but never set out.',
      'No mechanism is described for requiring schools to disclose curriculum content, dispose of resources or exclude named agencies — whether by guidance, funding condition or legislation.',
      'The statement that supporting social transition is a clinical intervention leading often to medical transition is asserted; the Cass Report is cited for referral practice but not for this claim.',
      'What happens where a child’s distress involves their parents, and involving parents may not be safe, is not addressed.',
      'Whether the expectations apply to private and state-integrated schools as well as state schools is not stated.',
      'No cost or timeline is attached to any part of it.',
    ],

    source: {
      documentTitle: 'Policy of the Women’s Rights Party',
      publisher: 'Women’s Rights Party',
      documentDate: 'November 2025',
      url: 'https://womensrightsparty.nz/policy/',
      retrieved: '2026-08-16',
    },
  },

  {
    topics: ['crime-justice'],
    party: 'womens-rights',
    slug: 'prostitution-hate-crime-prisons',
    title: 'Prostitution law, hate crime and women’s prisons',
    summary:
      'The Prostitution Reform Act 2003 would be replaced with the Equality Model — decriminalising the prostituted ' +
      'person, criminalising buyers and brothel owners, and funding exit services. On hate crime the party opposes ' +
      'new offences but wants “sex” added to the aggravating factors already in the Sentencing Act. It opposes ' +
      'housing biological males in women’s prisons, and backs a ban on “rough sex” as a defence to murder or serious ' +
      'harm.',

    facts: [
      { label: 'Prostitution Reform Act', value: 'Replaced', note: 'With the Equality, or Nordic, Model' },
      { label: 'Who is criminalised', value: 'Buyers and brothel owners', note: 'Not the prostituted person' },
      { label: 'Section 19', value: 'Kept', note: 'Barring temporary visa holders from prostitution' },
      { label: 'Sentencing Act', value: 'Add “sex”', note: 'To the aggravating factors in section 9(1)(h)' },
      { label: 'New hate crime laws', value: 'Opposed', note: 'Standalone sex-based laws preferred' },
      { label: '“Rough sex” defence', value: 'Banned', note: 'In murder or serious harm cases' },
    ],

    coveredLabel: 'What the Equality Model would provide',
    exemptLabel: 'Where they part from the hate crime proposals',

    covered: [
      'Decriminalisation for the prostituted person',
      'Criminal liability for those who exploit them — the buyer and the brothel owner',
      'Exit services including housing, education, training, legal and welfare services',
      'Childcare, and emotional and psychological support to help women build new lives',
    ],

    exempt: [
      'No new “hate crime” laws — the party opposes creating them',
      '“Sex” added to the Sentencing Act’s existing aggravating factors instead',
      '“Gender identity” opposed as an aggravating factor',
      '“Hostility” kept as the statutory word rather than “hate”, which they call too subjective and vague',
    ],

    mechanics: [
      {
        heading: 'Replacing the Prostitution Reform Act',
        body:
          'The Equality Model — also called the Nordic Model, Abolition Model or Sex Buyer Law — would replace the ' +
          'Prostitution Reform Act 2003. It decriminalises the prostituted person while criminalising those who ' +
          'exploit them, and pairs that with funded exit services for women wanting to leave: housing, education, ' +
          'training, legal and welfare services, childcare, and emotional and psychological support.',
      },
      {
        heading: 'Section 19 in the meantime',
        body:
          'While the 2003 Act remains, the document strongly opposes removing section 19, which bars people on ' +
          'temporary visas such as student visas from prostitution. Its stated reason is preventing international ' +
          'trafficking.',
      },
      {
        heading: '“Rough sex” as a defence',
        body:
          'The party would work with other groups to call for a ban on using “rough sex” as a defence in a murder ' +
          'case or one involving serious harm. The document links this to its opposition to pornography, which it ' +
          'describes as filmed prostitution.',
      },
      {
        heading: 'Hate crime and the Sentencing Act',
        body:
          'The position is against new hate crime laws but for a specific amendment. The Sentencing Act’s section ' +
          '9(1)(h) lists characteristics including race, colour, nationality, religion, gender identity, sexual ' +
          'orientation, age and disability — but not sex. The document argues that absence suggests hating women is ' +
          'more acceptable than other hatreds, and would add “sex” to the list. It opposes hate crime laws generally ' +
          'as creating what it calls a hierarchy of victimhood, and prefers standalone sex-based laws with penalties ' +
          'matching the seriousness of the offence.',
      },
      {
        heading: 'Single-sex spaces and prisons',
        body:
          'Women and girls would have the right to single-sex gatherings for any purpose, including women-only social ' +
          'media groups, and to single-sex spaces the document lists as including toilets, changing rooms, prisons, ' +
          'refuges, rape crisis centres, saunas, swimming facilities and hospital wards. It opposes housing ' +
          'biological males in women’s prisons, and adds that women prisoners must have humane and supportive ' +
          'conditions for pregnancy, birth and caring for babies.',
      },
      {
        heading: 'Refuges, protection orders and exit services',
        body:
          'More resource to help women leave domestic violence, public funding for women-only refuge services, public ' +
          'funding for services supporting detransitioners, and exit services for women leaving gangs or religious ' +
          'cults. On the justice system: protection orders enforced, and applications for them accessible and ' +
          'affordable.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'The Equality Model decriminalises prostitution for the prostituted person and criminalises those who exploit prostitutes, such as the buyer and brothel owner.',
        context: 'Prostitution Reform',
      },
      {
        text: 'We support Section 19, which helps to prevent international trafficking.',
        context: 'Prostitution Reform',
      },
      {
        text: 'The Women’s Rights Party does not support the creation of new “hate crime” laws.',
        context: 'Hate Crimes Legislation',
      },
      {
        text: 'The Women’s Rights Party opposes the housing of biological males in women’s prisons.',
        context: 'Protecting women’s and children’s spaces and safety',
      },
    ],

    openQuestions: [
      'No cost is given for the exit services the Equality Model depends on, or for the increased refuge funding.',
      'How the change from the Prostitution Reform Act would work for people currently working legally under it is not addressed.',
      'The ban on “rough sex” as a defence is described as something the party would work with others to call for, without naming the legislative change required.',
      'Where transgender prisoners would be housed instead is not stated.',
      'Whether adding “sex” to section 9(1)(h) would sit alongside “gender identity”, which the party opposes as a listed factor, or replace it, is not resolved.',
      'The standalone sex-based laws preferred to hate crime legislation are not specified.',
    ],

    source: {
      documentTitle: 'Policy of the Women’s Rights Party',
      publisher: 'Women’s Rights Party',
      documentDate: 'November 2025',
      url: 'https://womensrightsparty.nz/policy/',
      retrieved: '2026-08-16',
    },
  },

  // ── Animal Justice Party ───────────────────────────────────────────────────

  {
    topics: ['environment'],
    party: 'animal-justice',
    slug: 'animals-in-law',
    title: 'Animals in law: legal standing, a Commissioner, and ending factory farming',
    summary:
      'The AJP would end the legal classification of animals as property, define sentience in legislation, and create ' +
      'an independent Commissioner for Animals — taking oversight away from the ministry that also promotes farming ' +
      'exports. It would ban the most harmful farming and fishing practices with funded transition support for ' +
      'farmers, make no-kill the national default for pounds, ban recreational hunting, and replace cat culls with ' +
      'desexing, Trap-Neuter-Return and predator-proof fencing.',

    facts: [
      { label: 'Animals in law', value: 'No longer property', note: 'Sentience defined in legislation, with legal rights' },
      { label: 'Oversight', value: 'An independent Commissioner', note: 'Out of MPI, which also promotes agriculture exports' },
      { label: 'Killed for food yearly', value: '27m + 120m', note: 'Sheep, cattle and pigs; plus chickens, on their figures' },
      { label: 'Auckland pounds', value: '60% killed', note: 'Of dogs impounded last year, rather than rehomed' },
      { label: 'Pounds', value: 'No-kill by default', note: 'Nationally, rather than as the exception' },
      { label: 'Cats', value: 'Desexing, not culling', note: 'With Trap-Neuter-Return and predator-proof fencing' },
    ],

    coveredLabel: 'The legislative foundations they propose',
    exemptLabel: 'What they would ban',

    covered: [
      'Define animal sentience in legislation',
      'Strengthen legal protections recognising animals as sentient beings',
      'A new legislative framework with positive welfare obligations',
      'Constitutional rights for nature — legal personhood for ecosystems and species',
      'Abolish the legal classification of animals as property and grant animals legal rights',
    ],

    exempt: [
      'The most harmful farming and fishing practices, factory farming among them',
      'Recreational hunting and hunting competitions',
      'Live export by air, extending the existing ban',
      'The private sale and use of fireworks',
      'Rodeo, greyhound racing and animals in entertainment',
    ],

    mechanics: [
      {
        heading: 'Taking animals out of property law',
        body:
          'The document’s foundational claim is that animals are property under New Zealand law, and that this makes ' +
          'them very hard to protect in any meaningful way. The proposed framework defines sentience in legislation, ' +
          'recognises animals as sentient beings, imposes positive welfare obligations rather than only prohibitions, ' +
          'and grants animals legal rights — alongside advocating legal personhood for ecosystems and species.',
      },
      {
        heading: 'An independent Commissioner for Animals',
        body:
          'Animal welfare is currently regulated by the Ministry for Primary Industries, which the party notes is the ' +
          'same department responsible for export opportunities and agricultural productivity. Their argument is that ' +
          'this is a conflict of interest and that welfare decisions are consequently driven by industry ' +
          'stakeholders. The Commissioner would be independent, hold real powers, and answer to the public.',
      },
      {
        heading: 'Ending factory farming, with transition support',
        body:
          'The long-term goal is stated plainly as abolishing animal farming and moving to plant-based, cellular and ' +
          'sustainable agriculture. The nearer-term steps are banning the most harmful farming and fishing practices, ' +
          'tougher enforcement, and financial support for farmers to change — the document is explicit that the ' +
          'transition takes time and that change leaving rural communities behind is not good change.',
      },
      {
        heading: 'Pound reform',
        body:
          'The problem named is structural rather than about individual dogs: short timeframes to claim a dog, ' +
          'upfront costs families cannot pay in one go, and shelters past capacity. The policy makes rehoming and ' +
          'no-kill the national default, and aims to reduce how many dogs go unclaimed in the first place.',
      },
      {
        heading: 'Conservation without culling cats',
        body:
          'The party supports protecting indigenous species but rejects mass killing of cats, arguing there is no ' +
          'reliable way to distinguish a feral cat from a companion animal or a community cat. Its alternative is ' +
          'nationwide desexing, Trap-Neuter-Return, habitat restoration and predator-proof fencing, framed as ' +
          'compassionate conservation.',
      },
      {
        heading: 'Hunting',
        body:
          'Recreational hunting and hunting competitions would be banned. The stated reasons are the suffering caused ' +
          'to target animals and to non-target species taken unintentionally, and the effect the party argues ' +
          'competitions have in normalising killing — it names school activities such as “Toss the Poss” as teaching ' +
          'children to treat some species as disposable.',
      },
      {
        heading: 'Ecosystems and land use',
        body:
          'The environmental case runs through agriculture: a shift to productive land use without farming animals, ' +
          'which the party argues opens up rewilding of farmland and carbon sequestration alongside habitat ' +
          'restoration and action on pollutants and pesticides. It frames this through kaitiakitanga and guardianship ' +
          'of the land.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'Every year in this country, around 27 million sheep, cows, and pigs are killed for food. 120 million chickens.',
        context: 'Election 2026 Manifesto — a message from our co-leaders',
      },
      {
        text: 'Right now, animals are property under New Zealand law. That makes it very hard to protect them in any meaningful way.',
        context: 'Giving animals legal standing',
      },
      {
        text: 'Animal welfare is currently overseen by the same ministry that promotes the farming industry. That’s a conflict of interest, and it shows.',
        context: 'An independent voice for animals',
      },
      {
        text: 'We want to ban the most harmful farming and fishing practices, and we want to support farmers to make that transition properly, with real funding and time to adjust. Change that leaves rural communities behind isn’t good change.',
        context: 'Ending factory farming',
      },
      {
        text: 'Cats didn’t put themselves in the wild. Humans did.',
        context: 'Smarter conservation, not a war on cats',
      },
    ],

    openQuestions: [
      'No cost is given for any of it — not the Commissioner, the transition support for farmers, the desexing programme, or pound reform.',
      'No timeline is given for the transition away from animal farming, which the document accepts will take time.',
      'What "the most harmful farming and fishing practices" covers, and where the line falls, is not defined.',
      'Granting animals legal rights is stated as an aim without describing how those rights would be exercised or enforced, or by whom.',
      'The Commissioner’s statutory powers, appointment and relationship to MPI are not set out.',
      'The manifesto figures carry footnoted sources, but the policy pages themselves cite none, and each links a separate PDF the site does not surface in full.',
    ],

    source: {
      documentTitle: 'Election 2026 Manifesto',
      publisher: 'Animal Justice Party Aotearoa NZ',
      documentDate: '2026',
      url: 'https://animaljustice.org.nz/election-2026/election-manifesto/',
      retrieved: '2026-08-16',
      alsoFrom: [
        { documentTitle: 'Their policy pages', note: 'thirty-two of them, including Legislative Foundations, Commissioner for Animals, Hunting and Ecosystems' },
      ],
    },
  },

  {
    topics: ['health'],
    party: 'animal-justice',
    slug: 'food-system-and-health',
    title: 'The food system: plant-based public catering and vet costs',
    summary:
      'More plant-based food in schools, hospitals and public institutions, which the party argues would cut costs ' +
      'and improve nutrition — citing modelling that a shift to plant-rich diets could save the health system up to ' +
      '$22 billion in prevented chronic disease. Alongside it: clearer food labelling, fairer access to veterinary ' +
      'care as vet bills become unaffordable, and bereavement leave for the loss of an animal.',

    facts: [
      { label: 'Claimed health saving', value: 'Up to $22bn', note: 'In prevented chronic disease, from cited modelling' },
      { label: 'Where', value: 'Schools and hospitals', note: 'And other public institutions' },
      { label: 'Labelling', value: 'Clearer', note: 'So people can make informed choices' },
      { label: 'Vet care', value: 'Fairer access', note: 'Bills described as genuinely unaffordable for many' },
      { label: 'Bereavement leave', value: 'Supported', note: 'For the loss of an animal companion' },
      { label: 'Waterways', value: '95% over limits', note: 'In farming areas, on the figure they cite from MfE' },
    ],

    mechanics: [
      {
        heading: 'Plant-based food in public institutions',
        body:
          'The proposal is more plant-based food in schools, hospitals and other public institutions, argued on two ' +
          'grounds at once: lower cost and better nutrition. The supporting figure is modelling the party cites ' +
          'suggesting a shift toward plant-rich diets could save the health system up to $22 billion in prevented ' +
          'chronic disease.',
      },
      {
        heading: 'Food labelling',
        body:
          'Clearer labelling so people can make informed choices — presented as a consumer information measure ' +
          'alongside the catering change rather than a restriction on what can be sold.',
      },
      {
        heading: 'The cost of veterinary care',
        body:
          'The party’s framing is relational rather than clinical: for many people their animal is their closest ' +
          'relationship, and vet bills have become genuinely unaffordable. It would push for fairer access to ' +
          'veterinary care, and supports bereavement leave when someone loses an animal they love.',
      },
      {
        heading: 'Why they treat food as a health policy',
        body:
          'The document links the food system to health costs, emissions and water quality in one argument — putting ' +
          'sheep and cattle at nearly half of New Zealand’s greenhouse gas emissions and citing Ministry for the ' +
          'Environment data that 95 percent of waterways in farming areas exceed safe contamination limits, with the ' +
          'health costs of the current food system running into the billions.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'Estimates suggest a shift toward plant-rich diets could save New Zealand’s health system up to $22 billion in prevented chronic disease.',
        context: 'Healthier food, lower costs',
      },
      {
        text: 'More plant-based food in schools, hospitals, and public institutions would cut costs and improve nutrition.',
        context: 'Healthier food, lower costs',
      },
      {
        text: 'Vet bills have become genuinely unaffordable for a lot of families.',
        context: 'Vet costs and the bonds that matter',
      },
    ],

    openQuestions: [
      'Whether plant-based catering would be mandated, offered alongside existing options, or phased in is not stated.',
      'The $22 billion figure is cited to external modelling without a period over which the saving accrues.',
      '“Fairer access to veterinary care” is not defined — no subsidy, scheme or price mechanism is described.',
      'Bereavement leave is supported without saying how much, for whom, or whether it would be statutory.',
      'What clearer food labelling would require is not specified.',
      'No cost is given for any of the measures, including the catering change that carries the savings claim.',
    ],

    source: {
      documentTitle: 'Election 2026 Manifesto',
      publisher: 'Animal Justice Party Aotearoa NZ',
      documentDate: '2026',
      url: 'https://animaljustice.org.nz/election-2026/election-manifesto/',
      retrieved: '2026-08-16',
    },
  },

  // ── Conservative Party ─────────────────────────────────────────────────────
  //
  // One dive rather than several. Their policies page lists announcements on
  // finance, trade, foreign affairs, defence, police and fisheries, but each of
  // those pages renders only a title and a date — the body does not load, so
  // there is nothing to read. That is recorded as an open question rather than
  // left as an apparent gap in our coverage.

  {
    topics: ['economy'],
    party: 'conservative',
    slug: 'smaller-government',
    title: 'Smaller government: spending, agencies and regulation',
    summary:
      'The Conservatives would shrink government to what they call its core business — justice, defence, border ' +
      'control and critical infrastructure — abolishing agencies and programmes they judge useless, ending all ' +
      'climate-focused taxes, subsidies and regulations, and ending corporate welfare including media subsidies. ' +
      'Working for Families would be replaced by FamilyBuilder tax cuts, legislation would curtail what they term ' +
      'unconstitutional bureaucratic power, and spending would be redirected to roads, bridges and waterways.',

    facts: [
      { label: 'Core business', value: 'Four areas', note: 'Justice, defence, border control, critical infrastructure and services' },
      { label: 'Climate policy', value: 'Taxes and rules ended', note: 'All climate-focused taxes, subsidies and regulations' },
      { label: 'Working for Families', value: 'Replaced', note: 'By what they call FamilyBuilder tax cuts' },
      { label: 'Corporate welfare', value: 'Ended', note: 'All forms, including subsidies for the media' },
      { label: 'Spending redirected', value: 'Roads, bridges, waterways', note: 'Critical services and infrastructure' },
      { label: 'Bureaucratic power', value: 'Curtailed by law', note: 'Legislation to limit what they call unconstitutional power' },
    ],

    coveredLabel: 'What they would cut',
    exemptLabel: 'What they call core business',

    covered: [
      'Government agencies and programmes they judge useless',
      'Wasteful spending and unnecessary regulation',
      'All climate-focused taxes, subsidies and regulations',
      'All forms of corporate welfare, including subsidies for the media',
      'Working for Families, replaced by FamilyBuilder tax cuts',
      'What they describe as the gravy train for public servants, consultants, tribal elites and politicians',
    ],

    exempt: [
      'Justice',
      'Defence',
      'Border control',
      'Critical infrastructure and services',
      'Roads, bridges and waterways, which spending would be redirected towards',
    ],

    mechanics: [
      {
        heading: 'The core-business test',
        body:
          'The organising idea is a narrow definition of what government is for: justice, defence, border control, ' +
          'and critical infrastructure and services. Everything measured against that. The stated premise is that ' +
          'New Zealand is over-governed, over-regulated and over-taxed, and that debt levels are a crisis needing ' +
          'attention now.',
      },
      {
        heading: 'Curtailing bureaucratic power',
        body:
          'Legislation to curtail what the party calls unconstitutional bureaucratic power, alongside abolishing ' +
          'agencies and programmes it judges useless and ending regulation it considers unnecessary. Their wider ' +
          'priorities list adds a smaller government workforce, fewer layers of government, accountable local ' +
          'government, and defending freedom of speech and assembly.',
      },
      {
        heading: 'Welfare and education',
        body:
          'The welfare system would be reformed with Working for Families replaced by FamilyBuilder tax cuts, and ' +
          'education reformed including early childhood education — the stated test being whether the system ' +
          'supports the family rather than undermining it.',
      },
      {
        heading: 'Ending climate-related economic policy',
        body:
          'All climate-focused taxes, subsidies and regulations would end, which the party frames as restoring ' +
          'rational economic policy. Alongside it, all corporate welfare would go, with subsidies for the media named ' +
          'specifically.',
      },
      {
        heading: 'Where the money would go instead',
        body:
          'Spending redirected towards critical services and infrastructure — roads, bridges and waterways are named ' +
          '— with major infrastructure projects reviewed for viability, real benefit, and delivery on time and within ' +
          'budget.',
      },
      {
        heading: 'Reviewing spending as a habit',
        body:
          'The party would regularly review current expenditure, which it notes is day-to-day spending that dwarfs ' +
          'capital expenditure, with a view to reducing costs — presenting this as something every government should ' +
          'do continuously rather than as a one-off exercise.',
      },
    ],

    examples: [],

    quotes: [
      {
        text: 'New Zealand is over-governed, over-regulated, and over-taxed',
        context: 'Opening statement',
      },
      {
        text: 'The only solution is to shrink government, so that it focuses on its core business - justice, defence, border control, and critical infrastructure and services.',
        context: 'On what government is for',
      },
      {
        text: 'We do not need Big Government done better.',
        context: 'On why they say incremental reform will not do',
      },
      {
        text: 'Everyday New Zealanders have to work hard to balance their books, and they need government to do the same.',
        context: 'On reviewing expenditure',
      },
    ],

    openQuestions: [
      'No figure is given for how much spending would be cut, over what period, or what it would mean for the deficit.',
      'Which agencies and programmes are judged useless is not named anywhere on the page.',
      'FamilyBuilder is named as the replacement for Working for Families, but the party’s own page describing it is marked “(deleted)” on their site, so no detail on it is available.',
      'What “unconstitutional bureaucratic power” covers, and what the legislation would actually do, is not defined.',
      'Ending all climate-focused taxes, subsidies and regulations is stated without saying what happens to the Emissions Trading Scheme or to existing international commitments.',
      'The education reform, including early childhood education, is referred to without any detail at all.',
      'Their policies page lists announcements on finance, trade, foreign affairs, defence, police and fisheries, but each of those pages loads only a title and a date with no readable content, so none of it could be covered here.',
    ],

    source: {
      documentTitle: 'Small Government',
      publisher: 'Conservative Party NZ',
      url: 'https://www.conservatives.nz/small-government',
      retrieved: '2026-08-16',
      alsoFrom: [
        { documentTitle: 'Our Policies', note: 'their policy index, for the Smaller Government priorities' },
      ],
    },
  },
]

/** Every deep dive for a topic/party pair, in declaration order.
 *
 *  Returns a list, not one: a party can have more than one document-backed
 *  policy on the same topic. Labour's economy page carries both the capital
 *  gains tax and the Future Fund. Returning only the first silently hid the
 *  second. */
export function getDeepDives(topic: string, party: string): PolicyDeepDive[] {
  return POLICY_DEEP_DIVES.filter(
    (d) => d.party === party && d.topics.includes(topic as PolicyTopic),
  )
}

/** One deep dive by its URL. Scoped to the topic and party rather than looked up
 *  on slug alone, so /policies/health/act/capital-gains-tax 404s instead of
 *  serving Labour's tax policy under ACT's banner. */
export function getDeepDive(topic: string, party: string, slug: string): PolicyDeepDive | undefined {
  return getDeepDives(topic, party).find((d) => d.slug === slug)
}

/** Every deep dive URL, for the sitemap. */
export function allDeepDivePaths(): { topic: PolicyTopic; party: PartySlug; slug: string }[] {
  return POLICY_DEEP_DIVES.flatMap((d) =>
    d.topics.map((topic) => ({ topic, party: d.party, slug: d.slug })),
  )
}
