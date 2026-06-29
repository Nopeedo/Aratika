'use client'

/**
 * HomeMapFeature — a live, interactive electorate map embedded on the homepage.
 *
 * Reuses the real Leaflet layer (ElectorateMap). Clicking an electorate takes the
 * visitor into the full /map experience focused on that seat, so the homepage map
 * is a genuine entry point, not a screenshot. Loads the general boundaries and
 * quietly falls back to the Māori layer so the map is always alive for preview.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Loader2, MapPinOff, MousePointerClick } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'

const SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ElectorateMap = dynamic(() => import('@/components/map/electorate-map'), {
  ssr: false,
  loading: () => <Centered><Loader2 className="live-dot" style={{ width: 28, height: 28, color: JADE }} /></Centered>,
})

const GENERAL = '/data/general-electorates-2020.geojson'
const MAORI = '/data/maori-electorates-2020.geojson'

export function HomeMapFeature() {
  const router = useRouter()
  const [data, setData] = React.useState<FeatureCollection | null>(null)
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'missing'>('loading')

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      for (const path of [GENERAL, MAORI]) {
        try {
          const res = await fetch(path)
          if (!res.ok) continue
          const json: FeatureCollection = await res.json()
          if (cancelled) return
          setData(json); setStatus('ready'); return
        } catch { /* try next */ }
      }
      if (!cancelled) setStatus('missing')
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 420, borderRadius: 18, overflow: 'hidden', border: `1px solid ${BORDER}`, background: '#eaf2f7', boxShadow: '0 10px 40px rgba(12,14,18,.12)' }}>
      {status === 'loading' && <Centered><Loader2 className="live-dot" style={{ width: 28, height: 28, color: JADE }} /></Centered>}

      {status === 'ready' && data && (
        <ElectorateMap data={data} selectedKey={null} onSelect={(name) => router.push(`/map?search=${encodeURIComponent(name)}`)} />
      )}

      {status === 'missing' && (
        <Centered>
          <div style={{ textAlign: 'center', maxWidth: 280, padding: 24 }}>
            <MapPinOff style={{ width: 26, height: 26, color: TERTIARY, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              The interactive map opens on the full map page.
            </p>
          </div>
        </Centered>
      )}

      {/* Click hint */}
      {status === 'ready' && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '6px 12px', boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
          <MousePointerClick style={{ width: 14, height: 14, color: JADE }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#23262c', fontFamily: MANROPE }}>Click any electorate to explore</span>
        </div>
      )}

      {/* Legend */}
      {status === 'ready' && (
        <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 1000, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 11px', boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 6 }}>Held by</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
            {PARTY_ORDER.map((slug) => (
              <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: SECONDARY, fontFamily: MANROPE }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: PARTY_COLORS[slug].bg, flexShrink: 0 }} />
                {PARTY_PROFILES[slug].name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eaf2f7' }}>
      {children}
    </div>
  )
}
