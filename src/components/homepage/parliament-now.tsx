'use client'

/**
 * ParliamentNow — "The Parliament you’re voting to change" on the homepage.
 *
 * The same SeatChamber the Election Centre uses, in its `home` variant: the
 * 2023 elected chamber and the seat table, under a homepage-sized heading,
 * with the tabs (polls, build a majority) left to /elections where the
 * caveats around them belong. Not a move — the Election Centre keeps its
 * copy; this is the one-glance version for the front page.
 *
 * The chart and the seat table sit in two containers framed in the selected
 * party's colours, like the party panel above them — hence a client
 * component: it reads the same PartyCycle clock the tiles drive. The only
 * data is the baseline election, which is a constant; the projection props
 * are required by the chart's signature but unused here, so they go empty.
 */

import { usePartyCycle } from '@/components/homepage/party-cycle'
import { PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PROJECTION_SEATS } from '@/constants/polls-data'
import { SeatChamber } from '@/components/elections/seat-chamber'
import { ParliamentHeading } from '@/components/homepage/parliament-heading'
import { SignLink } from '@/components/homepage/compare-sign-link'
import { PartyElectorates } from '@/components/homepage/party-electorates'
import { Landmark } from 'lucide-react'
import type { ReactNode } from 'react'

export function ParliamentNow({ seats, bills }: { seats?: ReactNode; bills?: ReactNode }) {
  const { panelSlug } = usePartyCycle()
  const pc = panelSlug ? PARTY_COLORS[panelSlug as PartySlug] : null
  const base = BASELINE_ELECTION
  if (!base.results || !base.totalSeats) return null
  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px)' }}>
        <SeatChamber
          home
          heading={<ParliamentHeading />}
          highlight={panelSlug ?? undefined}
          frameColor={pc?.bg}
          frameLight={pc?.light}
          elected={base.results}
          electedTotal={base.totalSeats}
          electedYear={base.year}
          electedSlug={base.slug}
          projection={[]}
          projectionTotal={PROJECTION_SEATS}
          asAt=""
        />

        {/* The selected party's own seat count, under the chamber — passed in
            from page.tsx because it is a server component (it reads the tile
            data) and this one is a client component. */}
        {/* The seat count rides UP into the arch's opening; the label and
            the party vote fall below it. A percentage offset, so it tracks
            the chart as it scales rather than drifting at one size. */}
        <div style={{ marginTop: '-13%' }}>{seats}</div>

        {/* What they did with those seats. Moved here from above the news so
            the term reads as one block: how many seats, how they won them,
            which side of the House they sit on, and what they put before it. */}
        {/* Where those seats actually are — the four they hold by the widest
            margin — read straight after the seat count and the side of the
            House they sit on, and before what they have tabled. */}
        <PartyElectorates />

        {bills}

        {/* Out of the section the same way the policy section leaves: a
            party-coloured signpost, under the numbers rather than up by the
            heading. */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
          <SignLink href={`/elections/${base.slug}`} icon={<Landmark style={{ width: 14, height: 14, flexShrink: 0 }} />}>
            Full {base.year} results
          </SignLink>
        </div>
      </div>
    </section>
  )
}
