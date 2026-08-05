'use client'

/**
 * CinematicHeroBurnt — THEME PREVIEW copy of CinematicHero, recoloured to the
 * "Burnt Clay" sunrise palette (warm clay base, solid terracotta accents, dark
 * ink text). Structure/layout is identical to cinematic-hero.tsx — ONLY colours
 * changed. Used by /theme-preview so the live hero stays untouched until we
 * decide to adopt it. Respects prefers-reduced-motion.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { DaysFlipCountdown } from '@/components/homepage/days-flip-countdown'
import { usePartyCycle } from '@/components/homepage/party-cycle'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// ── Burnt Clay palette (on white) ──
const INK = '#2A1206'           // deep espresso ink (headline / body)
const TERRACOTTA = '#C2410C'    // solid bold accent

// Accent colour comes from the shared PartyCycle clock (synced with the tiles).
const ACCENT_BLACK = '#141210'   // fade THROUGH near-black between colours (no cross-hue blending)

export function CinematicHeroBurnt() {
  const reduce = useReducedMotion()
  const { accentColor, fading } = usePartyCycle()

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: 'clamp(12px, 2.5vh, 28px) clamp(18px, 5vw, 36px) clamp(10px, 1.8vh, 18px)', textAlign: 'center' }}>
        {/* headline — capped well under the old 120px max so "of the country is"
            never wraps onto its own extra line on wide desktop screens, and the
            whole hero (headline + countdown + subline) fits above the fold. */}
        <motion.h1 {...rise(0.06)} style={{ fontSize: 'clamp(32px,5.2vw,64px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, color: INK, fontFamily: MANROPE, margin: '0 0 clamp(10px, 1.8vh, 20px)' }}>
          The direction
          <br />
          of the country is
          <br />
          {reduce ? (
            <span style={{ color: TERRACOTTA }}>in your hands</span>
          ) : (
            <span style={{ color: fading ? ACCENT_BLACK : accentColor, transition: 'color 1s ease-in-out' }}>
              in your hands
            </span>
          )}
        </motion.h1>

        {/* days-to-election flip countdown — now BELOW the title (per redesign).
            Scaled up (see DaysFlipCountdown) so it reads as a co-equal element
            next to the now-smaller headline, instead of looking tiny under it. */}
        <motion.div {...rise(0.18)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(10px, 1.8vh, 20px)' }}>
          <DaysFlipCountdown />
        </motion.div>

        {/* subline — frames the two ways in: a guided hand, or explore freely */}
        <motion.div {...rise(0.26)} style={{ fontSize: 'clamp(15px,1.7vw,18px)', fontWeight: 600, color: '#5b3d2a', fontFamily: MANROPE, margin: '0 auto', maxWidth: 540, lineHeight: 1.5, textAlign: 'center' }}>
          Get confident with your Vote for 2026 Election
          <br />
          Compare parties below
        </motion.div>

      </div>
    </section>
  )
}
