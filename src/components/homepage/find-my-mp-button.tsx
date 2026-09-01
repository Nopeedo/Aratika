/**
 * FindMyMpButton — "find your MP" reduced to one door.
 *
 * This was CORE 3 on the homepage: a full section with a live, interactive
 * electorate map. It came out because it is a SEARCH, not a comparison. The
 * reader already knows their address; the answer is a single lookup, and once
 * they have it they do not come back for it. A screen of homepage was being
 * spent on a question most people answer once.
 *
 * Same shape as the compass entry above it, deliberately — both are "leave the
 * page and do a thing", and they should read as the same kind of offer rather
 * than one being a section and the other a button.
 *
 * The map itself is untouched at /map, with the address search and the official
 * Stats NZ boundaries. This is the way in, not a replacement.
 */

import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { BORDER, CARD_SHADOW, INK, MANROPE, SECONDARY } from '@/constants/theme'

export function FindMyMpButton() {
  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 56px' }}>
        <Link
          href="/map"
          className="party-card"
          style={{
            display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18,
            padding: 'clamp(18px, 3vw, 24px) clamp(18px, 3vw, 26px)', boxShadow: CARD_SHADOW,
          }}
        >
          <span style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin style={{ width: 22, height: 22, color: '#1d4ed8' }} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 'clamp(17px,2.6vw,20px)', fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>
              Find your MP
            </span>
            <span style={{ display: 'block', fontSize: 14, color: SECONDARY, fontFamily: MANROPE, marginTop: 3, lineHeight: 1.5 }}>
              Search your address, or tap your electorate on the map. Boundaries are the 2020 Stats NZ electorates.
            </span>
          </span>
          <ArrowRight style={{ width: 20, height: 20, color: SECONDARY, flexShrink: 0 }} />
        </Link>
      </div>
    </section>
  )
}
