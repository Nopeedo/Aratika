'use client'

/**
 * SeatMapSection — the electorate map on the Election Centre, closed by default.
 *
 * WHY IT IS CLOSED
 *
 * This map was on this page and was deliberately taken off. The header of
 * upcoming-view.tsx records it: the page ran 7,771px, about 9.6 screens on a
 * phone, and "the BattlegroundsMap embed. 1,070px, the single largest saving on
 * the page." The reasoning was that a map is /battlegrounds' content, and five
 * closest races plus one signpost were this page's share of it.
 *
 * That reasoning still holds for a map that "arrived open", which is what the
 * removed one did. It does not hold for a map nobody has to scroll past: closed,
 * this section is a single row — about 70px — and the 1,070px is spent only by
 * a reader who asked for it. The saving the diet was after is kept; what comes
 * back is the ability to find your own seat without leaving the page.
 *
 * Leaflet is imported dynamically by the map itself, so a closed section costs
 * no map JavaScript either — the bundle is only fetched on open.
 */

import * as React from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { INK, SECONDARY, TERTIARY, BORDER, MANROPE, JADE } from '@/constants/theme'

export function SeatMapSection({ candidatesBySlug }: { candidatesBySlug?: Record<string, Candidate2026[]> }) {
  const [open, setOpen] = React.useState(false)
  // Mounted once opened and never unmounted. Leaflet re-initialising its
  // container on every toggle is what produced the "Map container is already
  // initialized" crash the /map experience had to work around.
  const [everOpened, setEverOpened] = React.useState(false)

  const toggle = () => {
    setOpen((v) => !v)
    setEverOpened(true)
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: MANROPE,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#e8f5ee', flexShrink: 0 }}>
          <MapPin style={{ width: 18, height: 18, color: JADE }} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: INK, lineHeight: 1.3 }}>Find your seat on the map</span>
          <span style={{ display: 'block', fontSize: 13, color: SECONDARY, marginTop: 2, lineHeight: 1.45 }}>
            All 72 electorates, shaded by how close 2023 was. Tap one for who won it, who is standing now, and the full breakdown.
          </span>
        </span>
        <ChevronDown style={{ width: 19, height: 19, color: TERTIARY, flexShrink: 0, transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* hidden, not unmounted — see everOpened above */}
      {everOpened && (
        <div hidden={!open} style={{ borderTop: `1px solid ${BORDER}`, padding: '4px 0 0' }}>
          <BattlegroundsMap candidatesBySlug={candidatesBySlug} />
        </div>
      )}
    </div>
  )
}
