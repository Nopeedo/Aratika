'use client'

/**
 * PolicyComparison — side-by-side party positions on one topic, as a mobile-first
 * scannable stacked list (see PartyPositions). A single Plain/Detailed toggle
 * drives the expanded detail. Reads approved, editor-checked positions; parties
 * without one show an honest empty state. Neutral directory order; every row
 * cites its source.
 */

import { useState } from 'react'
import { PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PartyPositions } from '@/components/policy/party-positions'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PolicyComparison({ positions, topicLabel, topic }: { positions: PartyPosition[]; topicLabel: string; topic: string }) {
  const [detailed, setDetailed] = useState(false)
  const current = (slug: string) => {
    const ps = positions.filter((p) => p.party === slug)
    return ps.find((p) => p.period === '2026') ?? ps[0] // prefer current, fall back to 2023 manifesto
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 'clamp(17px, 4.5vw, 20px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.25 }}>Where each party stands on {topicLabel}</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Current stated policy, from each party’s own site. 2023 manifesto positions are being sourced.</p>
        </div>
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3, flexShrink: 0 }}>
          {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
            <button key={o.label} onClick={() => setDetailed(o.k)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
              background: detailed === o.k ? '#fff' : 'transparent', color: detailed === o.k ? INK : TERTIARY,
              boxShadow: detailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <PartyPositions parties={PARTY_DIRECTORY_ORDER} getPos={current} detailed={detailed} topic={topic} topicLabel={topicLabel} />

      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.5 }}>
        Each position is summarised neutrally from the party’s own official policy and checked by an editor before publishing — never paraphrased without the source linked. Arapono is non-partisan.
      </p>
    </div>
  )
}
