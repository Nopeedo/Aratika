/**
 * /map — Interactive Electorate Map
 *
 * Server shell: metadata + header, then the client MapExperience which renders
 * the Leaflet map, detail panel, layer toggle, and search.
 */

import type { Metadata } from 'next'
import { MapExperience } from '@/components/map/map-experience'
import { SectionDivider } from '@/components/ui/section-divider'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Interactive Electorate Map',
  description:
    'Click anywhere on New Zealand to find your electorate MP, their party, and ' +
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

      {/* Header band */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 32px' }}>
          <div style={{ marginBottom: 10 }}>
            <SectionDivider type="official" label="Official Parliament & Electoral Data" />
          </div>
          <h1 style={{ fontSize: 'clamp(25px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
            Find your MP
          </h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Click any electorate to see who represents that area, their party, and a link to
            their full profile. Boundaries are the official 2020 electorates used for the 2023
            election that elected the current 54th Parliament.
          </p>
        </div>
      </div>

      {/* Interactive map */}
      <MapExperience initialSearch={search} />
    </div>
  )
}
