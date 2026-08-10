/**
 * PartyCaucus — the party's MPs in the 54th Parliament.
 *
 * Replaces a placeholder that said the list was "pending the Parliament API".
 * That stopped being true: mps-data.ts carries all 123 sitting MPs with party,
 * electorate and photo, verified against parliament.nz.
 *
 * Lists every MP rather than a capped preview. /mps filters by party in the
 * client only — no URL parameter — so a "see all" link would land on the
 * unfiltered directory, which is the trap the bills tracker just had.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MP_PROFILES, MP_SLUGS } from '@/constants/mps-data'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'

const INK = '#2A1206', SECONDARY = '#6b6157', TERTIARY = '#9a9186', BORDER = '#e6e2da'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PartyCaucus({ party, partyName, seats }: { party: PartySlug; partyName: string; seats: number }) {
  const mps = MP_SLUGS.map((s) => MP_PROFILES[s]).filter((mp) => mp?.party === party)
  if (mps.length === 0) return null

  // Electorate MPs first — they hold a seat directly, and the electorate name is
  // how most people find their own MP.
  const ordered = [...mps].sort((a, b) => {
    if (!!a.electorate !== !!b.electorate) return a.electorate ? -1 : 1
    return (a.electorate || a.name).localeCompare(b.electorate || b.name)
  })

  return (
    <>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 12px' }}>
        {partyName} holds <b style={{ color: INK }}>{seats}</b> seat{seats === 1 ? '' : 's'} in the 54th Parliament.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ordered.map((mp, i) => (
          <Link key={mp.slug} href={`/mps/${mp.slug}`} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`, textDecoration: 'none',
          }}>
            <Avatar name={mp.name} party={party} src={mp.photo} size="sm" face />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{mp.name}</span>
              <span style={{ display: 'block', fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 1 }}>
                {mp.electorate ?? 'List MP'}
              </span>
            </span>
            <ArrowRight style={{ width: 13, height: 13, color: TERTIARY, flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      {/* The roster is people, and people resign, retire and win by-elections —
          so say when it was last checked rather than implying it's live. */}
      {mps.length !== seats && (
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '12px 0 0', fontStyle: 'italic' }}>
          Showing {mps.length} of {seats} seats — the balance is vacant or pending verification.
        </p>
      )}
    </>
  )
}
