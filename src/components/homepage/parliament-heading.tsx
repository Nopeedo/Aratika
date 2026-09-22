'use client'

/**
 * ParliamentHeading — the seat section's H2, following the party tiles the
 * same way PolicyHubHeading does: "{Party}’s current position over the 2023
 * term", with a feathered wash of that party's colour behind it. Falls back
 * to the plural heading before a party is on screen.
 */

import { usePartyCycle } from '@/components/homepage/party-cycle'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import { INK, MANROPE } from '@/constants/theme'

/** hex → rgba string, for the feathered wash behind the heading. */
function rgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function ParliamentHeading() {
  const { panelSlug, accentColor } = usePartyCycle()
  const name = panelSlug ? PARTY_PROFILES[panelSlug as PartySlug]?.name : null

  return (
    <div style={{ position: 'relative', isolation: 'isolate', marginBottom: 5 }}>
      {/* Same feathered wash as the policy heading — radial and centred, so it
          fades on every edge rather than stopping on a line. */}
      <div aria-hidden style={{
        position: 'absolute', left: '-12%', right: '-12%', top: '-40%', bottom: '-40%',
        background: `radial-gradient(ellipse at center, ${rgba(accentColor, 0.2)}, ${rgba(accentColor, 0)} 70%)`,
        transition: 'background .3s ease-in-out', pointerEvents: 'none', zIndex: -1,
      }} />
      <h2 style={{ position: 'relative', fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
        {name ? `${name}’s current position over the 2023 term` : 'Where the parties stand after 2023'}
      </h2>
    </div>
  )
}
