'use client'

/**
 * HomeMap — the interactive electorate map, embedded INLINE on the homepage so
 * users find their MP without leaving. The map (Leaflet + GeoJSON) is heavy, so
 * it's lazy-mounted the first time the section scrolls near the viewport; until
 * then a light placeholder holds the space (no layout shift). A small link to the
 * full /map page remains for a dedicated view. Plain styling; aesthetics later.
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, ArrowUpRight, Loader2 } from 'lucide-react'

// Keep the map (and Leaflet) out of the homepage bundle — load only when reached.
const MapExperience = dynamic(() => import('@/components/map/map-experience').then((m) => m.MapExperience), { ssr: false })

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function HomeMap() {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setShow(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect() } },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="map" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, scrollMarginTop: 210 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px clamp(18px, 5vw, 36px) 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 10 }}>
              <MapPin style={{ width: 15, height: 15 }} /> Your Electorate
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 30px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Find your MP</h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55, maxWidth: 620 }}>
              Search your address or tap your electorate to see who represents you and what they stand for — right here.
              Boundaries are the official Stats NZ 2020 electorates.
            </p>
          </div>
          <Link href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Open full map <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>

      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: '4px clamp(18px, 5vw, 36px) 48px' }}>
        {show ? (
          <MapExperience embedded />
        ) : (
          <div style={{ height: 'clamp(380px, 54vh, 540px)', borderRadius: 18, border: `1px solid ${BORDER}`, background: '#eaf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: TERTIARY, fontFamily: MANROPE, fontSize: 13, fontWeight: 600 }}>
            <Loader2 className="animate-spin" style={{ width: 18, height: 18, color: JADE }} /> The electorate map loads as you reach it…
          </div>
        )}
      </div>
    </section>
  )
}
