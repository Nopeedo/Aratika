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

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { PARTY_COLORS } from '@/constants/parties'
import { getElectorate, electorateNameFromProps, normalizeElectorateKey } from '@/constants/electorates-data'

interface ElectorateMapProps {
  data:        FeatureCollection
  selectedKey: string | null
  onSelect:    (name: string) => void
  /** Optional custom fill per electorate name (e.g. by marginality). Falls back to party colour. */
  colorOf?:    (name: string) => string | null
}

const NEUTRAL_FILL = '#d8d5cf'   // electorate with no verified holder yet

export default function ElectorateMap({ data, selectedKey, onSelect, colorOf }: ElectorateMapProps) {

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
      minZoom={5}
      maxZoom={12}
      style={{ height: '100%', width: '100%', background: '#eaf2f7' }}
      scrollWheelZoom
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        detectRetina
      />
      {/* Re-key on selection so styles recompute */}
      <GeoJSON
        key={`electorates-${colorOf ? 'm' : 'p'}-${selectedKey ?? 'none'}-${data.features.length}`}
        data={data}
        style={styleFeature as (f?: Feature) => PathOptions}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  )
}
