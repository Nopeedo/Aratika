'use client'

/**
 * MapExperience — client orchestrator for the interactive electorate map.
 *
 * Holds UI state (selected electorate, general/Māori layer, search), fetches
 * the boundary GeoJSON from /public/data at runtime, and composes the Leaflet
 * map (dynamically imported, ssr:false) with the detail panel.
 *
 * If a boundary file isn't present yet, a clean "data pending" state is shown —
 * we never render placeholder geometry.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Search, Layers, Loader2, MapPinOff, ShieldCheck } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { ElectoratePanel } from './electorate-panel'
import {
  electorateNameFromProps, normalizeElectorateKey,
} from '@/constants/electorates-data'
import { PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Leaflet map — client-only, no SSR
const ElectorateMap = dynamic(() => import('./electorate-map'), {
  ssr: false,
  loading: () => <MapLoading />,
})

type LayerType = 'general' | 'maori'

const GEOJSON_PATHS: Record<LayerType, string> = {
  general: '/data/general-electorates-2020.geojson',
  maori:   '/data/maori-electorates-2020.geojson',
}

export function MapExperience({ initialSearch }: { initialSearch?: string }) {
  const [layer, setLayer]           = React.useState<LayerType>('general')
  const [data, setData]             = React.useState<FeatureCollection | null>(null)
  const [status, setStatus]         = React.useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [selected, setSelected]     = React.useState<string | null>(null)
  const [query, setQuery]           = React.useState(initialSearch ?? '')

  // Fetch boundary GeoJSON when the layer changes
  React.useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setData(null)
    setSelected(null)

    fetch(GEOJSON_PATHS[layer])
      .then((res) => {
        if (res.status === 404) throw new Error('missing')
        if (!res.ok) throw new Error('error')
        return res.json()
      })
      .then((json: FeatureCollection) => {
        if (cancelled) return
        setData(json)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus(err.message === 'missing' ? 'missing' : 'error')
      })

    return () => { cancelled = true }
  }, [layer])

  // Run an initial search once data is ready
  React.useEffect(() => {
    if (status === 'ready' && data && initialSearch) {
      runSearch(initialSearch, data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function runSearch(q: string, fc: FeatureCollection) {
    const needle = q.trim().toLowerCase()
    if (!needle) return
    const match = fc.features.find((f) => {
      const name = electorateNameFromProps(f.properties as Record<string, unknown>).toLowerCase()
      return name.includes(needle)
    })
    if (match) {
      setSelected(electorateNameFromProps(match.properties as Record<string, unknown>))
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (data) runSearch(query, data)
  }

  const selectedKey = selected ? normalizeElectorateKey(selected) : null

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 48px' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {/* Layer toggle */}
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
          {(['general', 'maori'] as LayerType[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
                background: layer === l ? '#ffffff' : 'transparent',
                color: layer === l ? INK : TERTIARY,
                boxShadow: layer === l ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
              }}
            >
              <Layers style={{ width: 14, height: 14 }} />
              {l === 'general' ? 'General' : 'Māori'} electorates
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 220, maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <Search style={{ width: 16, height: 16, color: TERTIARY, margin: '0 10px', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search electorate name…"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }}
            />
            <button type="submit" style={{ border: 'none', background: JADE, color: '#fff', padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: MANROPE, cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </form>

        {/* Official data badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 999, padding: '5px 11px', fontFamily: MANROPE }}>
          <ShieldCheck style={{ width: 13, height: 13 }} />
          Boundaries: Stats NZ (2020)
        </div>
      </div>

      {/* Map + panel grid */}
      <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'stretch' }}>

        {/* Map area */}
        <div style={{
          position: 'relative', height: 620, borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${BORDER}`, boxShadow: '0 2px 4px rgba(12,14,18,.03)', background: '#eaf2f7',
        }}>
          {status === 'loading' && <MapLoading />}
          {status === 'ready' && data && (
            <ElectorateMap data={data} selectedKey={selectedKey} onSelect={setSelected} />
          )}
          {(status === 'missing' || status === 'error') && <MapMissing layer={layer} error={status === 'error'} />}

          {/* Legend */}
          {status === 'ready' && (
            <div style={{
              position: 'absolute', left: 12, bottom: 12, zIndex: 1000,
              background: 'rgba(255,255,255,0.95)', border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '10px 12px', boxShadow: '0 2px 8px rgba(12,14,18,.12)', maxWidth: 220,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 7 }}>
                Held by
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PARTY_ORDER.map((slug) => (
                  <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: PARTY_COLORS[slug].bg, flexShrink: 0 }} />
                    {PARTY_PROFILES[slug].name}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2, paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: '#d8d5cf', flexShrink: 0 }} />
                  Data pending
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel */}
        <div style={{ height: 620, borderRadius: 18, overflow: 'auto', border: `1px solid ${BORDER}`, boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
          <ElectoratePanel electorateName={selected} />
        </div>
      </div>

      {/* Responsive: stack panel under map on narrow screens */}
      <style>{`
        @media (max-width: 880px) {
          .map-grid { grid-template-columns: 1fr !important; }
          .map-grid > div { height: auto !important; }
          .map-grid > div:first-child { height: 460px !important; }
          .map-grid > div:last-child { min-height: 380px; }
        }
      `}</style>
    </div>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────

function MapLoading() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: TERTIARY, zIndex: 1100, background: '#eaf2f7' }}>
      <Loader2 className="live-dot" style={{ width: 30, height: 30, color: JADE }} />
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: MANROPE }}>Loading map…</span>
    </div>
  )
}

function MapMissing({ layer, error }: { layer: LayerType; error: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#eaf2f7' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <MapPinOff style={{ width: 28, height: 28, color: TERTIARY }} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
          {error ? 'Could not load boundaries' : `${layer === 'general' ? 'General' : 'Māori'} electorate boundaries pending`}
        </p>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
          {error
            ? 'The boundary file failed to load. Please try again shortly.'
            : 'The official Stats NZ general-electorate boundaries haven’t been added yet. They render here automatically once the verified 2020 GeoJSON is in place.'}
        </p>
        {!error && layer === 'general' && (
          <p style={{ fontSize: 12.5, color: JADE, fontWeight: 700, fontFamily: MANROPE, marginTop: 14, lineHeight: 1.5 }}>
            Want to see the map working now? Switch to{' '}
            <span style={{ textDecoration: 'underline' }}>Māori electorates</span>{' '}
            above for a live preview.
          </p>
        )}
      </div>
    </div>
  )
}
