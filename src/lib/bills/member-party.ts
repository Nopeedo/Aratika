/**
 * Server-side helpers that map a bill's member-in-charge to a party, so the
 * tracker can be filtered by party (deep-linked via /bills?party=<slug>) and the
 * party page can link through only when that party actually has bills before the
 * House. Imports the full MP dataset — keep this OUT of client components; the
 * client tracker receives the prebuilt map as a prop instead.
 */

import { MP_PROFILES, MP_SLUGS } from '@/constants/mps-data'
import { BILLS_54 } from '@/constants/bills-54'
import { normMemberName } from '@/lib/bills/normalize-member'

/** Normalised MP name → party slug, from current MP profiles. */
export function memberPartyMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const slug of MP_SLUGS) {
    const mp = MP_PROFILES[slug]
    if (!mp) continue
    map[normMemberName(mp.name)] = mp.party
    if (mp.fullName) map[normMemberName(mp.fullName)] = mp.party
  }
  return map
}

/** Party slug → how many bills it has before the House in the tracker dataset.
 *  Distinct from the ballot count on a party page: the ballot holds proposed
 *  members' bills that have NOT been introduced, and most never are. */
export function trackerBillCounts(): Record<string, number> {
  const map = memberPartyMap()
  const counts: Record<string, number> = {}
  for (const b of BILLS_54) {
    const p = b.member ? map[normMemberName(b.member)] : undefined
    if (p) counts[p] = (counts[p] ?? 0) + 1
  }
  return counts
}

/** Party slugs with at least one bill before the House in the tracker dataset. */
export function partiesWithTrackerBills(): Set<string> {
  return new Set(Object.keys(trackerBillCounts()))
}
