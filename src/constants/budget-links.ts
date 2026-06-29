/**
 * budget-links.ts — connects Budget 2026 line items to the government's
 * existing commitments (record-national PROMISES / PRIORITIES).
 *
 * ⚠ Credibility: this is a FACTUAL cross-reference, not a verdict. A Budget
 * allocation shows money has been committed to an area — it does NOT prove an
 * outcome was achieved or a promise "kept". Statuses still come from the
 * scorecard. Every figure is from Budget 2026 (see budget-2026.ts → Treasury).
 */

export type FundRelation = 'continues' | 'advances' | 'new' | 'reprioritises'

export interface BudgetLink {
  /** Budget area it sits under (matches a BUDGET_SECTORS label loosely). */
  area: string
  /** The specific budget line, with its figure. */
  item: string
  relation: FundRelation
  /** Links to a record-national PROMISES id, when there's a clear commitment. */
  promiseId?: string
  /** Or a PRIORITIES theme (verbatim) when it maps to a broad priority not a single promise. */
  priority?: string
  /** Neutral note on the connection. */
  note: string
}

export const FUND_RELATION: Record<FundRelation, { label: string; color: string; bg: string; border: string }> = {
  continues:     { label: 'Continues',         color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  advances:      { label: 'Advances',          color: '#1e40af', bg: '#eef4ff', border: '#bfdbfe' },
  new:           { label: 'New this Budget',    color: '#5b21b6', bg: '#f3effe', border: '#ddd6fe' },
  reprioritises: { label: 'Savings / reprioritised', color: '#92400e', bg: '#fff9e6', border: '#fde68a' },
}

export const BUDGET_LINKS: BudgetLink[] = [
  // ── Continues / advances commitments already in place ──
  {
    area: 'Infrastructure', item: '$294m to resource management system reform',
    relation: 'advances', promiseId: 'rma-replace',
    note: 'Funds the work to replace the RMA — a commitment still marked in progress on the scorecard.',
  },
  {
    area: 'Infrastructure', item: '$1.8b for the Cambridge to Piarere Expressway',
    relation: 'advances', priority: 'Infrastructure & growth',
    note: 'A "Road of National Significance" — part of the infrastructure & growth priority.',
  },
  {
    area: 'Savings & reprioritisation', item: '$424m reprioritised + $2b baseline reductions',
    relation: 'continues', promiseId: 'public-spend',
    note: 'Continues the commitment to reduce back-office spending and the size of the public service.',
  },
  {
    area: 'Fiscal strategy', item: 'Return to OBEGAL surplus forecast for 2028/29',
    relation: 'continues', priority: 'Restoring fiscal discipline',
    note: 'The surplus-and-debt track is the centre of the fiscal-discipline priority.',
  },
  {
    area: 'Law & order', item: '$503m Corrections + $50m Police + $215m capital',
    relation: 'continues', priority: 'Law and order',
    note: 'Continued funding behind the law-and-order programme (Three Strikes, gangs, sentencing).',
  },
  {
    area: 'Education', item: '$131m to strengthen reading, writing and maths teaching',
    relation: 'continues', promiseId: 'structured-literacy',
    note: 'Continues the "teach the basics" / structured-literacy commitment already delivered.',
  },
  {
    area: 'Social housing & welfare', item: 'More case management to move sole parents into work',
    relation: 'advances', promiseId: 'welfare-sanctions',
    note: 'Sits alongside the welfare work-obligations programme (in progress on the scorecard).',
  },

  // ── New in this Budget (no prior commitment in the scorecard) ──
  {
    area: 'Cost of living', item: '$373m — $50/week In-Work Tax Credit boost (up to a year)',
    relation: 'new', priority: 'Cost of living',
    note: 'A new, temporary measure responding to fuel-price pressure — not a pre-existing promise.',
  },
  {
    area: 'Education', item: 'Double Trades Academy places to 20,000; end final-year Fees Free (~$1b saving)',
    relation: 'new',
    note: 'A new shift in tertiary/vocational settings introduced in this Budget.',
  },
  {
    area: 'Revenue', item: 'New prudential levy on banks & financial institutions',
    relation: 'new',
    note: 'A new charge introduced in Budget 2026 to cover Reserve Bank regulation costs.',
  },
  {
    area: 'Social housing & welfare', item: '$69m for up to 2,250 more social houses',
    relation: 'new',
    note: 'New social-housing supply, alongside changes to the Accommodation Supplement and income-related rents.',
  },
  {
    area: 'Energy security', item: 'Genesis Energy investment + gas-transition loan guarantee',
    relation: 'new',
    note: 'New energy-security measures introduced in this Budget.',
  },
]

/** Promise ids that have at least one Budget 2026 line attached. */
export const FUNDED_PROMISE_IDS = new Set(
  BUDGET_LINKS.map((l) => l.promiseId).filter((x): x is string => Boolean(x)),
)

/**
 * "What's already in place" — official baseline context for reading the new
 * spending against. Kept qualitative where Treasury published it qualitatively
 * (the at-a-glance pages show the totals as charts only).
 */
export const BUDGET_BASELINE = {
  source: { label: 'Treasury — How taxpayers’ money is spent', url: 'https://www.budget.govt.nz/budget/2026/at-a-glance/taxpayers-money.htm' },
  points: [
    'Health, education, welfare and NZ Superannuation are the biggest areas of core Crown spending (Treasury, forecast core Crown expenses 2026/27).',
    'Government revenue is raised largely from income tax, GST and corporate tax.',
    'New infrastructure funding sits on top of an existing pipeline — around $60 billion is expected to be spent over the next four years.',
  ],
}
