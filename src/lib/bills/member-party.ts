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

export interface TrackerBills {
  total: number
  /** Led by a minister of this party. The coalition's programme, not the party's alone. */
  government: number
  /** Introduced by a non-minister MP of this party. The one figure that compares
   *  fairly across parties, because any MP can enter the ballot. */
  members: number
  /** Local and private bills — a handful, and not a measure of anything. */
  other: number
  /** …of the total, how many are now law. */
  passed: number
}

/**
 * Per-party bill breakdown, from BILLS_54 — the SAME dataset /bills filters.
 *
 * Deliberately not built on legislativeRecordFor(), which counts a different
 * universe (mps-bill-activity plus the ballot of proposed members' bills, most
 * of which are never introduced). Anything shown next to a link into the tracker
 * has to be counted the way the tracker counts, or the number on the homepage
 * disagrees with the list the reader lands on.
 */
export function trackerBills(): Record<string, TrackerBills> {
  const map = memberPartyMap()
  const out: Record<string, TrackerBills> = {}
  for (const b of BILLS_54) {
    const p = b.member ? map[normMemberName(b.member)] : undefined
    if (!p) continue
    const row = (out[p] ??= { total: 0, government: 0, members: 0, other: 0, passed: 0 })
    row.total++
    if (b.type === 'Government') row.government++
    else if (b.type === "Member's") row.members++
    else row.other++
    if (b.status === 'Royal Assent') row.passed++
  }
  return out
}
