/**
 * COMPASS_STANCES — each party's stance on each of the 8 compass statements.
 *
 * SOURCING (combined, recent-anchored — see the project decision):
 *  - Primary = each party's CURRENT / 2026 stated position.
 *  - Corroborated by the 2023 manifesto; where 2026 diverges, 2026 wins.
 *  - Grounded in: the cited 2026 election policy tracker (which footnotes
 *    primary/news sources), RNZ's policy guides, and each party's official
 *    policy page / 2023 manifesto. Every cell carries a sourceUrl.
 *
 * NON-PARTISAN: `stance` describes the direction of the party's OWN stated
 * position relative to the statement — it is descriptive, not a judgement.
 * `summary` is neutral. A party with no clearly-stated position = `no_position`
 * (never guessed). `quote` is left null for now and enriched with verbatim
 * excerpts during review — the sourceUrl is the verifiable anchor.
 *
 * ⚠️ DRAFT FOR REVIEW — stances are classified from the sources below and need
 * sign-off before launch. Adjust any cell here; the UI reads straight from it.
 */

import type { CompassStances } from '@/constants/compass'

// Real, official / credible source anchors.
const S = {
  national: 'https://www.national.org.nz/plan',
  labour:   'https://www.labour.org.nz/our-policies',
  green:    'https://www.greens.org.nz/policy_complete_party',
  act:      'https://www.act.org.nz/policies',
  nzfirst:  'https://www.nzfirst.nz/policies',
  tpm:      'https://www.maoriparty.org/',
  tracker:  'https://en.wikipedia.org/wiki/2026_New_Zealand_general_election', // 2026 announcements, with citations
} as const

const lbl: Record<string, string> = {
  national: 'National — policy & 2026 announcements',
  labour:   'Labour — policy & 2026 announcements',
  green:    'Green — complete policy',
  act:      'ACT — policy & 2026 announcements',
  nzfirst:  'NZ First — policy & 2026 announcements',
  tpm:      'Te Pāti Māori — policy & 2026 announcements',
}

export const COMPASS_STANCES: CompassStances = {
  // 1 ── Taxes should be lower, even if it means less public-service spending ──
  'tax-vs-services': {
    national: { stance: 'support',          summary: 'Favours lower taxes and fiscal restraint over expanding public spending.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'oppose',           summary: 'Backs a capital gains tax on property to fund services — not lower taxes.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_oppose',  summary: 'Proposes a wealth tax and higher income/corporate rates to fund services.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'strongly_support', summary: 'Campaigns to cut government spending, lower taxes and merge ministries.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'mixed',            summary: 'Economically interventionist rather than tax-cutting; focus on cost of living.', quote: null, sourceUrl: S.nzfirst, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'strongly_oppose',  summary: 'Favours redistribution and higher taxes on wealth over lower taxes.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },

  // 2 ── Public health should get significantly more funding, even via higher tax ──
  'health-funding': {
    national: { stance: 'mixed',            summary: 'Supports health delivery but emphasises efficiency over higher taxes.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'strongly_support', summary: 'Would use a capital gains tax to subsidise GP visits and add free screenings.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_support', summary: 'Backs substantially more public-health funding through progressive taxes.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'oppose',           summary: 'Opposes higher taxes; favours efficiency, e.g. pharmacists easing GP load.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'support',          summary: 'Supports stronger public-health funding as part of core public services.', quote: null, sourceUrl: S.nzfirst, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'strongly_support', summary: 'Prioritises major investment in health, especially Māori health equity.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },

  // 3 ── Government should directly build more public housing ──
  'public-housing': {
    national: { stance: 'oppose',           summary: 'Prefers market-led supply and planning reform over state house building.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'support',          summary: 'Backs social/community housing, e.g. raising the Crown guarantee for builders.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_support', summary: 'Would build 40,000 social homes over five years, with rent caps.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'strongly_oppose',  summary: 'Favours private supply via deregulation rather than government building.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'mixed',            summary: 'Supports state intervention on housing/prices but not large-scale state builds.', quote: null, sourceUrl: S.nzfirst, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'support',          summary: 'Backs public and papakāinga/Māori housing to address the shortage.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },

  // 4 ── Increase funding for public schools and teachers ──
  'education-funding': {
    national: { stance: 'mixed',            summary: 'Focus on standards, structure and charter schools over funding increases.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'strongly_support', summary: 'Would reverse coalition cuts and restore apprenticeship support.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'support',          summary: 'Backs well-funded public education as a core public service.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'mixed',            summary: 'Prioritises school choice and autonomy over higher across-the-board funding.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'support',          summary: 'Supports public-education funding and removing extra costs for families.', quote: null, sourceUrl: S.nzfirst, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'support',          summary: 'Backs more education funding, especially kaupapa Māori education.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },

  // 5 ── Cut emissions faster, even with short-term economic cost ──
  'climate-speed': {
    national: { stance: 'oppose',           summary: 'Prefers a measured, lower-cost path over faster emissions cuts.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'support',          summary: 'Backs stronger climate action and the emissions-reduction framework.', quote: null, sourceUrl: S.labour, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_support', summary: 'Would revoke fossil-fuel/mining consents and accelerate renewables.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'strongly_oppose',  summary: 'Proposes a split-gas target to ease methane limits; wary of climate costs.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.act },
    nzfirst:  { stance: 'strongly_oppose',  summary: 'Would expand mining and curb conservation enforcement; sceptical of fast action.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'support',          summary: 'Backs strong climate action framed through environmental and Māori justice.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },

  // 6 ── Justice should prioritise tougher sentencing over rehabilitation ──
  'justice-sentencing': {
    national: { stance: 'strongly_support', summary: 'Campaigns on tougher sentencing, e.g. scrapping some sentence discounts.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.national },
    labour:   { stance: 'oppose',           summary: 'Leans toward prevention and rehabilitation over tougher sentencing.', quote: null, sourceUrl: S.labour, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_oppose',  summary: 'Prioritises rehabilitation and reducing the prison population.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'strongly_support', summary: 'Long-standing tough-on-crime stance with firmer sentencing.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'support',          summary: 'Supports tougher law-and-order and firmer sentencing.', quote: null, sourceUrl: S.nzfirst, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'strongly_oppose',  summary: 'Would phase out prisons by 2040 in favour of community-led approaches.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.tpm },
  },

  // 7 ── Treaty-based partnerships and Māori-specific policies maintained or expanded ──
  'treaty-partnership': {
    national: { stance: 'oppose',           summary: 'Has scaled back some Māori-specific policies while keeping the Treaty.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'support',          summary: 'Would reinstate Treaty obligations, e.g. for school boards.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_support', summary: 'Strong commitment to Te Tiriti partnership and Māori rights.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'strongly_oppose',  summary: 'Advocates "one law for all" and merging Māori-specific agencies.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.act },
    nzfirst:  { stance: 'strongly_oppose',  summary: 'Seeks a referendum on Māori seats and to remove Māori-specific bodies.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'strongly_support', summary: 'Proposes a Treaty Commissioner able to audit and veto non-compliant bills.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.tpm },
  },

  // 8 ── Do more to reduce inequality and support people on low incomes ──
  'inequality-support': {
    national: { stance: 'mixed',            summary: 'Emphasises growth and work over redistribution to address living costs.', quote: null, sourceUrl: S.national, sourceLabel: lbl.national },
    labour:   { stance: 'support',          summary: 'Backs targeted support and transport-fare caps to ease living costs.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.labour },
    green:    { stance: 'strongly_support', summary: 'Proposes a tax-free threshold and wealth tax to cut poverty and inequality.', quote: null, sourceUrl: S.green, sourceLabel: lbl.green },
    act:      { stance: 'oppose',           summary: 'Emphasises personal responsibility; tighter welfare settings.', quote: null, sourceUrl: S.act, sourceLabel: lbl.act },
    nzfirst:  { stance: 'support',          summary: 'Targets cost of living via market interventions on banks, energy and groceries.', quote: null, sourceUrl: S.tracker, sourceLabel: lbl.nzfirst },
    tpm:      { stance: 'strongly_support', summary: 'Centres reducing poverty and inequality, especially for Māori and low-income whānau.', quote: null, sourceUrl: S.tpm, sourceLabel: lbl.tpm },
  },
}
