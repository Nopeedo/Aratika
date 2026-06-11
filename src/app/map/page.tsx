/**
 * /map — Interactive Electorate Map
 *
 * Server shell: metadata + header, then the client MapExperience which renders
 * the Leaflet map, detail panel, layer toggle, and search.
 */

import type { Metadata } from 'next'
import { MapExperience } from '@/components/map/map-experience'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Interactive Electorate Map',
  description:
    'Click anywhere on New Zealand to find your electorate MP, their party, and ' +
    'what they stand for. Boundaries sourced from official Stats NZ data.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Header band */}
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 36px 32px' }}>
          <div style={{ marginBottom: 10 }}>
            <SectionDivider type="official" label="Official Parliament & Electoral Data" />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
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
