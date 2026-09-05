/**
 * /mps — Members of Parliament directory
 *
 * Lists all current MPs (verified from parliament.nz) with party/role filters
 * and name search. Individual profiles at /mps/[slug].
 */

import type { Metadata } from 'next'
import { MPsDirectory } from '@/components/mps/mps-directory'
import { SectionDivider } from '@/components/ui/section-divider'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Members of Parliament',
  description:
    'Every current Member of Parliament in New Zealand\'s 54th Parliament. ' +
    'Search by name, or filter by party and electorate.',
}

export default async function MPsDirectoryPage({ searchParams }: { searchParams: Promise<{ party?: string }> }) {
  // /mps?party=<slug> — the homepage's "See all N X MPs" link lands on that
  // caucus already filtered. Same deep-link shape as /bills?party=.
  const { party: initialParty } = await searchParams

  return (
    <div style={WOVEN_PAGE}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Members of Parliament
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Every current MP in the <b style={{ color: INK }}>54th Parliament</b>. Search by name or
            electorate, and filter by party. Current roster sourced from parliament.nz.
          </p>
        </div>
      </div>

      {/* Directory */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px) 64px' }}>
        <MPsDirectory initialParty={initialParty} />
      </div>
    </div>
  )
}
