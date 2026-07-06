'use client'

/**
 * StartHereCta — the unmistakable first door, directly under the hero subline
 * and above the party tiles. A first-timer's very next move should be "take
 * the compass," not "read a poll." Deliberately compact (a slim strip, not a
 * card) so it doesn't compete with the tiles right below it — the full-size
 * Personal Compass card further down the page still exists for reinforcement.
 */

import Link from 'next/link'
import { Compass, ArrowRight } from 'lucide-react'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const INK = '#2A1206', SUB = '#5b3d2a', JADE = '#1F8A4C'

export function StartHereCta() {
  return (
    <section style={{ background: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) clamp(28px, 4.5vh, 40px)' }}>
        <Link
          href="/start"
          className="party-card"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            background: '#fdf8f1', border: `1.5px solid ${JADE}`, borderRadius: 16,
            padding: '14px 18px',
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 11, background: JADE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Compass style={{ width: 19, height: 19, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>Not sure where to start?</div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: SUB, fontFamily: MANROPE, lineHeight: 1.4, marginTop: 1 }}>
              Move the compass needle — answer a few quick questions and compare every party, side by side.
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, flexShrink: 0, whiteSpace: 'nowrap' }}>
            Start here <ArrowRight style={{ width: 15, height: 15 }} />
          </span>
        </Link>
      </div>
    </section>
  )
}
