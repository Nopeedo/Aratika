'use client'

/**
 * Interactive MMP seat allocator.
 * Move each party's party-vote slider → seats are re-allocated by Sainte-Laguë
 * and animate into the 120-seat hemicycle.
 *
 * The header used to promise a 61-seat majority line. There is no line: the
 * hemicycle draws 120 dots and nothing marks the halfway point. The number is
 * stated under the chart instead, and it now comes from MAJORITY in lib/mmp
 * rather than being typed into the SVG, so the figure and the allocator cannot
 * disagree (§1.3). Drawing the line itself is still owed, and is recorded as
 * such.
 *
 * PHONE. The two columns were a hard-coded inline grid with no phone branch, so
 * at 375px the chart got 135.6px of a 548-unit viewBox: a 71px hemicycle with
 * 1.9px seat dots and a "120" rendering at 7.4px, next to a 120px slider column
 * in which "Te Pāti Māori 3.0% · 0 seats" could not be drawn. Stacked below
 * 600px the chart gets 299.5px and each slider row gets the full width. §3.2
 * is why the rule ships here in a style block rather than in globals.css: this
 * component is styled inline, and an inline style outranks a stylesheet, which
 * is also why every override below carries `!important`.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import {
  SIM_PARTIES, allocate, seatColours, hemicycle, MAJORITY, THRESHOLD_PCT, TOTAL_SEATS,
} from '@/lib/mmp'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { WidgetHeader } from './module-widget-header'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const NEUTRAL = '#e2e1dc'

const defaults = Object.fromEntries(SIM_PARTIES.map((p) => [p.key, p.defaultPct]))

export function SeatAllocator({ accent }: { accent: string }) {
  const [values, setValues] = useState<Record<string, number>>(defaults)

  const geo = useMemo(() => hemicycle(TOTAL_SEATS), [])
  const { seats, sharePct } = useMemo(() => allocate(values), [values])
  const colours = useMemo(() => seatColours(seats), [seats])

  const largest = SIM_PARTIES
    .map((p) => ({ key: p.key, name: p.name, n: seats[p.key] || 0 }))
    .sort((a, b) => b.n - a.n)[0]

  const set = (key: string, v: number) => setValues((prev) => ({ ...prev, [key]: v }))
  const reset = () => setValues(defaults)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, background: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: SA_CSS }} />

      <WidgetHeader
        title="Seat allocator"
        accent={accent}
        infoLabel="How the seat allocator works"
        action={
          /* §3.1: the button is the 44px hit area, the span is the control it
             looks like. Styled at 28px, this rendered 44px tall beside a title,
             which squeezed the heading block and pushed its line to three. */
          <button onClick={reset} style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 10px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
              <RotateCcw style={{ width: 12, height: 12 }} /> Reset to 2023
            </span>
          </button>
        }
      >
        <InfoHeading accent={accent}>Where the sliders start</InfoHeading>
        <InfoText>
          At each party’s share of the party vote in the 2023 general election, rounded to
          whole numbers. Official results, Electoral Commission.
        </InfoText>
        <InfoHeading accent={accent}>The 5% threshold</InfoHeading>
        <InfoText>
          A party under 5% of the party vote wins no list seats here, so its slider fills
          nothing. In a real election it could still get in by winning an electorate, which
          this model does not include: it allocates the {TOTAL_SEATS} seats by party vote
          alone.
        </InfoText>
        <InfoHeading accent={accent}>Which House this is</InfoHeading>
        <InfoText>
          The ordinary House of {TOTAL_SEATS} seats, where {MAJORITY} is a majority. The
          percentage beside each party is its share of the sliders you have set, not the
          official 2023 figure, so it moves as you drag.
        </InfoText>
      </WidgetHeader>

      <div className="sa-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 8 }}>

        {/* Hemicycle */}
        <div className="sa-chart" style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
            <text x={geo.width / 2} y={geo.height - 34} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 30, fill: INK }}>{TOTAL_SEATS}</text>
            <text x={geo.width / 2} y={geo.height - 16} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: TERTIARY }}>seats · {MAJORITY} to govern</text>
          </svg>
          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, textAlign: 'center' }}>
            Largest party: <b style={{ color: INK }}>{largest.name}</b> with <b style={{ color: INK }}>{largest.n}</b> seats
          </div>
        </div>

        {/* Sliders */}
        <div className="sa-sliders" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 11, borderLeft: `1px solid ${BORDER}` }}>
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
                  className="sa-range"
                  style={{ width: '100%', accentColor: p.color, cursor: 'pointer' }}
                />
                {below && (
                  <div style={{ fontSize: 10.5, color: '#b45309', fontFamily: MANROPE, marginTop: 1 }}>
                    Below the {THRESHOLD_PCT}% threshold, no list seats
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

/* Ships with the component and mounted unconditionally (§3.2, §5.15): there is
   only one branch here now, but the bills panel's phone sizing was mounted
   inside one branch and the tallest card on that page never received any of it.

   The rail's border moves from the left edge to the top when the columns
   become rows, because a left rule on a full-width block is a hairline down
   the side of the card.

   Stacking costs height: the chart column was mostly empty space beside the
   sliders and it is now 157px of its own above them. That is the trade the
   whole widget turns on, so the rest of this block buys some of it back out of
   the padding and the gaps rather than out of the type (§2.2: take the space
   between them before you take the size of them).

   The range thumb is ~20px, under the 44px minimum. It is an <input>, so
   globals.css's button rule does not reach it, and §3.1's deliberate scoping
   to <button> means it should not. 30px of height on a phone, where the finger
   is, is the cheap half of the fix; a custom slider is the expensive half and
   is recorded as not done rather than bodged. */
const SA_CSS = `
@media (max-width: 600px) {
  .sa-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
  .sa-chart { padding: 12px 14px 4px !important; }
  .sa-sliders { border-left: none !important; border-top: 1px solid ${BORDER} !important; gap: 9px !important; padding: 14px 16px !important; }
  .sa-range { height: 30px; }
}
`
