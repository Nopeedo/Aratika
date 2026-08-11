'use client'

/**
 * PolicyHubHeading — the "Where do the parties stand?" H2, but personalised to
 * whichever party is currently selected (auto-cycling or tapped) via the shared
 * PartyCycle clock: "What does {party} stand for?" Falls back to the generic
 * plural heading if no party is active yet.
 */

import { usePartyCycle } from '@/components/homepage/party-cycle'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import { INK } from '@/constants/theme'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

/** hex → rgba string, for the feathered wash behind the heading. */
function rgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function PolicyHubHeading() {
  const { panelSlug, accentColor } = usePartyCycle()
  const name = panelSlug ? PARTY_PROFILES[panelSlug as PartySlug]?.name : null

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }}>
      {/* Feathered wash behind the heading, in the current party's colour, so it
          stands out from the page. Radial + centred so it fades on every edge
          instead of stopping on a hard line. */}
      <div aria-hidden style={{
        position: 'absolute', left: '-12%', right: '-12%', top: '-40%', bottom: '-40%',
        background: `radial-gradient(ellipse at center, ${rgba(accentColor, 0.2)}, ${rgba(accentColor, 0)} 70%)`,
        transition: 'background .3s ease-in-out', pointerEvents: 'none', zIndex: -1,
      }} />
      {/* display:inline so the "Tap an issue below" label below flows onto the
          same line as "stand for?" instead of dropping beneath the whole block.
          It stays a SIBLING of the h2, not a child — it isn't heading text and
          shouldn't be read as part of one. */}
      <h2 style={{ position: 'relative', display: 'inline', fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
        {name ? (
          <>
            What does {name}
            <br className="pe-heading-break" />
            {' '}stand for?
          </>
        ) : 'Where do the parties stand?'}
      </h2>{' '}
      <span style={{ position: 'relative', marginLeft: 12, fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,.9)', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
        Tap an issue below
      </span>
      {/* On mobile "stand for?" always sits on its own second line, so the
          heading's height/shape stays consistent as the party name cycles
          through different lengths — only "What does {name}" reflows. */}
      <style>{`
        .pe-heading-break { display: inline; }
        @media (min-width: 768px) { .pe-heading-break { display: none; } }
      `}</style>
    </div>
  )
}
