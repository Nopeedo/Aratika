'use client'

/**
 * CinematicHeroBurnt — THEME PREVIEW copy of CinematicHero, recoloured to the
 * "Burnt Clay" sunrise palette (warm clay base, solid terracotta accents, dark
 * ink text). Structure/layout is identical to cinematic-hero.tsx — ONLY colours
 * changed. Used by /theme-preview so the live hero stays untouched until we
 * decide to adopt it. Respects prefers-reduced-motion.
 */

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: 'clamp(16px, 4vh, 44px) clamp(18px, 5vw, 36px) clamp(12px, 2.3vh, 24px)', textAlign: 'center' }}>
        {/* headline */}
        <motion.h1 {...rise(0.06)} style={{ fontSize: 'clamp(35px,8.5vw,120px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.03, color: INK, fontFamily: MANROPE, margin: '0 0 clamp(14px, 2.6vh, 26px)' }}>
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

        {/* days-to-election flip countdown — now BELOW the title (per redesign) */}
        <motion.div {...rise(0.18)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(14px, 2.6vh, 24px)' }}>
          <DaysFlipCountdown />
        </motion.div>

        {/* subline — frames the two ways in: a guided hand, or explore freely */}
        <motion.div {...rise(0.26)} style={{ fontSize: 'clamp(15px,1.7vw,18px)', fontWeight: 600, color: '#5b3d2a', fontFamily: MANROPE, margin: '0 auto clamp(20px, 3vh, 30px)', maxWidth: 540, lineHeight: 1.5, textAlign: 'center' }}>
          Understand the election in minutes, not hours — as simple or as deep as you want.
        </motion.div>

        {/* the single clear choice: a guided hand for first-timers, or free exploration */}
        <motion.div {...rise(0.34)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/guide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 14, background: INK, color: '#fff', fontSize: 'clamp(15px,1.7vw,17px)', fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', boxShadow: '0 6px 20px rgba(42,18,6,.18)' }}>
            Help me get started <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <a href="#parties" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, background: 'transparent', color: INK, fontSize: 'clamp(14px,1.6vw,16px)', fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none', border: '1.5px solid rgba(42,18,6,.18)' }}>
            I&rsquo;ll look around myself
          </a>
        </motion.div>

      </div>
    </section>
  )
}
