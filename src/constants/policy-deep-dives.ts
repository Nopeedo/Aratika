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
