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

import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { PEER_HEADING } from './zone-head'
import { INK, SECONDARY, MANROPE } from '@/constants/theme'

export function SeatMapSection({ candidatesBySlug }: { candidatesBySlug?: Record<string, Candidate2026[]> }) {
  return (
    <div>
      {/* Title at PEER_HEADING now, not 15.5px — by request, to match "Where
          the parties are polling for 2026" and every other section heading
          on this page (§4). The icon tile that sat beside it is gone too —
          by request, and it also fixes a real collision: at PEER_HEADING's
          22-24px the two-line title started overlapping the 36px icon box
          next to it, which was sized for the old 15.5px caption. */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: PEER_HEADING, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.15 }}>The area you vote in</h2>
        {/* "Shaded by how close 2023 was" stopped being true of the default
            view when the map started opening on candidates — the sentence
            now describes what's on screen, and the toggle above the map
            names the other view itself. */}
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.45 }}>
          All 72 electorates, shaded by how many candidates are standing. Tap an area on the map to see who is running
          for local MP.
        </p>
      </div>

      {/* Opens on Wellington Central, the capital's electorate, by request, so
          the card below shows who's running somewhere before the first tap. */}
      <BattlegroundsMap candidatesBySlug={candidatesBySlug} defaultView="candidates" defaultSelected="Wellington Central" />
    </div>
  )
}
