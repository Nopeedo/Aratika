/**
 * bill-links — resolve a bill *title* to the best page for it, so lists that only
 * carry a title (e.g. an MP's "bills they've worked on") can link through to the
 * bill. The 54th-Parliament dataset (BILLS_54) shares titles with those lists —
 * same source/build script — so a normalised-title match is reliable.
 *
 * Resolution order (mirrors the /bills tracker):
 *   1. internal plain-language reader  /legislation/[slug]   (when one is published)
 *   2. the official parliament.nz page  (every BILLS_54 bill has one)
 */

import { BILLS_54, type Bill54 } from '@/constants/bills-54'
import { normBillTitle } from './slug'

/** Re-exported so the callers that resolve a link and normalise a title still
 *  get both from here. The definition moved to ./slug, which nothing heavy
 *  imports — this module pulls in the whole register. */
export { normBillTitle }

const BILL54_BY_TITLE = new Map(BILLS_54.map((b) => [normBillTitle(b.title), b]))

export function bill54ByTitle(title: string): Bill54 | null {
  return BILL54_BY_TITLE.get(normBillTitle(title)) ?? null
}

export interface BillLink { href: string; external: boolean }

/** Resolve a bill title to its best destination. `readerSlugs` is a
 *  normalised-title → reader-slug map (built once from getApprovedBills()). */
export function resolveBillLink(title: string, readerSlugs: Record<string, string>): BillLink | null {
  const readerSlug = readerSlugs[normBillTitle(title)]
  if (readerSlug) return { href: `/legislation/${readerSlug}`, external: false }
  const b = bill54ByTitle(title)
  if (b?.officialUrl) return { href: b.officialUrl, external: true }
  return null
}
