'use client'

/**
 * BackToParty — the way back to the party page a reader arrived from.
 *
 * Following "Full breakdown" from a party's own policy explorer lands you on
 * the policy hub, which is a page about every party at once. That is the right
 * destination, but the reader asked a question about ONE party and the hub gives
 * them no way back to where they were reading. This carries the provenance in a
 * ?from= parameter and offers the return trip, anchored to the policy section of
 * that party's page rather than its top.
 *
 * Rendered only when ?from= names a party we actually know. The value comes off
 * the URL, so anyone can put anything in it; looking it up in PARTY_NAMES means
 * an unrecognised value renders nothing at all, rather than a link to an
 * arbitrary path or a page that prints back whatever was in the query string.
 *
 * Spacing is left to the caller: on the topic page it sits alone above the
 * heading, and on a party's topic page it shares a row with the existing "all
 * parties" link.
 *
 * A client component reading useSearchParams, wrapped in Suspense by its caller,
 * so the policy pages stay statically generated. Reading searchParams on the
 * server would make every topic page dynamic to add one link.
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { MANROPE, SECONDARY } from '@/constants/theme'

/** The anchor on the party page — its "Where they stand" card. */
export const PARTY_POLICY_ANCHOR = 'where-they-stand'

export function BackToParty() {
  const from = useSearchParams().get('from') ?? ''
  const party = PARTY_NAMES[from as PartySlug]
  if (!party) return null

  return (
    <Link
      href={`/parties/${from}#${PARTY_POLICY_ANCHOR}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none',
      }}
    >
      <ArrowLeft style={{ width: 14, height: 14 }} />
      Back to {party.short}&rsquo;s policies
    </Link>
  )
}
