'use client'

/**
 * SeatMapSection — the electorate map on the Election Centre.
 *
 * NO LONGER A CONTAINER. It was a closed accordion — a bordered card with a
 * button, a chevron, and the map itself hidden until tapped — by request,
 * removed: the heading, the description and the map now sit directly on the
 * page like every other block in this section, not behind a fold.
 *
 * The heading changed with it. "Find your seat on the map" assumes "seat"
 * already means something — it's the Parliament word for an electorate, and
 * a reader who doesn't know that yet is exactly who this map is for. The new
 * title names what the map is actually about in plain terms: the area you
 * live in, and who's standing to represent it.
 *
 * Still mounted once and once only (Leaflet re-initialising its container is
 * what produced the "Map container is already initialized" crash /map had to
 * work around), and Leaflet is still imported dynamically inside
 * BattlegroundsMap itself, so this doesn't reintroduce the map's JS bundle
 * on every page load — only its ~1,000px of page height, which a reader now
 * meets directly rather than behind a tap.
 */

import { MapPin } from 'lucide-react'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { INK, SECONDARY, MANROPE, JADE } from '@/constants/theme'

export function SeatMapSection({ candidatesBySlug }: { candidatesBySlug?: Record<string, Candidate2026[]> }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#e8f5ee', flexShrink: 0 }}>
          <MapPin style={{ width: 18, height: 18, color: JADE }} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>The area you vote in</span>
          <span style={{ display: 'block', fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.45 }}>
            All 72 electorates, shaded by how close 2023 was. Tap yours for who won it, who is standing now, and the full breakdown.
          </span>
        </span>
      </div>

      <BattlegroundsMap candidatesBySlug={candidatesBySlug} />
    </div>
  )
}
