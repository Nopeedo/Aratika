'use client'

/**
 * CinematicHero — the "threshold" moment. Epic but grounded: gravity, motion and
 * a single clear first action, framed around the voter's own agency (never fear,
 * never partisan). Respects prefers-reduced-motion.
 */

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Compass, ChevronDown } from 'lucide-react'
import { ElectionCountdown } from '@/components/homepage/election-countdown'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function CinematicHero() {
  const reduce = useReducedMotion()
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#0a0c11', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      {/* atmosphere */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1100px 520px at 50% -8%, rgba(31,138,76,.28), transparent 60%), radial-gradient(800px 500px at 85% 110%, rgba(54,224,138,.12), transparent 60%)' }} />
      <div aria-hidden className="bg-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.04 }} />
      {!reduce && (
        <motion.div aria-hidden
          style={{ position: 'absolute', top: '-20%', left: '50%', width: 900, height: 900, marginLeft: -450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,138,76,.18), transparent 65%)', filter: 'blur(20px)' }}
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: 'clamp(72px, 12vh, 130px) 36px clamp(56px, 9vh, 96px)', textAlign: 'center' }}>
        {/* kicker */}
        <motion.div {...rise(0)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 22 }}>
          Aotearoa · 2026 General Election
        </motion.div>

        {/* countdown */}
        <motion.div {...rise(0.08)} className="live-dot" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', borderRadius: 999, padding: '8px 16px', fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#36e08a', display: 'inline-block' }} />
          <ElectionCountdown />
        </motion.div>

        {/* headline */}
        <motion.h1 {...rise(0.16)} style={{ fontSize: 'clamp(34px, 6vw, 68px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, color: '#fff', fontFamily: MANROPE, margin: '0 0 20px' }}>
          The direction of the country
          <br />
          is <span style={{ color: '#36e08a' }}>in your hands.</span>
        </motion.h1>

        {/* subline — PARKED for possible later use. To restore, delete this
            comment wrapper (the two lines below and the closing line) so the
            <motion.p> renders again:
        <motion.p {...rise(0.24)} style={{ fontSize: 'clamp(16px, 2.2vw, 20px)', fontWeight: 500, color: 'rgba(255,255,255,.72)', fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 540, margin: '0 auto 38px' }}>
          Six parties. 72 electorates. One decision — yours. Walk in
          <b style={{ color: '#fff' }}> ready</b>.
        </motion.p>
        */}

        {/* primary action */}
        <motion.div {...rise(0.32)} style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: MANROPE, textDecoration: 'none' }}>
            <Compass style={{ width: 16, height: 16, color: '#36e08a' }} /> New to this? Find what matters to you <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </motion.div>
      </div>

      {/* scroll cue */}
      {!reduce && (
        <motion.div aria-hidden style={{ position: 'absolute', bottom: 18, left: '50%', marginLeft: -10, color: 'rgba(255,255,255,.4)' }} animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown style={{ width: 20, height: 20 }} />
        </motion.div>
      )}
    </section>
  )
}
