/**
 * SeatHemicycle — static SVG of a Parliament's seats, coloured by party in
 * political-spectrum order. Pure/server component (no client JS).
 */

import { hemicycle } from '@/lib/mmp'
import { PARTY_COLORS } from '@/constants/parties'
import { SPECTRUM_ORDER, type PartyResult } from '@/constants/elections-data'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function SeatHemicycle({ results, total }: { results: PartyResult[]; total: number }) {
  const geo = hemicycle(total)
  const byParty: Record<string, number> = {}
  results.forEach((r) => { byParty[r.party] = r.seats })

  const colours: string[] = []
  for (const p of SPECTRUM_ORDER) {
    const n = byParty[p] || 0
    for (let i = 0; i < n; i++) colours.push(PARTY_COLORS[p].bg)
  }
  const majority = Math.floor(total / 2) + 1

  return (
    <svg viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ width: '100%', maxWidth: 520 }} role="img" aria-label={`Seat distribution — ${total} seats`}>
      {geo.seats.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={geo.dotR} fill={colours[i] || '#e2e1dc'} />
      ))}
      <text x={geo.width / 2} y={geo.height - 30} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 30, fill: '#0c0e12' }}>{total}</text>
      <text x={geo.width / 2} y={geo.height - 13} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: '#9aa0aa' }}>seats · {majority} for a majority</text>
    </svg>
  )
}
