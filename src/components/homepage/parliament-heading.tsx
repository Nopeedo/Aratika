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

/** Every party the heading can name. The box is sized across ALL of them,
 *  not just the one on screen — see the sizers below. */
const HEADING_SLUGS = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm'] as const

/** The heading text for a party. One source for the visible line and the
 *  invisible sizers, so they cannot say different things. */
const headingFor = (slug: string | null): string => {
  const who = slug ? PARTY_PROFILES[slug as PartySlug]?.name : null
  return who ? `${who}’s current position over the 2023 term` : 'Where the parties stand after 2023'
}

export function ParliamentHeading() {
  const { panelSlug, accentColor } = usePartyCycle()

  return (
    <div style={{ position: 'relative', isolation: 'isolate', marginBottom: 5 }}>
      {/* Same feathered wash as the policy heading — radial and centred, so it
          fades on every edge rather than stopping on a line. */}
      <div aria-hidden style={{
        position: 'absolute', left: '-12%', right: '-12%', top: '-40%', bottom: '-40%',
        background: `radial-gradient(ellipse at center, ${rgba(accentColor, 0.2)}, ${rgba(accentColor, 0)} 70%)`,
        transition: 'background .3s ease-in-out', pointerEvents: 'none', zIndex: -1,
      }} />
      {/*
        THIS HEADING USED TO MOVE THE PAGE.

        The party name sits inside the sentence, so a long one wraps to an
        extra line and a short one does not: measured at 126px for Te Pāti
        Māori against 84px for ACT. Switching tiles therefore shifted every
        section below this one.

        Fixed by reserving the tallest variant rather than the current one:
        every party’s heading is rendered into the SAME grid cell, all but
        the real one invisible, so the box is as tall as the longest name
        and does not change when the selection does.

        Sizers rather than a min-height in px, because the font is
        clamp(28px,5.5vw,32px) — it scales with the viewport, so where the
        sentence wraps is width-dependent and no fixed height is right at
        every size.
      */}
      <div style={{ position: 'relative', display: 'grid' }}>
        {HEADING_SLUGS.map((slug) => (
          <h2
            key={slug}
            aria-hidden
            style={{ gridArea: '1 / 1', visibility: 'hidden', pointerEvents: 'none', userSelect: 'none', fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', fontFamily: MANROPE, margin: 0 }}
          >{headingFor(slug)}</h2>
        ))}
        <h2 style={{ gridArea: '1 / 1', fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
          {headingFor(panelSlug)}
        </h2>
      </div>
    </div>
  )
}
