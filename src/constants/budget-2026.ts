/**
 * Budget 2026 — factual, non-partisan summary.
 *
 * SOURCE: The Treasury, "Budget at a Glance", Budget 2026 (delivered 28 May 2026).
 * https://www.budget.govt.nz/budget/2026/at-a-glance/index.htm
 *
 * IMPORTANT (credibility): The Budget is an official GOVERNMENT/Crown fiscal
 * document published by The Treasury and presented by the Minister of Finance —
 * it is NOT a party document. Every figure below is taken verbatim from the
 * Treasury "Budget at a Glance" pages. We present the numbers neutrally and do
 * NOT repeat the government's political framing as fact, do not editorialise,
 * and do not assign economic cause-and-effect. Where the Treasury states an
 * outlook qualitatively (no published figure on the at-a-glance page), we keep
 * it qualitative rather than inventing a number.
 */

export const BUDGET_META = {
  year: 2026,
  title: 'Budget 2026',
  deliveredOn: '28 May 2026',
  financeMinister: 'Minister of Finance',
  governmentLabel: 'National-led coalition government (National, ACT, NZ First)',
  sourceLabel: 'The Treasury — Budget at a Glance',
  sourceUrl: 'https://www.budget.govt.nz/budget/2026/at-a-glance/index.htm',
  fiscalDataUrl: 'https://www.budget.govt.nz/budget/2026/data-library.htm',
  // Treasury's own measurement note — essential for reading the figures correctly.
  fundingNote:
    "Unless otherwise stated, funding refers to total operating expenditure over the forecast period (the four years to 2029/30). Capital funding is a one-off sum.",
}

/** The eight things the Budget says it does (Treasury "Budget 2026 package"). */
export const BUDGET_THEMES: string[] = [
  'Gets the books back to surplus and reduces debt as a share of GDP.',
  'Invests to drive better results in health, education, and law and order.',
  'Delivers infrastructure projects — hospitals, schools, courthouses, police stations, rail upgrades and a new Road of National Significance.',
  'Provides temporary, targeted support for households and public services facing fuel-price pressures.',
  'Advances reforms to increase energy security, boost housing growth and replace the RMA.',
  'Continues to rebuild the capacity of the Defence Force.',
  'Changes housing support and funds up to 2,250 more social houses.',
  'Ends final-year Fees Free, doubles Trades Academy places and funds 1,000 more Youth Guarantee places.',
]

/**
 * Macro outlook — Treasury states these qualitatively on the at-a-glance pages
 * (the precise forecast figures live in the charts / Budget Economic & Fiscal
 * Update, not as text). We therefore keep them qualitative and attributed.
 */
export const BUDGET_OUTLOOK = {
  economic: {
    title: 'Economic outlook',
    summary:
      'Treasury forecasts the economy continuing to grow, with inflation coming down after an initial spike from higher fuel prices.',
    indicators: ['Economic growth (real GDP)', 'Consumers Price Index (CPI) inflation'],
  },
  fiscal: {
    title: 'Fiscal outlook',
    summary:
      'Treasury forecasts the operating balance (OBEGAL, excluding ACC) returning to surplus in 2028/29, with net core Crown debt peaking and then declining as a share of GDP.',
    indicators: ['Operating balance (OBEGAL, excl. ACC)', 'Net core Crown debt'],
  },
}

export type BudgetKind = 'operating' | 'capital' | 'saving' | 'mixed'

export interface BudgetItem {
  amount?: string
  kind?: BudgetKind
  text: string
}

export interface BudgetSector {
  key: string
  label: string
  headline: string
  blurb: string
  items: BudgetItem[]
}

/** Every figure verbatim from the Treasury at-a-glance sector pages. */
export const BUDGET_SECTORS: BudgetSector[] = [
  {
    key: 'health',
    label: 'Health',
    headline: '+$5.5b operating',
    blurb: 'New funding to support access to timely, quality healthcare.',
    items: [
      { amount: '$5.5b', kind: 'operating', text: 'Increase in funding for frontline health services.' },
      { amount: '$682m', kind: 'capital', text: 'Capital investment, including a new tower block for Whangārei Hospital.' },
      { amount: '$54m', kind: 'operating', text: 'Additional funding for Pharmac to purchase medicines.' },
      { amount: '$34m', kind: 'operating', text: 'Funding for three-day postnatal stays.' },
      { amount: '$16m', kind: 'operating', text: 'Specialist paediatric palliative care.' },
      { amount: '$33m', kind: 'operating', text: 'Extend National Bowel Screening eligibility to age 56.' },
      { amount: '$35m', kind: 'operating', text: 'Boost support for road ambulance services.' },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    headline: '$131m teaching + $470m capital',
    blurb: 'Supports lifting achievement, and reinvests savings from ending final-year Fees Free into trades and vocational education.',
    items: [
      { amount: '$131m', kind: 'operating', text: 'Strengthen teaching and learning in reading, writing and maths.' },
      { amount: '$470m', kind: 'capital', text: 'Redevelop up to 10 schools, deliver up to 232 classrooms, and buy land for new schools.' },
      { amount: '$74m', kind: 'operating', text: 'Support a refreshed curriculum and new national qualifications.' },
      { amount: '$212m', kind: 'operating', text: 'Continue Healthy School Lunches and ECE Food programmes in 2027.' },
      { amount: '~$1b', kind: 'saving', text: 'Ending final-year Fees Free at the end of 2026 (a saving of just over $1 billion).' },
      { amount: '$69m', kind: 'operating', text: 'Double Trades Academy places to 20,000 for year 11–13 students.' },
      { amount: '$87m', kind: 'operating', text: '1,000 more Youth Guarantee places (free learning for low/no-qualification young people).' },
      { amount: '$25m', kind: 'operating', text: 'Increase funding rates for foundation-education providers.' },
    ],
  },
  {
    key: 'law-order',
    label: 'Law & order',
    headline: '$503m Corrections + $50m Police',
    blurb: 'New funding aimed at reducing crime and community safety.',
    items: [
      { amount: '$503m', kind: 'operating', text: 'Frontline Corrections services, including resources to manage prison growth.' },
      { amount: '$50m', kind: 'operating', text: 'Additional funding for frontline policing.' },
      { amount: '$215m', kind: 'capital', text: 'New courthouses in Rotorua and new police stations in Whanganui and Greymouth.' },
      { amount: '$21m', kind: 'operating', text: 'Customs — combat drug smuggling and transnational crime.' },
      { kind: 'operating', text: 'Funding to reform the firearms safety system.' },
    ],
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure',
    headline: '$1.8b expressway + $1.2b rail',
    blurb: 'Funding to build or enable infrastructure. New spending sits on top of an existing pipeline — around $60 billion is expected to be spent over the next four years.',
    items: [
      { amount: '$1.8b', kind: 'capital', text: 'Build the Cambridge to Piarere Expressway (a Road of National Significance).' },
      { amount: '$705m + $477m', kind: 'mixed', text: 'Renew and upgrade the rail network ($705m capital, $477m operating).' },
      { amount: '$400m', kind: 'capital', text: 'State highway resilience upgrades.' },
      { amount: '$400m', kind: 'operating', text: 'New financial incentive for councils to encourage housing growth.' },
      { amount: '$294m', kind: 'operating', text: 'Drive forward resource management system reforms (RMA replacement).' },
    ],
  },
  {
    key: 'housing-welfare',
    label: 'Social housing & welfare',
    headline: 'Up to 2,250 social houses',
    blurb: 'Changes to the social housing and welfare systems, described by Treasury as improving "fairness and sustainability".',
    items: [
      { amount: '$69m', kind: 'operating', text: 'Fund up to 2,250 additional social houses.' },
      { kind: 'mixed', text: 'A fiscally neutral package: increase the Accommodation Supplement for private renters, and increase income-related rents for people in social housing.' },
      { amount: '$196m', kind: 'saving', text: 'Lower maximum payments of Temporary Additional Support (a saving).' },
      { amount: '$45m', kind: 'operating', text: 'Extend community food support and kids’ breakfast programmes.' },
      { kind: 'operating', text: 'More case management to support sole parents into work.' },
    ],
  },
  {
    key: 'cost-of-living',
    label: 'Cost of living (fuel response)',
    headline: '$50/week In-Work Tax Credit boost',
    blurb: 'Temporary, targeted support for households and services facing sustained fuel-price increases.',
    items: [
      { amount: '$373m', kind: 'operating', text: 'A $50-per-week increase to the In-Work Tax Credit for up to a year, to help working families with fuel costs.' },
      { amount: '$450m', kind: 'operating', text: 'Set aside for additional temporary fuel-related measures, if required.' },
      { amount: '$150m', kind: 'operating', text: 'Additional strategic fuel reserves to firm up fuel resilience.' },
      { amount: '$24m', kind: 'operating', text: 'Temporary increase in mileage rates for support workers and people travelling for specialist treatment.' },
      { kind: 'operating', text: 'Additional funding for Fire & Emergency, Corrections, Police, Customs and Education to maintain frontline operations.' },
    ],
  },
  {
    key: 'defence',
    label: 'Defence & foreign affairs',
    headline: '$2.3b capital + $1.2b operating',
    blurb: 'Investment in defence and intelligence capabilities, and promoting New Zealand’s interests overseas.',
    items: [
      { amount: '$2.3b + $1.2b', kind: 'mixed', text: 'Defence and intelligence capabilities ($2.3b capital, $1.2b operating).' },
      { amount: '$145m', kind: 'operating', text: 'A resilient, safe and secure offshore diplomatic and trade network.' },
      { amount: '$110m', kind: 'operating', text: 'International development cooperation, focused on the Pacific.' },
      { kind: 'mixed', text: 'Retain and grow Defence Force staff; keep Anzac-class frigates and HMNZS Canterbury operational; improve base facilities.' },
    ],
  },
  {
    key: 'energy',
    label: 'Energy security',
    headline: 'Generation + gas transition',
    blurb: 'Investments to support New Zealand’s energy security.',
    items: [
      { kind: 'capital', text: 'Capital investment in Genesis Energy to accelerate new generation and firming capacity.' },
      { kind: 'operating', text: 'A new loan guarantee scheme to support businesses to transition away from gas.' },
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue & tax',
    headline: 'New bank levy; FBT simplified',
    blurb: 'Tax measures to reduce compliance costs, maintain integrity, and retain capital and talent.',
    items: [
      { kind: 'operating', text: 'A new prudential levy on banks and other financial institutions, to help cover the cost of Reserve Bank regulation and supervision.' },
      { kind: 'operating', text: 'Simplify fringe benefit tax (FBT) rules for private motor-vehicle use to reduce compliance costs.' },
      { kind: 'operating', text: 'Tax-rule changes to help retain talent and support increased foreign investment.' },
      { kind: 'operating', text: 'Tax-rule changes for charities and not-for-profits that support the sector and maintain integrity.' },
    ],
  },
  {
    key: 'savings',
    label: 'Savings & reprioritisation',
    headline: '$424m + $2b in savings',
    blurb: 'Savings from agencies, redirected to frontline services or used to reduce future spending.',
    items: [
      { amount: '$424m', kind: 'saving', text: 'Savings reprioritised to frontline services.' },
      { amount: '$2b', kind: 'saving', text: 'Savings from future baseline reductions.' },
    ],
  },
  {
    key: 'other',
    label: 'Other initiatives',
    headline: 'Children, conservation & ID',
    blurb: 'Other initiatives to improve public services, reprioritise funding and meet commitments.',
    items: [
      { amount: '$184m', kind: 'operating', text: 'Additional for Oranga Tamariki to protect and support children.' },
      { amount: '$109m', kind: 'operating', text: 'Better control of wilding pines.' },
      { amount: '$36m', kind: 'operating', text: 'Make the SuperGold Card an official form of ID.' },
      { kind: 'operating', text: 'New technology to improve the emergency management system.' },
    ],
  },
]

export const KIND_LABEL: Record<BudgetKind, string> = {
  operating: 'Operating',
  capital: 'Capital (one-off)',
  saving: 'Saving',
  mixed: 'Operating + capital',
}
