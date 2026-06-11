'use client'

/**
 * Interactive MMP seat allocator.
 * Move each party's party-vote slider → seats are re-allocated by Sainte-Laguë
 * and animate into the 120-seat hemicycle. Shows the 61-seat majority line.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import {
  SIM_PARTIES, allocate, seatColours, hemicycle, MAJORITY, THRESHOLD_PCT,
} from '@/lib/mmp'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const NEUTRAL = '#e2e1dc'

const defaults = Object.fromEntries(SIM_PARTIES.map((p) => [p.key, p.defaultPct]))

export function SeatAllocator() {
  const [values, setValues] = useState<Record<string, number>>(defaults)

  const geo = useMemo(() => hemicycle(120), [])
  const { seats, sharePct } = useMemo(() => allocate(values), [values])
  const colours = useMemo(() => seatColours(seats), [seats])

  const largest = SIM_PARTIES
    .map((p) => ({ key: p.key, name: p.name, n: seats[p.key] || 0 }))
    .sort((a, b) => b.n - a.n)[0]

  const set = (key: string, v: number) => setValues((prev) => ({ ...prev, [key]: v }))
  const reset = () => setValues(defaults)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Seat Allocator</div>
          <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>Move the party-vote sliders and watch the House fill.</div>
        </div>
        <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 10px', cursor: 'pointer', fontFamily: MANROPE }}>
          <RotateCcw style={{ width: 12, height: 12 }} /> Reset to 2023
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 8 }}>

        {/* Hemicycle */}
        <div style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ width: '100%', maxWidth: 440 }} role="img" aria-label="Parliament seat distribution">
            {geo.seats.map((s, i) => (
              <motion.circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={geo.dotR}
                initial={false}
                animate={{ fill: colours[i] || NEUTRAL }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            ))}
            <text x={geo.width / 2} y={geo.height - 34} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 30, fill: INK }}>120</text>
            <text x={geo.width / 2} y={geo.height - 16} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: TERTIARY }}>seats · 61 to govern</text>
          </svg>
          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, textAlign: 'center' }}>
            Largest party: <b style={{ color: INK }}>{largest.name}</b> with <b style={{ color: INK }}>{largest.n}</b> seats
          </div>
        </div>

        {/* Sliders */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 11, borderLeft: `1px solid ${BORDER}` }}>
          {SIM_PARTIES.map((p) => {
            const share = sharePct[p.key] || 0
            const n = seats[p.key] || 0
            const below = share < THRESHOLD_PCT
            return (
              <div key={p.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 11.5, fontFamily: MANROPE, color: below ? TERTIARY : SECONDARY, whiteSpace: 'nowrap' }}>
                    {share.toFixed(1)}% · <b style={{ color: below ? TERTIARY : INK }}>{below ? '0' : n}</b> seats
                  </div>
                </div>
                <input
                  type="range" min={0} max={50} step={1} value={values[p.key]}
                  onChange={(e) => set(p.key, Number(e.target.value))}
                  aria-label={`${p.name} party vote`}
                  style={{ width: '100%', accentColor: p.color, cursor: 'pointer' }}
                />
                {below && (
                  <div style={{ fontSize: 10.5, color: '#b45309', fontFamily: MANROPE, marginTop: 1 }}>
                    Below the 5% threshold — no list seats
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
