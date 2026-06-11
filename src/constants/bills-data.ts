/**
 * Bills currently before the House — snapshot.
 *
 * ── Source & scope ─────────────────────────────────────────────────────────
 * Bill title, number, type, current stage, select committee and last-activity
 * date are taken from the official NZ Parliament bills register
 * (bills.parliament.nz, "Current" bills) as at the snapshot date below.
 *
 * This is the 10 most recently-active of 107 current bills. The parliament.nz
 * register paginates server-side and exposes an RSS feed (bills.parliament.nz/
 * rss?set=Bills) — the full, always-current list will be wired via that feed in
 * the live integration. Until then this is a clearly-labelled dated snapshot.
 *
 * Summaries are short plain-language paraphrases of each bill's official title
 * (its stated purpose); the full text and detail live on the official page.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { BillStatus } from '@/types'

export const BILLS_SNAPSHOT_DATE = '2026-05-28'
export const BILLS_TOTAL_CURRENT = 107   // total current bills per parliament.nz
export const BILLS_SOURCE_URL = 'https://bills.parliament.nz/bills-proposed-laws?Tab=Current'

export type BillKind = 'government' | 'members'

export interface BillRecord {
  slug:            string
  title:           string
  number:          string          // e.g. '324-1'
  kind:            BillKind
  stage:           BillStatus
  selectCommittee?: string
  lastActivity:    string          // ISO date
  summary:         string          // plain-language paraphrase of the title
}

export const BILLS: BillRecord[] = [
  {
    slug: 'appropriation-2025-26-supplementary-estimates-bill',
    title: 'Appropriation (2025/26 Supplementary Estimates) Bill',
    number: '324-1', kind: 'government', stage: 'select-committee',
    lastActivity: '2026-05-28',
    summary: 'Authorises supplementary government spending and appropriations for the 2025/26 financial year.',
  },
  {
    slug: 'appropriation-2026-27-estimates-bill',
    title: 'Appropriation (2026/27 Estimates) Bill',
    number: '323-1', kind: 'government', stage: 'second-reading',
    lastActivity: '2026-05-28',
    summary: 'Authorises the Government’s planned spending and appropriations for the 2026/27 financial year (the Budget).',
  },
  {
    slug: 'fair-trading-amendment-bill',
    title: 'Fair Trading Amendment Bill',
    number: '299-1', kind: 'government', stage: 'select-committee',
    selectCommittee: 'Finance and Expenditure',
    lastActivity: '2026-05-27',
    summary: 'Proposes amendments to the Fair Trading Act 1986, which governs consumer protection and fair business practice.',
  },
  {
    slug: 'disability-support-services-bill',
    title: 'Disability Support Services Bill',
    number: '312-1', kind: 'government', stage: 'select-committee',
    selectCommittee: 'Social Services and Community',
    lastActivity: '2026-05-21',
    summary: 'Establishes the statutory framework for the funding and delivery of disability support services.',
  },
  {
    slug: 'summary-offences-move-on-orders-amendment-bill',
    title: 'Summary Offences (Move-on Orders) Amendment Bill',
    number: '310-1', kind: 'government', stage: 'select-committee',
    selectCommittee: 'Justice',
    lastActivity: '2026-05-21',
    summary: 'Amends the Summary Offences Act 1981 to provide for police-issued move-on orders.',
  },
  {
    slug: 'crimes-impeding-major-bridges-tunnels-roads-amendment-bill',
    title: 'Crimes (Impeding Major Bridges, Tunnels, and Roads) Amendment Bill',
    number: '319-1', kind: 'members', stage: 'first-reading',
    lastActivity: '2026-05-21',
    summary: 'A Member’s Bill amending the Crimes Act 1961 in relation to the obstruction of major bridges, tunnels and roads.',
  },
  {
    slug: 'nz-humanitarian-aid-disaster-relief-medal-bill',
    title: 'New Zealand Humanitarian Aid and Disaster Relief Medal Bill',
    number: '316-1', kind: 'members', stage: 'first-reading',
    lastActivity: '2026-05-21',
    summary: 'A Member’s Bill establishing a New Zealand medal recognising humanitarian aid and disaster relief service.',
  },
  {
    slug: 'local-government-management-of-local-authorities-amendment-bill',
    title: 'Local Government (Management of Local Authorities) Amendment Bill',
    number: '314-1', kind: 'members', stage: 'first-reading',
    lastActivity: '2026-05-21',
    summary: 'A Member’s Bill amending the Local Government Act in relation to the management of local authorities.',
  },
  {
    slug: 'oranga-tamariki-suitable-accommodation-on-leaving-care-amendment-bill',
    title: 'Oranga Tamariki (Suitable Accommodation on Leaving Care) Amendment Bill',
    number: '317-1', kind: 'members', stage: 'first-reading',
    lastActivity: '2026-05-21',
    summary: 'A Member’s Bill amending the Oranga Tamariki Act 1989 regarding suitable accommodation for young people leaving State care.',
  },
  {
    slug: 'crown-minerals-prohibition-on-mining-on-conservation-land-amendment-bill',
    title: 'Crown Minerals (Prohibition on Mining on Conservation Land) Amendment Bill',
    number: '315-1', kind: 'members', stage: 'first-reading',
    lastActivity: '2026-05-21',
    summary: 'A Member’s Bill amending the Crown Minerals Act 1991 to prohibit mining on conservation land.',
  },
]

export const BILL_SLUGS = BILLS.map((b) => b.slug)

export function getBill(slug: string): BillRecord | undefined {
  return BILLS.find((b) => b.slug === slug)
}

// Ordered stage pipeline for the progress timeline on bill detail pages.
export const BILL_STAGE_PIPELINE: { key: BillStatus; label: string }[] = [
  { key: 'introduced',               label: 'Introduced' },
  { key: 'first-reading',            label: 'First Reading' },
  { key: 'select-committee',         label: 'Select Committee' },
  { key: 'second-reading',           label: 'Second Reading' },
  { key: 'committee-of-whole-house', label: 'Committee of the whole House' },
  { key: 'third-reading',            label: 'Third Reading' },
  { key: 'royal-assent',             label: 'Royal Assent' },
]
