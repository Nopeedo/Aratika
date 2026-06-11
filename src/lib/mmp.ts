/**
 * MMP teaching helpers — Sainte-Laguë seat allocation + hemicycle geometry.
 * Used by the Learn seat-allocator and build-a-government widgets.
 */

import { PARTY_COLORS } from '@/constants/parties'
import { PartySlug } from '@/types'

export interface SimParty {
  key: PartySlug | 'other'
  name: string
  color: string
  /** default party-vote percentage (approx. 2023 result) */
  defaultPct: number
}

export const SIM_PARTIES: SimParty[] = [
  { key: 'national', name: 'National',      color: PARTY_COLORS.national.bg, defaultPct: 38 },
  { key: 'labour',   name: 'Labour',        color: PARTY_COLORS.labour.bg,   defaultPct: 27 },
  { key: 'green',    name: 'Green',         color: PARTY_COLORS.green.bg,    defaultPct: 12 },
  { key: 'act',      name: 'ACT',           color: PARTY_COLORS.act.bg,      defaultPct: 9 },
  { key: 'nzfirst',  name: 'NZ First',      color: PARTY_COLORS.nzfirst.bg,  defaultPct: 6 },
  { key: 'tpm',      name: 'Te Pāti Māori', color: PARTY_COLORS.tpm.bg,      defaultPct: 3 },
  { key: 'other',    name: 'Other parties', color: '#9aa0aa',                defaultPct: 5 },
]

export const TOTAL_SEATS = 120
export const MAJORITY = 61
export const THRESHOLD_PCT = 5

/** Spectrum order (left → right) for arranging seats in the hemicycle. */
const SPECTRUM: (PartySlug | 'other')[] = ['green', 'labour', 'tpm', 'other', 'nzfirst', 'national', 'act']

export interface AllocationResult {
  seats: Record<string, number>     // key -> seats (qualifying only; others 0)
  qualifying: (PartySlug | 'other')[]
  sharePct: Record<string, number>  // key -> normalised vote share %
}

/** Allocate seats by Sainte-Laguë among parties over the 5% threshold. */
export function allocate(values: Record<string, number>, total = TOTAL_SEATS): AllocationResult {
  const sum = Object.values(values).reduce((a, b) => a + b, 0) || 1
  const sharePct: Record<string, number> = {}
  for (const k of Object.keys(values)) sharePct[k] = (values[k] / sum) * 100

  const qualifying = SIM_PARTIES.map((p) => p.key).filter((k) => sharePct[k] >= THRESHOLD_PCT)
  const seats: Record<string, number> = {}
  qualifying.forEach((k) => (seats[k] = 0))

  for (let i = 0; i < total; i++) {
    let best: string | null = null
    let bestQ = -1
    for (const k of qualifying) {
      const q = values[k] / (2 * seats[k] + 1)
      if (q > bestQ) { bestQ = q; best = k }
    }
    if (best) seats[best]++
  }
  return { seats, qualifying, sharePct }
}

/** Ordered list of seat colours, left→right by political spectrum, for the hemicycle. */
export function seatColours(seats: Record<string, number>): string[] {
  const out: string[] = []
  for (const key of SPECTRUM) {
    const n = seats[key] || 0
    const color = SIM_PARTIES.find((p) => p.key === key)!.color
    for (let i = 0; i < n; i++) out.push(color)
  }
  return out
}

export interface Seat { x: number; y: number }

/** Generate hemicycle seat positions for a given total. */
export function hemicycle(total: number, rows = 6, innerR = 130, rowGap = 26, padding = 14) {
  const radii = Array.from({ length: rows }, (_, i) => innerR + i * rowGap)
  const sumR = radii.reduce((a, b) => a + b, 0)
  let counts = radii.map((r) => Math.max(1, Math.round((total * r) / sumR)))
  let diff = total - counts.reduce((a, b) => a + b, 0)
  let idx = rows - 1
  while (diff !== 0) {
    counts[idx] += diff > 0 ? 1 : -1
    diff += diff > 0 ? -1 : 1
    idx = (idx - 1 + rows) % rows
  }
  const raw: { radius: number; angle: number; row: number }[] = []
  for (let r = 0; r < rows; r++) {
    const n = counts[r]
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0.5 : k / (n - 1)
      raw.push({ radius: radii[r], angle: Math.PI - t * Math.PI, row: r })
    }
  }
  raw.sort((a, b) => (b.angle - a.angle) || (a.row - b.row))
  const outerR = radii[rows - 1]
  const seats: Seat[] = raw.map((s) => ({
    x: outerR + padding + s.radius * Math.cos(s.angle),
    y: outerR + padding - s.radius * Math.sin(s.angle),
  }))
  return { seats, width: (outerR + padding) * 2, height: outerR + padding * 2, dotR: 7.5 }
}
