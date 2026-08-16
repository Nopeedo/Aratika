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

  {
    topics: ['economy'],
    party: 'labour',
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
      retrieved: '2026-08-14',
      alsoFrom: [
        { documentTitle: 'Tax Reset Policy Addendum', note: 'which sets out the ten-year implementation pathway' },
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
