'use client'

/**
 * BattlegroundsMap — the electorate map recoloured by 2023 marginality.
 *
 * Māori and general electorates overlap geographically (same land, different
 * roll), so — like the main map — we show ONE roll at a time via a toggle.
 * Each seat is coloured by how close its 2023 contest was and links to its
 * battle page.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Loader2, ArrowRight, ShieldCheck, MapPinOff, Layers } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { normalizeElectorateKey, getElectorate } from '@/constants/electorates-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MARGIN_TIERS, classifyMargin, marginColorByName } from '@/lib/battlegrounds'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

type Layer = 'general' | 'maori'
const PATHS: Record<Layer, string> = {
  general: '/data/general-electorates-2020.geojson',
  maori: '/data/maori-electorates-2020.geojson',
}

const ElectorateMap = dynamic(() => import('@/components/map/electorate-map'), { ssr: false, loading: () => <Loading /> })

export function BattlegroundsMap({ embedded = false }: { embedded?: boolean }) {
  const [layer, setLayer] = React.useState<Layer>('general')
  const [sets, setSets] = React.useState<Record<Layer, FeatureCollection | null>>({ general: null, maori: null })
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [selected, setSelected] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(PATHS.general).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(PATHS.maori).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([g, m]) => {
      if (cancelled) return
      setSets({ general: g, maori: m })
      setStatus(g || m ? 'ready' : 'error')
    })
    return () => { cancelled = true }
  }, [])

  const data = sets[layer]
  const selectedKey = selected ? normalizeElectorateKey(selected) : null
  const info = selected ? getElectorate(selected) : null
  const tier = info ? classifyMargin(info.majority) : null

  const switchLayer = (l: Layer) => { setLayer(l); setSelected(null) }
  const mapHeight = embedded ? 'clamp(380px, 54vh, 540px)' : 600

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
          {(['general', 'maori'] as Layer[]).map((l) => (
            <button key={l} onClick={() => switchLayer(l)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
              background: layer === l ? '#fff' : 'transparent', color: layer === l ? INK : TERTIARY,
              boxShadow: layer === l ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
            }}>
              <Layers style={{ width: 14, height: 14 }} />{l === 'general' ? 'General' : 'Māori'} electorates
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>
          The two rolls cover the same land — view one at a time.
        </span>
      </div>

      <div
        className={embedded ? 'map-grid-embed' : 'map-grid'}
        style={embedded
          ? { display: 'flex', flexDirection: 'column', gap: 14 }
          : { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'stretch' }}
      >
        {/* Map */}
        <div style={{ position: 'relative', height: mapHeight, borderRadius: 18, overflow: 'hidden', border: `1px solid ${BORDER}`, background: '#eaf2f7' }}>
          {status === 'loading' && <Loading />}
          {status === 'ready' && data && <ElectorateMap key={layer} data={data} selectedKey={selectedKey} onSelect={setSelected} colorOf={marginColorByName} />}
          {status === 'ready' && !data && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: TERTIARY }}>
              <MapPinOff style={{ width: 26, height: 26 }} />
              <span style={{ fontSize: 13, fontFamily: MANROPE }}>{layer === 'maori' ? 'Māori' : 'General'} boundaries not available.</span>
            </div>
          )}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: TERTIARY }}>
              <MapPinOff style={{ width: 26, height: 26 }} />
              <span style={{ fontSize: 13, fontFamily: MANROPE }}>Boundary data could not be loaded.</span>
            </div>
          )}

          {/* Legend */}
          {status === 'ready' && data && (
            <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 1000, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 12px', boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 7 }}>2023 margin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {MARGIN_TIERS.map((t) => (
                  <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: t.color, flexShrink: 0 }} />{t.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel — full side column normally; embedded shows it below the map only once a seat is picked. */}
        {embedded && !selected ? null : (
        <div style={{ height: embedded ? 'auto' : 600, maxHeight: embedded ? 420 : undefined, borderRadius: 18, border: `1px solid ${BORDER}`, background: '#fff', padding: 20, overflow: 'auto' }}>
          {!selected ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: TERTIARY, fontFamily: MANROPE }}>
              <ShieldCheck style={{ width: 26, height: 26, color: JADE, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: SECONDARY }}>Tap a seat</div>
              <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 220 }}>Hotter colours are the closest 2023 contests — the seats most likely to change hands.</div>
            </div>
          ) : (
            <div style={{ fontFamily: MANROPE }}>
              {tier && <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#fff', background: tier.color, borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>{tier.label}</span>}
              <h3 style={{ fontSize: 20, fontWeight: 800, color: INK, margin: '0 0 2px' }}>{selected}</h3>
              <div style={{ fontSize: 12.5, color: TERTIARY, marginBottom: 14 }}>{info?.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info?.region ? ` · ${info.region}` : ''}</div>
              {info ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Row label="2023 winner" value={info.mpName ?? '—'} />
                  <Row label="Party" value={info.party ? PARTY_NAMES[info.party].short : '—'} color={info.party ? PARTY_COLORS[info.party].bg : undefined} />
                  <Row label="Majority" value={info.majority != null ? info.majority.toLocaleString('en-NZ') : '—'} />
                  <Link href={`/battlegrounds/${selectedKey}`} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#fff', background: INK, borderRadius: 11, padding: '11px 16px', textDecoration: 'none' }}>
                    View this battle <ArrowRight style={{ width: 15, height: 15 }} />
                  </Link>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: SECONDARY }}>Result data pending for this seat.</p>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      <style>{`@media (max-width: 880px){ .map-grid{ grid-template-columns:1fr !important } .map-grid > div{ height:auto !important } .map-grid > div:first-child{ height:440px !important } }`}</style>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>
      <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
        {color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />}{value}
      </span>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: TERTIARY, background: '#eaf2f7' }}>
      <Loader2 className="live-dot" style={{ width: 28, height: 28, color: JADE }} />
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: MANROPE }}>Loading map…</span>
    </div>
  )
}
