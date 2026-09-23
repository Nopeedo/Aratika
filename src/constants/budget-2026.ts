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
  /**
   * NOT RENDERED. This holds a job title where a person's name belongs, so
   * "presented by the Minister of Finance" read as an unfilled placeholder
   * (§4, "name the party and the year"). The clause came off /budget rather
   * than guessing at a name: an unverified name on a page whose whole argument
   * is that every line is sourced is the one mistake this page cannot make
   * (§1.8). Put the real name here and the clause can go back.
   */
  financeMinister: 'Minister of Finance',
  governmentLabel: 'National-led coalition government (National, ACT, NZ First)',
  sourceLabel: 'The Treasury: Budget at a Glance',
  sourceUrl: 'https://www.budget.govt.nz/budget/2026/at-a-glance/index.htm',
  fiscalDataUrl: 'https://www.budget.govt.nz/budget/2026/data-library.htm',
  /* Treasury's own measurement note — essential for reading the figures
     correctly, which is why it survived the callout that was cut and now sits
     in the (i) beside the page title (§1.2).
     Plainer words (§1.7): "total operating expenditure over the forecast
     period" is Treasury's phrase, not a reader's. */
  fundingNote:
    'Unless a line says otherwise, a funding figure is money committed over the four years to mid-2030. A capital figure is a one-off sum.',
}

/** The eight things the Budget says it does (Treasury "Budget 2026 package"). */
export const BUDGET_THEMES: string[] = [
  'Gets the books back to surplus and reduces debt as a share of GDP.',
  'Invests to drive better results in health, education, and law and order.',
  'Delivers infrastructure projects, hospitals, schools, courthouses, police stations, rail upgrades and a new Road of National Significance.',
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
    /* Plainer words (§1.7): "OBEGAL, excluding ACC" is Treasury's accounting
       term, and it was doing the work of "the Government's operating balance"
       in the one sentence a reader has to understand. The acronym is kept in
       the indicator below and explained in the page's (i), so nothing is lost
       (§5.17) and the sentence is readable. */
    summary:
      'Treasury forecasts the Government’s operating balance returning to surplus in 2028/29, with net core Crown debt peaking and then declining as a share of the economy.',
    indicators: ['Operating balance (OBEGAL, excluding ACC)', 'Net core Crown debt'],
  },
}

/** What a reader can check the outlook against. Treasury publishes the forecast
 *  NUMBERS in the Budget Economic and Fiscal Update and the data library, not as
 *  text on the at-a-glance page these summaries come from, so the outlook panel
 *  points at the data rather than at the summary (§1.8). */
export const OUTLOOK_SOURCE = {
  label: 'Treasury fiscal data',
  url: 'https://www.budget.govt.nz/budget/2026/data-library.htm',
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
  /**
   * The tile's headline number, on its own, so it can be set on a baseline at
   * 20px (phone) / 24px (desktop) the way the party and MP directory cards set
   * a seat count (§2.14). It replaced a single `headline` string like
   * "$131m teaching + $470m capital", which could not be sized as a figure and
   * wrapped to three lines in a 150px tile.
   *
   * It is always a figure Treasury states, copied verbatim, never a total we
   * added up: summing a sector's lines would invent a number the Budget does
   * not publish (§1.8). Where the sector has no single headline amount, this
   * is the COUNT of its funding lines and `figureNote` says so.
   */
  figure: string
  /** True when `figure` is a COUNT of funding lines because Treasury publishes
   *  no single headline amount for this area. The panel says so outright, so a
   *  "4" can never be read as four billion (§1.5). */
  figureIsCount?: boolean
  /** The rest of the old headline, in plain words. Two lines, reserved. */
  figureNote: string
  blurb: string
  items: BudgetItem[]
  /**
   * Where this sector's figures can be checked (§1.8). Until this pass every
   * one of the 51 dollar figures on the page was covered by a single link in
   * the page footer, which is the construction that got three Treaty
   * Principles figures pulled: a page-level link evidences the page, not the
   * line. The link now sits in the panel with the lines it evidences.
   *
   * KNOWN GAP, deliberately not papered over: these all point at Treasury's
   * at-a-glance index, because the per-sector at-a-glance URLs have not been
   * checked against the live site from here. A guessed deep link is worse than
   * an honest shallow one. Verify each and narrow it.
   */
  source: { label: string; url: string }
}

/** The one source every sector currently carries. See `source` above. */
const AT_A_GLANCE = {
  label: 'Treasury: Budget at a Glance',
  url: 'https://www.budget.govt.nz/budget/2026/at-a-glance/index.htm',
}

/** Every figure verbatim from the Treasury at-a-glance sector pages. */
export const BUDGET_SECTORS: BudgetSector[] = [
  {
    key: 'health',
    label: 'Health',
    figure: '+$5.5b',
    figureNote: 'more for health services, ongoing',
    source: AT_A_GLANCE,
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
    figure: '$131m',
    figureNote: 'for teaching, plus $470m one-off',
    source: AT_A_GLANCE,
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
    figure: '$503m',
    figureNote: 'for Corrections, plus $50m for Police',
    source: AT_A_GLANCE,
    blurb: 'New funding aimed at reducing crime and community safety.',
    items: [
      { amount: '$503m', kind: 'operating', text: 'Frontline Corrections services, including resources to manage prison growth.' },
      { amount: '$50m', kind: 'operating', text: 'Additional funding for frontline policing.' },
      { amount: '$215m', kind: 'capital', text: 'New courthouses in Rotorua and new police stations in Whanganui and Greymouth.' },
      { amount: '$21m', kind: 'operating', text: 'Customs: combat drug smuggling and transnational crime.' },
      { kind: 'operating', text: 'Funding to reform the firearms safety system.' },
    ],
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure',
    figure: '$1.8b',
    figureNote: 'for the expressway, plus $1.2b for rail',
    source: AT_A_GLANCE,
    /* The "around $60 billion over the next four years" clause came off here.
       It is not a Budget 2026 figure, it is the size of the existing pipeline,
       and BUDGET_BASELINE in budget-links.ts states it already WITH the
       Treasury taxpayers-money link under it. Two statements of one number
       ~4,000px apart, one sourced and one not (§1.3), so the unsourced copy
       went and the evidenced one stayed (§5.17: checked field by field, the
       baseline bullet carries every word of this clause). */
    blurb: 'Funding to build or enable infrastructure, on top of the existing pipeline.',
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
    figure: 'Up to 2,250',
    figureNote: 'more social houses',
    source: AT_A_GLANCE,
    /* Was: 'described by Treasury as improving "fairness and sustainability"'.
       The quotation marks claimed verbatim Treasury wording that the page
       cannot point at a line for (§1.8, and the July 2026 position audit's
       quote-integrity finding: our summaries held up, our quoted phrases were
       paraphrases). Reported speech keeps the fact, that Treasury frames the
       changes this way, without claiming the words. */
    blurb: 'Changes to the social housing and welfare systems, which Treasury frames as improving fairness and sustainability.',
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
    figure: '$50',
    figureNote: 'a week more, In-Work Tax Credit',
    source: AT_A_GLANCE,
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
    figure: '$2.3b',
    figureNote: 'one-off, plus $1.2b ongoing',
    source: AT_A_GLANCE,
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
    figure: '2',
    figureIsCount: true,
    figureNote: 'funding lines',
    source: AT_A_GLANCE,
    blurb: 'Investments to support New Zealand’s energy security.',
    items: [
      { kind: 'capital', text: 'Capital investment in Genesis Energy to accelerate new generation and firming capacity.' },
      { kind: 'operating', text: 'A new loan guarantee scheme to support businesses to transition away from gas.' },
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue & tax',
    figure: '4',
    figureIsCount: true,
    figureNote: 'tax changes',
    source: AT_A_GLANCE,
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
    figure: '$424m',
    figureNote: 'reprioritised, plus $2b from baselines',
    source: AT_A_GLANCE,
    blurb: 'Savings from agencies, redirected to frontline services or used to reduce future spending.',
    items: [
      { amount: '$424m', kind: 'saving', text: 'Savings reprioritised to frontline services.' },
      { amount: '$2b', kind: 'saving', text: 'Savings from future baseline reductions.' },
    ],
  },
  {
    key: 'other',
    label: 'Other initiatives',
    figure: '4',
    figureIsCount: true,
    figureNote: 'other initiatives',
    source: AT_A_GLANCE,
    blurb: 'Other initiatives to improve public services, reprioritise funding and meet commitments.',
    items: [
      { amount: '$184m', kind: 'operating', text: 'Additional for Oranga Tamariki to protect and support children.' },
      { amount: '$109m', kind: 'operating', text: 'Better control of wilding pines.' },
      { amount: '$36m', kind: 'operating', text: 'Make the SuperGold Card an official form of ID.' },
      { kind: 'operating', text: 'New technology to improve the emergency management system.' },
    ],
  },
]

/**
 * §1.7, "plain words, not Parliament's" — which applies to Treasury's too.
 * "Operating" and "Capital" are the accounting terms; what a reader wants to
 * know is whether the money keeps coming or arrives once. These labels are the
 * pills over the sector grid, so the distinction is taught by operating the
 * control rather than by the legend paragraph that used to sit above it.
 */
export const KIND_LABEL: Record<BudgetKind, string> = {
  operating: 'Ongoing',
  capital: 'One-off',
  saving: 'Saving',
  mixed: 'Ongoing + one-off',
}

/** Colour per kind. One meaning only (§1.6): it is on the filter pills and on
 *  the dot beside each funding line, and nowhere else. The sector tiles are
 *  deliberately NOT coloured by kind — the modal kind of a sector's lines says
 *  nothing about where its dollars went. */
export const KIND_COLOR: Record<BudgetKind, { bg: string; fg: string }> = {
  operating: { bg: '#ecfdf5', fg: '#1F8A4C' },
  capital: { bg: '#eef4ff', fg: '#2563eb' },
  saving: { bg: '#fef3e7', fg: '#b45309' },
  mixed: { bg: '#f3effe', fg: '#7c3aed' },
}

/** Pill order over the grid: everything, then the two kinds of spending, then
 *  what was saved. A `mixed` line is both ongoing AND one-off, so it counts in
 *  both, which is what the Budget says it is. */
export function matchesKind(item: BudgetItem, kind: BudgetKind | null): boolean {
  if (!kind) return true
  if (item.kind === kind) return true
  if (item.kind === 'mixed') return kind === 'operating' || kind === 'capital'
  return false
}
