/**
 * legislative-record.ts — aggregate each party's bill activity this term from the
 * member-in-charge data (mps-bill-activity + mps-members-bills), keyed by the
 * party of the MP/minister in charge.
 *
 * ⚠ Credibility / fairness:
 *  - Government bills are the GOVERNMENT's (the coalition's) collective programme,
 *    led by a minister who belongs to a party. We attribute by the minister's
 *    party but say so plainly — it's not "that party's bill" alone.
 *  - Opposition parties cannot lead government bills, so a "0" there is a role
 *    difference, NOT inactivity. The component frames it that way.
 *  - The fair cross-party metric is members' bills (any non-minister MP can do one).
 *  - Facts only, no scoring/ranking. Figures to the captured date; verify at source.
 */

import { MP_GOV_BILLS, MP_PASSED_BILLS, BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PROFILES } from '@/constants/mps-data'
import type { PartySlug } from '@/types'

const GOVERNING = new Set<PartySlug>(['national', 'act', 'nzfirst'])
const partyOf = (slug: string): string | null => MP_PROFILES[slug]?.party ?? null

export interface PartyLegislativeRecord {
  governing: boolean
  govBillsLed: number        // government bills led by this party's ministers (incl in progress)
  govBillsPassed: number     // …of which now law (Royal Assent)
  membersInBallot: number    // members' bills by this party's MPs currently in the ballot
  membersPassed: number      // members' bills by this party's MPs that became law this term
  passedMembersBills: string[]
  asOf: string
  sourceUrl: string
}

export function legislativeRecordFor(party: PartySlug): PartyLegislativeRecord {
  let govBillsLed = 0, govBillsPassed = 0, membersInBallot = 0, membersPassed = 0
  const passedMembersBills: string[] = []

  for (const [slug, bills] of Object.entries(MP_GOV_BILLS)) {
    if (partyOf(slug) !== party) continue
    for (const b of bills) {
      if (b.status === 'Terminated') continue
      govBillsLed++
      if (b.status === 'Royal Assent') govBillsPassed++
    }
  }
  for (const [slug, bills] of Object.entries(MP_PASSED_BILLS)) {
    if (partyOf(slug) !== party) continue
    for (const b of bills) { membersPassed++; passedMembersBills.push(b.title) }
  }
  for (const [slug, bills] of Object.entries(MP_MEMBERS_BILLS)) {
    if (partyOf(slug) !== party) continue
    membersInBallot += bills.length
  }

  return {
    governing: GOVERNING.has(party),
    govBillsLed, govBillsPassed, membersInBallot, membersPassed, passedMembersBills,
    asOf: BILL_ACTIVITY_META.asOf, sourceUrl: BILL_ACTIVITY_META.sourceUrl,
  }
}
