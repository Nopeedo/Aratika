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
    <section style={{ position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: 'clamp(24px, 4vh, 44px) clamp(18px, 5vw, 36px) clamp(14px, 2.3vh, 24px)', textAlign: 'center' }}>
        {/* days-to-election flip countdown — above the title */}
        <motion.div {...rise(0)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <DaysFlipCountdown />
        </motion.div>

        {/* headline */}
        <motion.h1 {...rise(0.16)} style={{ fontSize: 'clamp(40px, 8.5vw, 104px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.03, color: INK, fontFamily: MANROPE, margin: '0 0 20px' }}>
          The direction
          <br />
          of the country is
          <br />
          {reduce ? (
            <span style={{ color: TERRACOTTA }}>in your hands.</span>
          ) : (
            <span style={{ color: fading ? ACCENT_BLACK : accentColor, transition: 'color 1s ease-in-out' }}>
              in your hands.
            </span>
          )}
        </motion.h1>

        {/* small subline under the title — two lines, never wider than the headline */}
        <motion.div {...rise(0.22)} style={{ fontSize: 'clamp(13px, 1.6vw, 15px)', fontWeight: 700, color: '#5b3d2a', fontFamily: MANROPE, margin: '0 auto 30px', maxWidth: 360, lineHeight: 1.5, textAlign: 'center' }}>
          <div>Compare Parties, Policies &amp; Electorates</div>
          <div style={{ marginTop: 3 }}>Vote with confidence</div>
        </motion.div>

        {/* subline — PARKED for possible later use. To restore, delete this
            comment wrapper (the two lines below and the closing line) so the
            <motion.p> renders again:
        <motion.p {...rise(0.24)} style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: 500, color: '#5b3d2a', fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 540, margin: '0 auto 38px' }}>
          Six parties. 72 electorates. One decision — yours. Walk in
          <b style={{ color: INK }}> ready</b>.
        </motion.p>
        */}

      </div>
    </section>
  )
}
