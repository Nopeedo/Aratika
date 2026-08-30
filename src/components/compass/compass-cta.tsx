'use client'

/**
 * CompassCta — the homepage entry card for the personal compass. Its background
 * fades continuously through all six parliamentary party colours, equal time
 * each, so it stays non-partisan while echoing the hero's colour-cycling
 * headline. Content is white/neutral so it reads on every colour. Honours
 * prefers-reduced-motion (static terracotta, no cycling).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { MANROPE } from '@/constants/theme'

// Deep, white-text-legible versions of each party colour, in seat order.
// ACT's bright yellow is darkened to gold so white text stays readable.
const CYCLE = ['#0A4A8A', '#C01F2A', '#16703C', '#9A7A0E', '#181A1F', '#93101F']

export function CompassCta() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setI((n) => (n + 1) % CYCLE.length), 2800)
    return () => clearInterval(id)
  }, [reduce])

  const bg = reduce ? '#C2410C' : CYCLE[i]

  return (
    // Transparent, not white. The homepage paints one continuous woven
    // background behind every section (see HomeBackground), and a section that
    // fills its own white plus a hairline border cuts a band straight through
    // it — which is exactly what happened when this card was placed above the
    // map. Same convention as PolicyHubGrid. The card itself is untouched.
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(40px, 7vw, 72px) clamp(18px, 5vw, 36px)' }}>
        <div className="party-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, backgroundColor: bg, transition: 'background-color 1.3s ease-in-out' }}>
          {/* fixed dark wash for depth + bottom legibility, regardless of the cycling colour */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, rgba(0,0,0,.04), rgba(0,0,0,.5))' }} />
          {/* Slimmed by request: no icon medallion, no eyebrow, no meta row —
              a headline, one line, one button. The colour-cycling ground was
              always the card's identity; everything else was furniture. */}
          <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(28px, 6vw, 52px)', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: '#fff', fontFamily: MANROPE, lineHeight: 1.1, margin: '0 0 14px' }}>
              Find where you stand
            </h2>
            <p style={{ fontSize: 'clamp(15px, 2.2vw, 17px)', fontWeight: 500, color: 'rgba(255,255,255,.85)', fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 560, margin: '0 auto 24px' }}>
              Take 12 quick questions to see where you line up with each party.
            </p>
            <Link href="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 13, background: '#fff', color: '#1a1208', fontSize: 15.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
              Take the survey <ArrowRight style={{ width: 17, height: 17 }} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
