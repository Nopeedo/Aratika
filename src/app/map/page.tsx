/**
 * /map — Interactive Electorate Map
 *
 * Server shell: metadata + header, then the client MapExperience which renders
 * the Leaflet map, detail panel, roll pills, and search.
 */

import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { MapExperience } from '@/components/map/map-experience'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'
import { BackLink } from '@/components/ui/back-link'

export const metadata: Metadata = {
  title: 'Interactive Electorate Map',
  description:
    'Tap anywhere on New Zealand to find your electorate MP, their party, and ' +
    'what they stand for. Boundaries sourced from official Stats NZ data.',
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams

  return (
    <div style={WOVEN_PAGE}>

      {/*
        Header and body sit on ONE pair of vertical lines: 1280 wide with a
        clamp(18px, 5vw, 36px) gutter on both. The body used to be 1280 with a
        clamp(14px, 4vw, 24px) gutter, so the map's left edge sat 3.75px inside
        the title above it on a phone and 12px inside it at 1920 (§5.19).

        1280 rather than /bills' 1080, and this is the page with the reason: at
        1080 the map column is 652px on a 1920 screen, which is a small window
        onto a country that is mostly tall and thin. /battlegrounds, whose
        subject is the ranked list rather than the map, takes the 1080 column.
      */}
      <div>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 20px' }}>
          {/* No "Official Parliament & Electoral Data" divider badge: it was a
              claim about the page rather than a fact about any electorate on
              it, and where the boundaries come from now sits in the (i) with a
              link and a capture date. The /bills precedent. */}
          {/* The six-line standfirst is the (i) beside the title (§1.2). It
              described the control directly below it and then restated the
              boundary provenance, which the Leaflet attribution inside the map
              is legally required to carry anyway. */}
          {/* In the navbar, but also tapped into from the homepage and from
              the electorate prompts on seat pages. */}
          <BackLink fallbackHref="/" label="Back" style={{ fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginBottom: 14 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(25px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0 }}>
              Find your MP
            </h1>
            <InfoButton accent={JADE} label="How to read this map" size={26}>
              <InfoHeading accent={JADE}>How to read this map</InfoHeading>
              <InfoText>
                Tap any electorate to see who represents that area, their party, and a link to
                their full profile. Or type your street, suburb or town into the search box and
                the map will find the electorate it sits inside.
              </InfoText>
              <InfoHeading accent={JADE}>Your electorate MP is not your only MP</InfoHeading>
              <InfoText>
                Under MMP your party vote also elects list MPs, who represent the whole country.
                You are represented by more than just the MP for the seat you live in.
              </InfoText>
              <InfoHeading accent={JADE}>Where the boundaries come from</InfoHeading>
              <InfoText>
                Stats NZ’s official General and Māori Electorates 2020 boundaries: the ones used
                for the 2023 election that elected the current 54th Parliament. They are redrawn
                after each census, so they will change before the 2029 election.
              </InfoText>
            </InfoButton>
          </div>

          {/* One dated source line, in the /bills shape. The page used to state
              "Boundaries: Stats NZ" four times (divider, standfirst, a toolbar
              badge and the Leaflet attribution) and date it nowhere (§4). */}
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0' }}>
            Boundaries: Stats NZ, General and Māori Electorates 2020. Seat holders: Electoral
            Commission 2023 official results, as at July 2026.{' '}
            <a href="https://datafinder.stats.govt.nz/" target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>
              Stats NZ Datafinder <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
            </a>
          </p>
        </div>
      </div>

      {/* Interactive map */}
      <MapExperience initialSearch={search} />
    </div>
  )
}
