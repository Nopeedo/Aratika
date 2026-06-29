/**
 * IndicatorChart — a small, dependency-free bar chart for one economic series.
 * Pure SVG, server-rendered. Neutral slate bars (no party colour, no green
 * "good/bad" implication). A dashed guide marks where the current government
 * formed (chronological context only — not a causal claim).
 */

import type { EconSeries } from '@/constants/economic-data'

const SLATE = '#64748b', SLATE_DARK = '#334155', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// The government formed late Nov 2023, so 2024 is its first full year.
const TERM_FROM = 2024

export function IndicatorChart({ series }: { series: EconSeries }) {
  const pts = series.points
  if (pts.length === 0) return null

  const W = 340, H = 150
  const padL = 6, padR = 6, padT = 22, padB = 20
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const values = pts.map((p) => p.value)
  const domainMin = Math.min(0, ...values)
  const domainMax = Math.max(...values)
  const span = domainMax - domainMin || 1
  const y = (v: number) => padT + plotH * (1 - (v - domainMin) / span)
  const y0 = y(0)

  const slot = plotW / pts.length
  const barW = Math.min(38, slot * 0.56)

  // Guide line between the last pre-term year and the first term year.
  const termIdx = pts.findIndex((p) => p.year >= TERM_FROM)
  const guideX = termIdx > 0 ? padL + termIdx * slot : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${series.name} by year`} style={{ display: 'block' }}>
      {/* baseline */}
      <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke={BORDER} strokeWidth={1} />

      {/* term guide */}
      {guideX !== null && (
        <>
          <line x1={guideX} y1={padT - 14} x2={guideX} y2={H - padB} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
          <text x={guideX + 3} y={padT - 16} fontSize={8.5} fill={TERTIARY} fontFamily={MANROPE} fontWeight={700}>Govt formed</text>
        </>
      )}

      {pts.map((p, i) => {
        const cx = padL + i * slot + slot / 2
        const top = y(p.value)
        const barTop = Math.min(top, y0)
        const barH = Math.abs(top - y0)
        const isTerm = p.year >= TERM_FROM
        const isLatest = i === pts.length - 1
        const fill = isLatest ? SLATE_DARK : isTerm ? SLATE : '#cbd5e1'
        const labelY = p.value >= 0 ? top - 4 : top + 11
        return (
          <g key={p.year}>
            <rect x={cx - barW / 2} y={barTop} width={barW} height={Math.max(barH, 1)} rx={2} fill={fill} />
            <text x={cx} y={labelY} fontSize={9.5} fontWeight={700} fill={SLATE_DARK} fontFamily={MANROPE} textAnchor="middle">
              {p.value.toFixed(1)}
            </text>
            <text x={cx} y={H - 6} fontSize={9} fill={TERTIARY} fontFamily={MANROPE} textAnchor="middle">
              {String(p.year).slice(2)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
