'use client'

/**
 * ElectorateMap — the Leaflet rendering layer.
 *
 * Client-only (Leaflet needs `window`). Loaded via next/dynamic with
 * ssr:false from MapExperience. Renders electorate boundary polygons from a
 * GeoJSON FeatureCollection, coloured by the holding party, with click-to-select.
 *
 * Boundary geometry: official Stats NZ GeoJSON (General/Māori Electorates 2020).
 * Per-electorate party/MP metadata: electorates-data.ts.
 */

import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

import { PARTY_COLORS } from '@/constants/parties'
import { getElectorate, electorateNameFromProps, normalizeElectorateKey } from '@/constants/electorates-data'

interface ElectorateMapProps {
  data:        FeatureCollection
  selectedKey: string | null
  onSelect:    (name: string) => void
  /** Optional custom fill per electorate name (e.g. by marginality). Falls back to party colour. */
  colorOf?:    (name: string) => string | null
  /** Zoom on scroll wheel. Off for inline embeds so the wheel scrolls the page, not the map. */
  scrollZoom?: boolean
  /**
   * Fit the view to New Zealand instead of the fixed centre/zoom.
   *
   * The default view is tuned for the full-height /map page. Dropped into a
   * short, wide box (the homepage embed) it clips Northland and most of
   * Auckland, which is where a large share of the seats are. Opt-in so the
   * existing callers keep the view they were designed around.
   */
  fitToData?: boolean
}

/**
 * Mainland bounds, hardcoded rather than measured from the layer.
 *
 * getBounds() on the boundary data returns lng -177.36 to 178.84, because the
 * Chatham Islands (part of Rongotai) sit east of the antimeridian. Leaflet
 * reads that as spanning almost the whole globe and fitBounds zooms out to a
 * world view centred off West Africa. The Chathams are off-screen at the
 * default /map zoom too, so nothing is lost by framing the mainland.
 */
const NZ_BOUNDS: [[number, number], [number, number]] = [[-47.9, 166.0], [-33.7, 179.2]]

/** Frames New Zealand in whatever box the map has been given. */
function FitBounds() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(NZ_BOUNDS, { padding: [8, 8] })
  }, [map])
  return null
}

const NEUTRAL_FILL = '#d8d5cf'   // electorate with no verified holder yet

export default function ElectorateMap({ data, selectedKey, onSelect, colorOf, scrollZoom = true, fitToData = false }: ElectorateMapProps) {

  // Style each electorate polygon by holding party (or custom colorOf) + selection state
  function styleFeature(feature?: Feature<Geometry>): PathOptions {
    const name = electorateNameFromProps(feature?.properties as Record<string, unknown>)
    const info = getElectorate(name)
    const isSelected = selectedKey === normalizeElectorateKey(name)

    const fill = colorOf
      ? (colorOf(name) ?? NEUTRAL_FILL)
      : (info?.party ? PARTY_COLORS[info.party].bg : NEUTRAL_FILL)

    return {
      fillColor:   fill,
      fillOpacity: isSelected ? 0.92 : 0.62,
      color:       isSelected ? '#0c0e12' : '#ffffff',
      weight:      isSelected ? 2.5 : 1,
    }
  }

  // Bind hover tooltip + click handler per feature
  function onEachFeature(feature: Feature<Geometry>, layer: Layer) {
    const name = electorateNameFromProps(feature.properties as Record<string, unknown>)

    layer.bindTooltip(name, { sticky: true, direction: 'top', opacity: 0.95 })

    layer.on({
      click: () => onSelect(name),
      mouseover: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle?: (s: PathOptions) => void }
        l.setStyle?.({ fillOpacity: 0.85, weight: 2 })
      },
      mouseout: (e: LeafletMouseEvent) => {
        const l = e.target as { setStyle?: (s: PathOptions) => void }
        const isSelected = selectedKey === normalizeElectorateKey(name)
        l.setStyle?.({
          fillOpacity: isSelected ? 0.92 : 0.62,
          weight: isSelected ? 2.5 : 1,
        })
      },
    })
  }

  return (
    <MapContainer
      center={[-41.0, 173.0]}
      zoom={5}
      minZoom={fitToData ? 3 : 5}
      // Whole-number zoom steps make fitBounds round DOWN to the next level,
      // which left New Zealand at roughly two-thirds the size of its box.
      // Only relaxed where we are fitting; the /map page keeps its integer steps.
      zoomSnap={fitToData ? 0 : 1}
      maxZoom={12}
      style={{ height: '100%', width: '100%', background: '#eaf2f7' }}
      scrollWheelZoom={scrollZoom}
      attributionControl
    >
      {/* Esri's light-gray canvas, not CARTO. CARTO began enforcing API keys
          on its once-open basemaps in late August 2026 and keyless tiles now
          arrive stamped "API KEY REQUIRED" across the map — nothing on our
          side changed. Esri's canvas endpoint is publicly served, keyless,
          and close in tone to the carto light the polygons were tuned over.
          Its scheme is {z}/{y}/{x} (y before x), no {s} or {r}. A Mapbox
          token env exists but holds a placeholder; if a real basemap account
          is ever set up, this is the one line to swap. */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution='Basemap &copy; <a href="https://www.esri.com/">Esri</a> &middot; Boundaries: Stats NZ'
        maxNativeZoom={16}
      />
      {/* Re-key on selection so styles recompute */}
      <GeoJSON
        key={`electorates-${colorOf ? 'm' : 'p'}-${selectedKey ?? 'none'}-${data.features.length}`}
        data={data}
        style={styleFeature as (f?: Feature) => PathOptions}
        onEachFeature={onEachFeature}
      />
      {fitToData && <FitBounds />}
    </MapContainer>
  )
}
